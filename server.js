const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec, execFile } = require('child_process');
const { promisify } = require('util');
const multer = require('multer');
const xlsx = require('xlsx');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PROJECT_DIR = __dirname;
const HISTORIAL_FILE = path.join(PROJECT_DIR, 'historial.json');
const GIT_CREDENTIALS_FILE = path.join(PROJECT_DIR, 'config', 'git-credentials.txt');
const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

function toCommandOutput(err) {
  return {
    stdout: err && err.stdout ? err.stdout : '',
    stderr: err && err.stderr ? err.stderr : (err && err.message ? err.message : '')
  };
}

async function runCommand(command, options = {}) {
  return execAsync(command, {
    cwd: PROJECT_DIR,
    maxBuffer: 10 * 1024 * 1024,
    ...options
  });
}

async function runGit(args, options = {}) {
  return execFileAsync('git', args, {
    cwd: PROJECT_DIR,
    maxBuffer: 10 * 1024 * 1024,
    ...options
  });
}

function readGitCredentials() {
  try {
    if (!fs.existsSync(GIT_CREDENTIALS_FILE)) return null;
    const firstLine = fs.readFileSync(GIT_CREDENTIALS_FILE, 'utf-8')
      .split(/\r?\n/)
      .map(l => l.trim())
      .find(Boolean);
    return firstLine || null;
  } catch (err) {
    console.warn('No se pudieron leer credenciales Git opcionales:', err.message);
    return null;
  }
}

async function getCurrentBranch() {
  const { stdout } = await runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  return stdout.trim();
}

// --- Historical Data Management ---
function getClienteGuessed(filename) {
  const f = filename.toLowerCase();
  if (f.includes('freeport')) return 'Freeport';
  if (f.includes('collective')) return 'Collective';
  if (f.includes('arabany')) return 'Arabany';
  if (f.includes('operadora')) return 'OPERADORA';
  if (f.includes('negoymetales')) return 'NegoYMetales';
  return 'Desconocido';
}

function inicializarHistorial() {
  if (fs.existsSync(HISTORIAL_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(HISTORIAL_FILE, 'utf-8'));
    } catch (e) { /* fallback clean */ }
  }

  // Excluir archivos irrelevantes
  const excluded = ['server.js', 'Menu.js', 'read_pdf.js', 'V4.js'];
  const files = fs.readdirSync(PROJECT_DIR).filter(f => f.endsWith('.js') && !excluded.includes(f));

  const historial = [];

  for (const file of files) {
    const filePath = path.join(PROJECT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Buscar áreas (limitado a las creadas en el arreglo Areas)
    const areaRegex = /\{\s*NombreArea:\s*"([^"]+)"/g;
    let match;
    const areasFound = [];
    while ((match = areaRegex.exec(content)) !== null) {
      if (match[1] !== 'prueba' && match[1] !== '1111') { // Omitir dummy data
        if (!areasFound.includes(match[1])) areasFound.push(match[1]);
      }
    }

    if (areasFound.length > 0) {
      const stats = fs.statSync(filePath);
      historial.push({
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        fecha: stats.mtime.toISOString(),
        archivoBase: "N/A (Lega)",
        nombreSalida: file,
        modo: "Importado",
        cliente: getClienteGuessed(file),
        areas: areasFound,
        estado: "Existente"
      });
    }
  }

  // Ordenar de más reciente a más antiguo
  historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  fs.writeFileSync(HISTORIAL_FILE, JSON.stringify(historial, null, 2), 'utf-8');
  return historial;
}

const historialGlobal = inicializarHistorial();

function agregarRegistroHistorial(datos) {
  historialGlobal.unshift({ id: Date.now().toString(), ...datos, fecha: new Date().toISOString() });
  fs.writeFileSync(HISTORIAL_FILE, JSON.stringify(historialGlobal, null, 2), 'utf-8');
}

// Returns list of available .js scripts (excluding server.js, Menu.js, etc.)
app.get('/api/scripts', (req, res) => {
  const excluded = ['server.js', 'Menu.js', 'read_pdf.js', 'V4.js'];
  const files = fs.readdirSync(PROJECT_DIR)
    .filter(f => f.endsWith('.js') && !excluded.includes(f))
    .sort();
  res.json(files);
});

// Returns list of client folders inside Documentos/
app.get('/api/clientes', (req, res) => {
  const docsBase = path.join(PROJECT_DIR, 'Documentos');
  try {
    if (!fs.existsSync(docsBase)) {
      return res.json({ ok: true, clientes: [] });
    }
    const clientes = fs.readdirSync(docsBase)
      .filter(name => {
        try { return fs.statSync(path.join(docsBase, name)).isDirectory(); }
        catch { return false; }
      })
      .sort();
    res.json({ ok: true, clientes });
  } catch (err) {
    console.error('Error listando clientes:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Git helper endpoints ---
app.get('/api/git/status', async (req, res) => {
  try {
    const [{ stdout: branchRaw }, { stdout: commitRaw }, { stdout: statusRaw }] = await Promise.all([
      runGit(['rev-parse', '--abbrev-ref', 'HEAD']),
      runGit(['log', '-1', '--oneline']),
      runGit(['status', '--short'])
    ]);

    const statusLines = statusRaw
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    res.json({
      ok: true,
      branch: branchRaw.trim(),
      lastCommit: commitRaw.trim(),
      statusLines
    });
  } catch (err) {
    const out = toCommandOutput(err);
    res.status(500).json({
      ok: false,
      error: out.stderr || 'No fue posible obtener el estado de Git.',
      stdout: out.stdout,
      stderr: out.stderr
    });
  }
});

app.post('/api/git/pull', async (req, res) => {
  const force = Boolean(req.body && req.body.force);

  try {
    const branch = await getCurrentBranch();
    if (!force) {
      const { stdout, stderr } = await runGit(['pull', '--ff-only']);
      return res.json({ ok: true, stdout, stderr, branch, force: false });
    }

    const { stdout: fetchOut, stderr: fetchErr } = await runGit(['fetch', 'origin']);

    const targetRef = `origin/${branch}`;
    const { stdout: resetOut, stderr: resetErr } = await runGit(['reset', '--hard', targetRef]);

    return res.json({
      ok: true,
      stdout: `${fetchOut}${resetOut}`,
      stderr: `${fetchErr}${resetErr}`,
      branch,
      force: true
    });
  } catch (err) {
    const out = toCommandOutput(err);
    res.json({
      ok: false,
      error: out.stderr || 'No fue posible ejecutar git pull.',
      stdout: out.stdout,
      stderr: out.stderr,
      force
    });
  }
});

app.post('/api/git/push', async (req, res) => {
  const messageRaw = req.body && typeof req.body.message === 'string'
    ? req.body.message.trim()
    : '';
  const message = messageRaw || `Actualizacion desde Centinela Web (${new Date().toISOString()})`;

  try {
    const outputs = [];
    const { stdout: statusRaw } = await runGit(['status', '--short']);
    const hasLocalChanges = Boolean(statusRaw.trim());
    const branch = await getCurrentBranch();

    outputs.push('== git status --short ==\n' + statusRaw);

    if (hasLocalChanges) {
      const addRes = await runGit(['add', '.']);
      outputs.push('== git add . ==\n' + addRes.stdout + addRes.stderr);

      const commitRes = await runGit(['commit', '-m', message]);
      outputs.push('== git commit ==\n' + commitRes.stdout + commitRes.stderr);
    } else {
      outputs.push('No hay cambios locales para commit. Se intentara push por si hay commits pendientes.');
    }

    const creds = readGitCredentials();
    let pushRes;
    if (creds && /^https?:\/\//i.test(creds)) {
      pushRes = await runGit(['push', creds, `HEAD:${branch}`]);
      outputs.push('Push usando URL de credenciales local.');
    } else {
      pushRes = await runGit(['push']);
      outputs.push('Push usando credenciales del sistema.');
    }

    outputs.push('== git push ==\n' + pushRes.stdout + pushRes.stderr);

    res.json({
      ok: true,
      stdout: outputs.join('\n\n'),
      stderr: '',
      branch,
      committed: hasLocalChanges
    });
  } catch (err) {
    const out = toCommandOutput(err);
    res.json({
      ok: false,
      error: out.stderr || 'No fue posible ejecutar git push.',
      stdout: out.stdout,
      stderr: out.stderr
    });
  }
});

app.post('/api/git/install-deps', async (req, res) => {
  try {
    const { stdout, stderr } = await runCommand('npm install');
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    const out = toCommandOutput(err);
    res.json({
      ok: false,
      error: out.stderr || 'No fue posible instalar dependencias.',
      stdout: out.stdout,
      stderr: out.stderr
    });
  }
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

    // Mantenemos la información de áreas para el historial
    const userInfoHistorial = {
      archivoBase: archivoBase,
      nombreSalida: nombreSalidaFinal,
      modo: modo === 'prueba' ? 'Prueba de Radiación' : 'Radicación Real',
      cliente: req.body.clienteHistorial || "No asignado",
      areas: areas.map(a => a.nombre),
      estado: "Generado OK" // Esto se actualizará si hay subidas de documentos
    };

    // Note: the /api/subir-documentos endpoint handles document uploading and error recording separately 
    // but the basic script generation event starts here.
    agregarRegistroHistorial(userInfoHistorial);

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
        // If query is found anywhere in the file
        if (content.includes(q)) {
          // Try to find if it's inside a specific Area block
          // Regex to find blocks like { NombreArea: "...", ..., Celdas: [...] }
          const areaRegex = /\{\s*NombreArea:\s*"([^"]+)"[\s\S]*?Celdas:\s*\[([\s\S]*?)\]/g;
          let match;
          let foundInArea = false;

          while ((match = areaRegex.exec(content)) !== null) {
            const nombreArea = match[1];
            const celdasString = match[2];

            if (nombreArea === q || celdasString.includes(q)) {
              resultados[q].push(`${file} (Área: ${nombreArea})`);
              foundInArea = true;
            }
          }

          // If it was found in the file but not specifically matched to an area block, just add the file
          if (!foundInArea) {
            resultados[q].push(file);
          }
        }
      }
    }

    res.json({ ok: true, resultados });

  } catch (err) {
    console.error('Error en /api/consultar:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Historial Endpoints ---
app.get('/api/historial', (req, res) => {
  res.json({ ok: true, historial: historialGlobal });
});

app.get('/api/historial/exportar', (req, res) => {
  const formato = req.query.formato || 'csv';

  if (historialGlobal.length === 0) {
    return res.status(404).send("No hay historial para exportar.");
  }

  // Prepara los datos aplanados
  const exportData = historialGlobal.map(row => ({
    'Fecha': new Date(row.fecha).toLocaleString(),
    'Archivo Generado': row.nombreSalida,
    'Modo': row.modo,
    'Cliente': row.cliente,
    'Áreas Procesadas': Array.isArray(row.areas) ? row.areas.join(', ') : '',
    'Archivo Base': row.archivoBase,
    'Estado': row.estado
  }));

  if (formato === 'xlsx') {
    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Auditoria Generales");
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Auditoria_Radicaciones.xlsx"');
    res.send(buffer);

  } else {
    // CSV
    const ws = xlsx.utils.json_to_sheet(exportData);
    const csvStr = xlsx.utils.sheet_to_csv(ws);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Auditoria_Radicaciones.csv"');
    // Prepend UTF-8 BOM
    res.send('\uFEFF' + csvStr);
  }
});

// Endpoint to upload and read an Excel file
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/leer-excel', upload.single('excel'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No se proporcionó ningún archivo.' });
    }

    // El nombre del área es el nombre del archivo sin la extensión .xlsx
    const nombreArea = path.parse(req.file.originalname).name;

    // Leer el contenido del Excel desde el buffer cargado en memoria
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });

    // Tomar la primera hoja
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertir a un arreglo de arreglos (cada fila es un arreglo de celdas)
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const celdas = [];
    // La fila 0 es el encabezado (B1). Iteramos desde la fila 1 (B2) en adelante.
    // La columna B corresponde al índice 1 (A=0, B=1)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row && row[1]) {
        const val = String(row[1]).trim();
        if (val) {
          celdas.push(val);
        }
      }
    }

    if (celdas.length === 0) {
      return res.status(400).json({ ok: false, error: 'Se leyó el archivo pero no se encontraron celdas en la Columna B (a partir de B2).' });
    }

    res.json({ ok: true, nombreArea, celdas });

  } catch (err) {
    console.error('Error leyendo Excel:', err);
    res.status(500).json({ ok: false, error: 'Ocurrió un error procesando el archivo Excel.' });
  }
});

// Endpoint to verify if a regulatory document exists
app.post('/api/verificar-documento', (req, res) => {
  const { cliente, fileName } = req.body;
  if (!cliente || !fileName) {
    return res.status(400).json({ ok: false, error: 'Faltan datos de verificación.' });
  }

  const docPath = path.join(PROJECT_DIR, 'Documentos', cliente, 'DocumentosReglamentarios', fileName);
  const existe = fs.existsSync(docPath);
  res.json({ ok: true, existe });
});

// Endpoint to process and save documents in bulk
app.post('/api/subir-documentos', upload.any(), (req, res) => {
  const { cliente } = req.body;
  if (!cliente) return res.status(400).json({ ok: false, error: 'Falta especificar el cliente.' });

  try {
    const docBase = path.join(PROJECT_DIR, 'Documentos', cliente);

    const ensureDir = (subDir) => {
      const p = path.join(docBase, subDir);
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      return p;
    };

    let savedFiles = 0;

    for (const file of req.files) {
      if (file.fieldname === 'reglamentario') {
        const destDir = ensureDir('DocumentosReglamentarios');
        const destPath = path.join(destDir, file.originalname);
        fs.writeFileSync(destPath, file.buffer);
        savedFiles++;
      } else if (file.fieldname.startsWith('certificado-')) {
        const areaName = file.fieldname.replace('certificado-', '');
        const ext = path.extname(file.originalname) || '.pdf';
        const destDir = ensureDir('CertificadoAmbiental');
        const destPath = path.join(destDir, areaName + ext);
        fs.writeFileSync(destPath, file.buffer);
        savedFiles++;
      } else if (file.fieldname.startsWith('sheips-')) {
        const areaName = file.fieldname.replace('sheips-', '');
        const ext = path.extname(file.originalname) || '.zip';
        const destDir = ensureDir('Sheips');
        const destPath = path.join(destDir, areaName + ext);
        fs.writeFileSync(destPath, file.buffer);
        savedFiles++;
      }
    }

    res.json({ ok: true, count: savedFiles });
  } catch (err) {
    console.error('Error guardando documentos:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ── Editor de JS: Endpoints para gestionar áreas en archivos .js ──
// ═══════════════════════════════════════════════════════════════════

// Lista todos los .js disponibles que contienen un bloque "const Areas"
app.get('/api/editor/list-js', (req, res) => {
  const excluded = ['server.js', 'Menu.js', 'read_pdf.js'];
  try {
    const files = fs.readdirSync(PROJECT_DIR)
      .filter(f => f.endsWith('.js') && !excluded.includes(f))
      .filter(f => {
        try {
          const content = fs.readFileSync(path.join(PROJECT_DIR, f), 'utf-8');
          return /const\s+Areas\s*=\s*\[/.test(content);
        } catch { return false; }
      })
      .sort();
    res.json({ ok: true, files });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Extrae las áreas del bloque "const Areas = [...]" de un archivo
app.get('/api/editor/get-areas/:filename', (req, res) => {
  const filename = req.params.filename;
  // Seguridad: solo permitir archivos .js en la raíz del proyecto
  if (!filename.endsWith('.js') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ ok: false, error: 'Nombre de archivo inválido.' });
  }
  const filePath = path.join(PROJECT_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ ok: false, error: 'Archivo no encontrado.' });
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Pre-procesar el contenido para ignorar TODO lo comentado (bloque y línea)
    // Usamos espacios para mantener los índices originales si fuera necesario, 
    // pero aquí lo usamos para buscar el bloque Areas sin interferencia de comentarios.
    const ghostContent = content
      .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
      .replace(/\/\/.*/g, (m) => ' '.repeat(m.length));

    // Encontrar el bloque "const Areas = [ ... ]" en el contenido limpio
    const areasStartMatch = ghostContent.match(/const\s+Areas\s*=\s*\n?\s*\[/);
    if (!areasStartMatch) {
      return res.json({ ok: true, areas: [], raw: '' });
    }

    const startIdx = areasStartMatch.index;
    let bracketCount = 0;
    let endIdx = -1;
    // Buscamos el cierre del array en el ghostContent
    for (let i = ghostContent.indexOf('[', startIdx); i < ghostContent.length; i++) {
      if (ghostContent[i] === '[') bracketCount++;
      if (ghostContent[i] === ']') bracketCount--;
      if (bracketCount === 0) { endIdx = i + 1; break; }
    }

    if (endIdx === -1) {
      return res.json({ ok: true, areas: [], raw: '' });
    }

    // El bloque que vamos a parsear es el del ghostContent (ya sin comentarios)
    const cleanedBlock = ghostContent.substring(startIdx, endIdx);

    // Extraer cada objeto { NombreArea: "...", Referencia: "...", Celdas: [...] }
    const areaRegex = /\{\s*NombreArea:\s*["']([^"']+)["']\s*,\s*Referencia:\s*["']([^"']+)["']\s*,\s*Celdas:\s*\[([^\]]*)\]/g;
    const areas = [];
    let match;
    while ((match = areaRegex.exec(cleanedBlock)) !== null) {
      const nombre = match[1];
      const referencia = match[2];
      const celdasRaw = match[3];
      const celdas = celdasRaw.replace(/["']/g, '').trim();
      areas.push({ nombre, referencia, celdas });
    }

    res.json({ ok: true, areas });
  } catch (err) {
    console.error('Error leyendo áreas:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Guarda las áreas modificadas en el archivo, reemplazando solo el bloque "const Areas = [...]"
app.post('/api/editor/save-areas', (req, res) => {
  const { filename, areas } = req.body;

  if (!filename || !areas || !Array.isArray(areas)) {
    return res.status(400).json({ ok: false, error: 'Datos inválidos. Se requiere filename y areas.' });
  }
  if (!filename.endsWith('.js') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ ok: false, error: 'Nombre de archivo inválido.' });
  }

  const filePath = path.join(PROJECT_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ ok: false, error: 'Archivo no encontrado.' });
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');

    const areasStartMatch = content.match(/const\s+Areas\s*=\s*\n?\s*\[/);
    if (!areasStartMatch) {
      return res.status(400).json({ ok: false, error: 'No se encontró el bloque "const Areas" en el archivo.' });
    }

    const startIdx = areasStartMatch.index;
    let bracketCount = 0;
    let endIdx = -1;
    for (let i = content.indexOf('[', startIdx); i < content.length; i++) {
      if (content[i] === '[') bracketCount++;
      if (content[i] === ']') bracketCount--;
      if (bracketCount === 0) { endIdx = i + 1; break; }
    }

    if (endIdx === -1) {
      return res.status(400).json({ ok: false, error: 'No se pudo encontrar el cierre del array Areas.' });
    }

    // Construir el nuevo bloque de Areas
    const areasStr = areas.map(a => {
      return `    {\n      NombreArea: "${a.nombre}",\n      Referencia: "${a.referencia}",\n      Celdas: ["${a.celdas.trim()}"]\n    }`;
    }).join(',\n');

    const newBlock = `const Areas =\n  [\n${areasStr}\n  ]`;

    // Crear backup antes de guardar
    const backupPath = filePath + '.bak';
    fs.writeFileSync(backupPath, content, 'utf-8');

    // Reemplazar el bloque viejo con el nuevo
    content = content.substring(0, startIdx) + newBlock + content.substring(endIdx);
    fs.writeFileSync(filePath, content, 'utf-8');

    res.json({ ok: true, mensaje: `Se guardaron ${areas.length} áreas en ${filename}. Backup creado en ${filename}.bak` });
  } catch (err) {
    console.error('Error guardando áreas:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ Centinela Script Generator corriendo en: http://localhost:${PORT}\n`);
});
