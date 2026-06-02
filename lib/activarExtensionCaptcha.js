const sleep = function (ms) {

  return new Promise(function (resolve) {

    setTimeout(resolve, ms);

  });

};



function obtenerExtensionId(browser) {

  var targets = browser.targets();

  var i;

  for (i = 0; i < targets.length; i++) {

    var url = targets[i].url() || "";

    var m = url.match(/^chrome-extension:\/\/([^/]+)\//);

    if (m) return m[1];

  }

  return null;

}



/**

 * Enciende "Solver Switch" una sola vez (sin duplicar clic + storage).

 */

async function activarExtensionSolver(browser, opciones) {

  var esperaInicial =

    opciones && opciones.esperaInicialMs ? opciones.esperaInicialMs : 3500;

  await sleep(esperaInicial);



  var extId = obtenerExtensionId(browser);

  if (!extId) {

    console.log(

      "No se detectó ID de extensión; abra el popup del solver una vez si falla el captcha."

    );

    return false;

  }



  console.log("Activando extensión CAPTCHA Solver (ID " + extId + ")...");



  var popupPage = null;

  try {

    popupPage = await browser.newPage();

    await popupPage.goto(

      "chrome-extension://" + extId + "/popup/popup.html",

      { waitUntil: "domcontentloaded", timeout: 30000 }

    );



    await popupPage.waitForSelector(".el-switch", {

      visible: true,

      timeout: 20000,

    });



    var estado = await popupPage.evaluate(function () {

      var sw = document.querySelector(".el-switch");

      if (!sw) return { found: false };

      return {

        found: true,

        activo: sw.classList.contains("is-checked"),

      };

    });



    if (!estado.found) {

      console.log("No se encontró el interruptor Solver en el popup.");

      return false;

    }



    if (estado.activo) {

      console.log("Solver Switch ya estaba activado (sin segundo clic).");

      return true;

    }



    var clickTarget = await popupPage.$(".el-switch .el-switch__core");

    if (clickTarget) {

      await clickTarget.click();

    } else {

      await popupPage.click(".el-switch");

    }

    await sleep(800);

    console.log("Solver Switch activado (un solo clic).");



    return true;

  } catch (err) {

    console.log(

      "No se pudo activar la extensión automáticamente:",

      err.message || err

    );

    return false;

  } finally {

    if (popupPage) {

      try {

        await popupPage.close();

      } catch (e) {}

    }

  }

}



module.exports = {

  activarExtensionSolver: activarExtensionSolver,

  obtenerExtensionId: obtenerExtensionId,

};

