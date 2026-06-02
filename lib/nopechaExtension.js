const fs = require("fs");
const path = require("path");

const NOPECHA_DIR = path.join(__dirname, "..", "exte", "nopecha");
const NOPECHA_SETUP_URL = "https://nopecha.com/setup";

function obtenerRutaExtensionNopecha() {
  if (!fs.existsSync(NOPECHA_DIR)) {
    return null;
  }
  var manifest = path.join(NOPECHA_DIR, "manifest.json");
  if (fs.existsSync(manifest)) {
    return NOPECHA_DIR;
  }
  var sub = path.join(NOPECHA_DIR, "chromium");
  if (fs.existsSync(path.join(sub, "manifest.json"))) {
    return sub;
  }
  return null;
}

function extensionInstalada() {
  return obtenerRutaExtensionNopecha() !== null;
}

/**
 * Configura la extensión (clave opcional). Ver:
 * https://developers.nopecha.com/guides/extension/
 */
async function configurarNopecha(browser) {
  var setupPage = null;
  try {
    var key = process.env.NOPECHA_KEY || "";
    var url = NOPECHA_SETUP_URL + (key ? "#" + key : "");
    setupPage = await browser.newPage();
    console.log("Configurando NopeCHA:", NOPECHA_SETUP_URL);
    await setupPage.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await setupPage.waitForTimeout(2500);
    console.log("NopeCHA listo (resolverá captchas en la pestaña del trámite).");
    return true;
  } catch (err) {
    console.log("Aviso configuración NopeCHA:", err.message || err);
    return false;
  } finally {
    if (setupPage) {
      try {
        await setupPage.close();
      } catch (e) {}
    }
  }
}

module.exports = {
  NOPECHA_DIR: NOPECHA_DIR,
  obtenerRutaExtensionNopecha: obtenerRutaExtensionNopecha,
  extensionInstalada: extensionInstalada,
  configurarNopecha: configurarNopecha,
};
