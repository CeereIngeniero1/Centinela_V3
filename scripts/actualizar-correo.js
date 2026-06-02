const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..");
function extractCorreoBlock(content) {
  const startComment = content.indexOf("// FUNCIÓN PARA ENVÍO DE CORREO");
  const startFunc = content.indexOf("function Correo(Tipo, Area, Celda)");
  if (startFunc === -1) return null;
  const replaceStart = startComment >= 0 ? startComment : startFunc;
  const braceStart = content.indexOf("{", startFunc);
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < content.length; i++) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) return null;
  return content.slice(replaceStart, end);
}

const source = fs.readFileSync(path.join(dir, "Collective.js"), "utf8");
const newBlock = extractCorreoBlock(source);
if (!newBlock) {
  console.error("No se encontró Correo en Collective.js");
  process.exit(1);
}

function replaceCorreo(content) {
  const startComment = content.indexOf("// FUNCIÓN PARA ENVÍO DE CORREO");
  const startFunc = content.indexOf("function Correo(Tipo, Area, Celda)");
  if (startFunc === -1) return null;
  const replaceStart = startComment >= 0 ? startComment : startFunc;
  const braceStart = content.indexOf("{", startFunc);
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < content.length; i++) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) return null;
  return content.slice(0, replaceStart) + newBlock + content.slice(end);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));
const updated = [];
const skipped = [];

for (const f of files) {
  const fp = path.join(dir, f);
  if (f === "actualizar-correo.js" || fp.includes("scripts")) continue;
  let content = fs.readFileSync(fp, "utf8");
  if (!content.includes("function Correo(Tipo, Area, Celda)")) continue;
  if (
    content.includes("Tipo == 7") &&
    content.includes("AVISO llevo 1:00 minutos en login")
  ) {
    skipped.push(f);
    continue;
  }
  const next = replaceCorreo(content);
  if (!next || next === content) {
    console.error("No se pudo reemplazar:", f);
    continue;
  }
  fs.writeFileSync(fp, next, "utf8");
  updated.push(f);
}

console.log("Actualizados:", updated.length);
updated.forEach((f) => console.log(" -", f));
console.log("Omitidos (ya nuevos):", skipped.join(", ") || "ninguno");
