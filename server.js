const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PROJECT_DIR = __dirname;

// Returns list of available .js scripts (excluding server.js, Menu.js, etc.)
app.get('/api/scripts', (req, res) => {
  const excluded = ['server.js', 'Menu.js', 'read_pdf.js', 'V4.js'];
  const files = fs.readdirSync(PROJECT_DIR)
    .filter(f => f.endsWith('.js') && !excluded.includes(f))
    .sort();
  res.json(files);
});

// Main endpoint: generates a modified copy of a script
app.post('/api/generar', (req, res) => {
  const { archivoBase, modo, areas, nombreSalida } = req.body;

  // --- Validation ---
  if (!archivoBase || !modo || !areas || !Array.isArray(areas) || areas.length === 0 || !nombreSalida) {
    return res.status(400).json({ ok: false, error: 'Todos los campos son obligatorios y debe haber al menos un área.' });
  }

  for (let i = 0; i < areas.length; i++) {
    const a = areas[i];
    if (!a.nombre || !a.referencia || !a.celdas) {
      return res.status(400).json({ ok: false, error: `El Área #${i + 1} tiene campos incompletos.` });
    }
  }

  const archivoBasePath = path.join(PROJECT_DIR, archivoBase);
  if (!fs.existsSync(archivoBasePath)) {
    return res.status(400).json({ ok: false, error: `El archivo base "${archivoBase}" no existe.` });
  }

  let nombreSalidaFinal = nombreSalida.trim();
  if (!nombreSalidaFinal.endsWith('.js')) nombreSalidaFinal += '.js';

  const outputPath = path.join(PROJECT_DIR, nombreSalidaFinal);

  try {
    let code = fs.readFileSync(archivoBasePath, 'utf-8');

    // =====================================================================
    // REGLA 4 (ambos modos): Inyectar todas las áreas al inicio de const Areas
    // =====================================================================
    const areasMarker = 'const Areas =\n  [';
    const areasMarkerAlt = 'const Areas =\r\n  [';
    let idx = code.indexOf(areasMarker);
    if (idx === -1) idx = code.indexOf(areasMarkerAlt);

    if (idx === -1) {
      return res.status(500).json({ ok: false, error: 'No se encontró el array "const Areas" en el archivo base. Verifica que el script seleccionado es correcto.' });
    }

    const insertPos = idx + (code.indexOf('[', idx) - idx) + 1;
    const nuevasAreas = areas.map(a =>
      `\n    {\n      NombreArea: "${a.nombre}",\n      Referencia: "${a.referencia}",\n      Celdas: ["${a.celdas.trim()}"]\n    },`
    ).join('');
    code = code.slice(0, insertPos) + nuevasAreas + code.slice(insertPos);

    // =====================================================================
    // MODO PRUEBA: aplicar reglas 1, 2 y 3
    // =====================================================================
    if (modo === 'prueba') {

      // --- REGLA 1: Cambiar correos en mailOptions ---
      // Replace the `to:` line inside mailOptions with only the test email
      code = code.replace(
        /to:\s*["'].*?["']\s*,?\s*\r?\n(\s*\/\/to[^\n]*\n)?/g,
        `to: 'Soporte2ceere@gmail.com',\n`
      );

      // --- REGLA 3: Eliminar bloque clearTimeout(RadiPrimero) + Radisegundo ---
      // Pattern: clearTimeout(RadiPrimero); ... }, 10000);
      const radiPrimeroPattern = /clearTimeout\(RadiPrimero\);[\s\S]*?},\s*10000\s*\);/m;
      code = code.replace(radiPrimeroPattern, '// [PRUEBA] Bloque RadiPrimero/Radisegundo eliminado');

      // --- REGLA 2: Eliminar bloque de radicación (continPag hasta //CORREO RADICACION) ---
      // Find "const continPag" and "//CORREO RADICACION" and remove everything between them (and including the correo call after)
      const continPagIdx = code.indexOf("const continPag = await page.$x('//span[contains(.,\"Continuar\")]');");
      const correoRadicacionIdx = code.indexOf('//CORREO RADICACION');

      if (continPagIdx !== -1 && correoRadicacionIdx !== -1 && correoRadicacionIdx > continPagIdx) {
        // Find the end of the CORREO RADICACION block (the line after the comment usually has function calls)
        // We'll remove from continPag up to and including the comment line
        const endOfComment = code.indexOf('\n', correoRadicacionIdx) + 1;
        const blockToRemove = code.slice(continPagIdx, endOfComment);
        code = code.replace(blockToRemove, 
          `// [PRUEBA] Bloque de radicación eliminado (continPag -> CORREO RADICACION)\n`
        );
      }
    }

    // Write the output file
    fs.writeFileSync(outputPath, code, 'utf-8');

    res.json({ ok: true, archivo: nombreSalidaFinal });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint to search for cells/areas across all .js files in the project
app.post('/api/consultar', (req, res) => {
  const { queries } = req.body;

  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    return res.status(400).json({ ok: false, error: 'Debes proporcionar una lista de celdas o áreas a buscar.' });
  }

  try {
    const excluded = ['server.js', 'Menu.js', 'read_pdf.js', 'V4.js'];
    const files = fs.readdirSync(PROJECT_DIR)
      .filter(f => f.endsWith('.js') && !excluded.includes(f));

    const resultados = {};
    for (const q of queries) {
      resultados[q] = []; // Initialize empty array for this query
    }

    // Search through all files
    for (const file of files) {
      const filePath = path.join(PROJECT_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const q of queries) {
        if (content.includes(q)) {
          resultados[q].push(file);
        }
      }
    }

    res.json({ ok: true, resultados });

  } catch (err) {
    console.error('Error en /api/consultar:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ Centinela Script Generator corriendo en: http://localhost:${PORT}\n`);
});
