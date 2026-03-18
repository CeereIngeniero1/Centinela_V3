// ── Estado global (única fuente de verdad) ────────
let modoActual = 'prueba';
let areaCount = 0;
let reglamentariosFiles = [];
let editorAreaCount = 0;
let editorCurrentFile = '';

// ── Mode ──────────────────────────────────────────
function setModo(modo) {
  modoActual = modo;
  document.getElementById('btn-prueba').className    = modo === 'prueba'    ? 'mode-btn active-prueba'    : 'mode-btn';
  document.getElementById('btn-real').className      = modo === 'real'      ? 'mode-btn active-real'      : 'mode-btn';
  document.getElementById('btn-consulta').className  = modo === 'consulta'  ? 'mode-btn active-consulta'  : 'mode-btn';
  document.getElementById('btn-historial').className = modo === 'historial' ? 'mode-btn active-historial' : 'mode-btn';
  document.getElementById('btn-editor').className    = modo === 'editor'    ? 'mode-btn active-editor'    : 'mode-btn';
  document.getElementById('btn-git').className       = modo === 'git'       ? 'mode-btn active-git'       : 'mode-btn';

  document.getElementById('desc-prueba').className    = 'mode-desc mode-desc-prueba'    + (modo === 'prueba'    ? ' active' : '');
  document.getElementById('desc-real').className      = 'mode-desc mode-desc-real'      + (modo === 'real'      ? ' active' : '');
  document.getElementById('desc-consulta').className  = 'mode-desc mode-desc-consulta'  + (modo === 'consulta'  ? ' active' : '');
  document.getElementById('desc-historial').className = 'mode-desc mode-desc-historial' + (modo === 'historial' ? ' active' : '');
  document.getElementById('desc-editor').className    = 'mode-desc mode-desc-editor'    + (modo === 'editor'    ? ' active' : '');
  document.getElementById('desc-git').className       = 'mode-desc mode-desc-git'       + (modo === 'git'       ? ' active' : '');

  document.getElementById('warning-real').className = 'warning-real' + (modo === 'real' ? ' visible' : '');

  const allForms = ['form-generador', 'form-consulta', 'form-historial', 'form-editor', 'form-git'];
  allForms.forEach(f => document.getElementById(f).style.display = 'none');

  if (modo === 'consulta') {
    document.getElementById('form-consulta').style.display = 'block';
  } else if (modo === 'historial') {
    document.getElementById('form-historial').style.display = 'block';
    cargarHistorial();
  } else if (modo === 'editor') {
    document.getElementById('form-editor').style.display = 'block';
    editorCargarListaArchivos();
  } else if (modo === 'git') {
    document.getElementById('form-git').style.display = 'block';
    if (typeof gitCargarStatus === 'function') gitCargarStatus();
  } else {
    document.getElementById('form-generador').style.display = 'block';
  }

  hideToast();
}

// ── Toast ─────────────────────────────────────────
function showToast(type, title, body) {
  const t = document.getElementById('toast');
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-body').innerHTML = body;
  document.getElementById('toast-icon').textContent = type === 'success' ? '✅' : (type === 'search' ? '🔎' : '❌');
  t.className = `toast ${type === 'search' ? 'success' : type} visible`;
  t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideToast() { document.getElementById('toast').className = 'toast'; }

// ── Autocompletar referencia ───────────────────────
function autoCompletarReferencia(id, el, prefix = '') {
  if (!el.value) return;

  let partes = el.value.split(/[\s,;-]+/);
  partes = partes.filter(p => p.trim() !== '');

  if (partes.length > 0) {
    const refField = document.getElementById(`${prefix}referencia-${id}`);
    if (!refField.value) {
      refField.value = partes[0];
    }
    if (partes.length > 1 || el.value.includes('\n') || el.value.includes('\t')) {
      el.value = partes.join(', ');
    }
  }
}

// ── Cargar lista de scripts base ──────────────────
async function loadScripts() {
  const sel = document.getElementById('archivoBase');
  try {
    const res = await fetch('/api/scripts');
    const scripts = await res.json();
    sel.innerHTML = '<option value="">— Selecciona un script —</option>' +
      scripts.map(s => `<option value="${s}">${s}</option>`).join('');
  } catch (e) {
    sel.innerHTML = '<option value="">Error al cargar scripts</option>';
  }
}

// ── Cargar lista de clientes desde Documentos/ ───
async function loadClientes() {
  try {
    const res = await fetch('/api/clientes');
    const data = await res.json();
    if (!data.ok) return;

    const opciones = data.clientes.map(c => `<option value="${c}">${c}</option>`).join('');

    const selGen = document.getElementById('clienteSeleccionado');
    selGen.innerHTML =
      '<option value="">— Selecciona un cliente —</option>' +
      opciones +
      '<option value="Nuevo">Otro / Crear Nuevo...</option>';

    const selEditor = document.getElementById('editor-cliente-select');
    selEditor.innerHTML =
      '<option value="">— Ninguno (No subir documentos) —</option>' +
      opciones;
  } catch (e) {
    console.error('Error cargando clientes:', e);
  }
}
