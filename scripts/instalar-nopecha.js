/**
 * Descarga NopeCHA para Chromium (Puppeteer / Edge).
 * Fuente: https://github.com/NopeCHALLC/nopecha-extension/releases
 * Docs: https://developers.nopecha.com/guides/extension/
 */
const fs = require("fs");
const https = require("https");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const EXTE_DIR = path.join(ROOT, "exte");
const ZIP_PATH = path.join(EXTE_DIR, "nopecha-chromium.zip");
const DEST = path.join(EXTE_DIR, "nopecha");
const URL =
  "https://github.com/NopeCHALLC/nopecha-extension/releases/latest/download/chromium.zip";

function download(url, dest) {
  return new Promise(function (resolve, reject) {
    function get(u) {
      https
        .get(u, function (res) {
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            get(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error("HTTP " + res.statusCode + " al descargar"));
            return;
          }
          var file = fs.createWriteStream(dest);
          res.pipe(file);
          file.on("finish", function () {
            file.close(resolve);
          });
        })
        .on("error", reject);
    }
    get(url);
  });
}

function limpiarDestino() {
  if (fs.existsSync(DEST)) {
    execSync('cmd /c rmdir /s /q "' + DEST + '"', { stdio: "ignore" });
  }
  fs.mkdirSync(DEST, { recursive: true });
}

function extraerZip() {
  var cmd =
    'powershell -NoProfile -Command "Expand-Archive -Path \'' +
    ZIP_PATH.replace(/'/g, "''") +
    "' -DestinationPath '" +
    DEST.replace(/'/g, "''") +
    "' -Force\"";
  execSync(cmd, { stdio: "inherit" });
}

function normalizarCarpeta() {
  var manifestEnRaiz = path.join(DEST, "manifest.json");
  if (fs.existsSync(manifestEnRaiz)) {
    return;
  }
  var chromium = path.join(DEST, "chromium");
  if (fs.existsSync(path.join(chromium, "manifest.json"))) {
    var tmp = path.join(EXTE_DIR, "nopecha_tmp");
    fs.renameSync(chromium, tmp);
    execSync('cmd /c rmdir /s /q "' + DEST + '"', { stdio: "ignore" });
    fs.renameSync(tmp, DEST);
  }
}

async function main() {
  console.log("Instalando NopeCHA CAPTCHA Solver...");
  console.log("URL:", URL);
  fs.mkdirSync(EXTE_DIR, { recursive: true });
  limpiarDestino();
  await download(URL, ZIP_PATH);
  console.log("ZIP descargado:", ZIP_PATH);
  extraerZip();
  normalizarCarpeta();
  if (!fs.existsSync(path.join(DEST, "manifest.json"))) {
    console.error(
      "No se encontró manifest.json en",
      DEST,
      "- revise el contenido del ZIP."
    );
    process.exit(1);
  }
  try {
    fs.unlinkSync(ZIP_PATH);
  } catch (e) {}
  console.log("Listo. Extensión en:", DEST);
  console.log(
    "Opcional: agregue NOPECHA_KEY=tu_clave en .env (https://nopecha.com)"
  );
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
