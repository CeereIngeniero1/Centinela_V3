const https = require("https");
const { URL } = require("url");

const API_IN = "https://2captcha.com/in.php";
const API_RES = "https://2captcha.com/res.php";

const sleep = function (ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
};

function httpsGetJson(urlString) {
  return new Promise(function (resolve, reject) {
    const url = new URL(urlString);
    https
      .get(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          protocol: url.protocol,
          timeout: 30000,
        },
        function (res) {
          var body = "";
          res.setEncoding("utf8");
          res.on("data", function (chunk) {
            body += chunk;
          });
          res.on("end", function () {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error("Respuesta 2Captcha no es JSON: " + body));
            }
          });
        }
      )
      .on("error", reject)
      .on("timeout", function () {
        reject(new Error("Timeout al llamar 2Captcha"));
      });
  });
}

function buildQuery(params) {
  return Object.keys(params)
    .map(function (key) {
      return (
        encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key]))
      );
    })
    .join("&");
}

/**
 * Resuelve reCAPTCHA v2 vía 2Captcha (userrecaptcha).
 * Compatible con Node 14+ (solo módulos nativos https/url).
 * Requiere CAPTCHA_2_API_KEY en .env — https://2captcha.com
 */
async function solveRecaptchaV2TwoCaptcha(apiKey, siteKey, pageUrl) {
  if (!apiKey) {
    throw new Error(
      "Falta CAPTCHA_2_API_KEY en .env (cuenta en https://2captcha.com)"
    );
  }
  if (!siteKey) {
    throw new Error("No se encontró data-sitekey del reCAPTCHA en la página");
  }

  var createQuery = buildQuery({
    key: apiKey,
    method: "userrecaptcha",
    googlekey: siteKey,
    pageurl: pageUrl,
    json: 1,
  });

  var createData = await httpsGetJson(API_IN + "?" + createQuery);

  if (createData.status !== 1) {
    throw new Error(
      "2Captcha in.php: " +
        (createData.request || JSON.stringify(createData))
    );
  }

  var taskId = createData.request;
  console.log("2Captcha: tarea " + taskId + ", esperando token...");

  var maxAttempts = 40;
  var i;
  for (i = 0; i < maxAttempts; i++) {
    await sleep(5000);
    var pollQuery = buildQuery({
      key: apiKey,
      action: "get",
      id: taskId,
      json: 1,
    });
    var resData = await httpsGetJson(API_RES + "?" + pollQuery);

    if (resData.status === 1) {
      return resData.request;
    }
    if (resData.request !== "CAPCHA_NOT_READY") {
      throw new Error("2Captcha res.php: " + resData.request);
    }
  }

  throw new Error("2Captcha: tiempo agotado esperando el token");
}

function extraerSiteKeyDeUrl(url) {
  if (!url) return null;
  var m = url.match(/[?&]k=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function getRecaptchaSiteKey(page) {
  var fromPage = await page.evaluate(function () {
    var withKey = document.querySelector("[data-sitekey]");
    if (withKey) return withKey.getAttribute("data-sitekey");

    var iframes = document.querySelectorAll("iframe");
    for (var i = 0; i < iframes.length; i++) {
      var src = iframes[i].src || "";
      var title = (iframes[i].title || "").toLowerCase();
      if (
        src.indexOf("recaptcha") !== -1 ||
        title.indexOf("recaptcha") !== -1
      ) {
        var m = src.match(/[?&]k=([^&]+)/);
        if (m) return decodeURIComponent(m[1]);
      }
    }
    return null;
  });

  if (fromPage) return fromPage;

  var frames = page.frames();
  var f;
  for (f = 0; f < frames.length; f++) {
    var key = extraerSiteKeyDeUrl(frames[f].url());
    if (key) return key;
  }
  return null;
}

var IFRAME_RECAPTCHA_SELECTORS = [
  'iframe[title="reCAPTCHA"]',
  'iframe[src*="recaptcha/api2/anchor"]',
  'iframe[src*="google.com/recaptcha"]',
  ".g-recaptcha iframe",
  'iframe[src*="recaptcha"]',
];

var ANCHOR_SELECTORS =
  "#recaptcha-anchor.recaptcha-checkbox, #recaptcha-anchor, .recaptcha-checkbox-unchecked";

function recolectarFrames(frame, lista) {
  lista.push(frame);
  var hijos = frame.childFrames();
  var i;
  for (i = 0; i < hijos.length; i++) {
    recolectarFrames(hijos[i], lista);
  }
  return lista;
}

async function buscarIframeRecaptchaEnPagina(page) {
  var s;
  for (s = 0; s < IFRAME_RECAPTCHA_SELECTORS.length; s++) {
    var handle = await page.$(IFRAME_RECAPTCHA_SELECTORS[s]);
    if (handle) return handle;
  }
  return null;
}

async function buscarAnchorEnTodosLosFrames(page) {
  var todos = recolectarFrames(page.mainFrame(), []);
  var i;
  for (i = 0; i < todos.length; i++) {
    try {
      var anchor = await todos[i].$(ANCHOR_SELECTORS);
      if (anchor) {
        return { frame: todos[i], anchorHandle: anchor };
      }
    } catch (err) {
      // frame aún no listo
    }
  }
  return null;
}

/**
 * Espera el checkbox real (#recaptcha-anchor) dentro del iframe de Google.
 * No basta con [data-sitekey] en el HTML: el widget tarda en pintarse.
 */
async function esperarRecaptchaCargado(page, timeoutMs) {
  var timeout = timeoutMs || 60000;
  var paso = 500;
  var transcurrido = 0;

  console.log(
    "Esperando checkbox reCAPTCHA (#recaptcha-anchor en iframe)..."
  );

  while (transcurrido < timeout) {
    var encontrado = await buscarAnchorEnTodosLosFrames(page);
    if (encontrado) {
      console.log(
        "reCAPTCHA listo: #recaptcha-anchor visible en iframe (" +
          (encontrado.frame.url() || "sin url") +
          ")"
      );
      return encontrado;
    }

    var iframeHandle = await buscarIframeRecaptchaEnPagina(page);
    if (iframeHandle) {
      var frame = await iframeHandle.contentFrame();
      if (frame) {
        try {
          await frame.waitForSelector(ANCHOR_SELECTORS, {
            visible: true,
            timeout: paso + 200,
          });
          console.log("reCAPTCHA listo: anchor detectado vía contentFrame");
          return { frame: frame, anchorHandle: await frame.$(ANCHOR_SELECTORS) };
        } catch (waitErr) {
          // sigue el bucle
        }
      }
    }

    await page.waitForTimeout(paso);
    transcurrido += paso;
  }

  throw new Error(
    "No apareció #recaptcha-anchor en el iframe de reCAPTCHA tras " +
      timeout / 1000 +
      " s"
  );
}

async function injectRecaptchaToken(page, token) {
  await page.evaluate(function (t) {
    function setValue(el) {
      if (!el) return;
      el.value = t;
      el.innerHTML = t;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }

    setValue(document.getElementById("g-recaptcha-response"));
    var textareas = document.querySelectorAll(
      'textarea[name="g-recaptcha-response"]'
    );
    for (var i = 0; i < textareas.length; i++) {
      setValue(textareas[i]);
    }

    function findCallback(obj, depth) {
      if (depth === undefined) depth = 0;
      if (!obj || depth > 8) return null;
      if (typeof obj === "function") return null;
      if (typeof obj === "object") {
        if (typeof obj.callback === "function") return obj.callback;
        var keys = Object.keys(obj);
        for (var k = 0; k < keys.length; k++) {
          var found = findCallback(obj[keys[k]], depth + 1);
          if (found) return found;
        }
      }
      return null;
    }

    if (window.___grecaptcha_cfg && window.___grecaptcha_cfg.clients) {
      var clientIds = Object.keys(window.___grecaptcha_cfg.clients);
      for (var c = 0; c < clientIds.length; c++) {
        var cb = findCallback(window.___grecaptcha_cfg.clients[clientIds[c]]);
        if (cb) {
          cb(t);
          return;
        }
      }
    }
  }, token);
}

module.exports = {
  solveRecaptchaV2TwoCaptcha: solveRecaptchaV2TwoCaptcha,
  getRecaptchaSiteKey: getRecaptchaSiteKey,
  injectRecaptchaToken: injectRecaptchaToken,
  esperarRecaptchaCargado: esperarRecaptchaCargado,
  buscarAnchorEnTodosLosFrames: buscarAnchorEnTodosLosFrames,
};
