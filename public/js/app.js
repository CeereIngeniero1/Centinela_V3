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

  document.getElementById('desc-prueba').className    = 'mode-desc mode-desc-prueba'    + (modo === 'prueba'    ? ' active' : '');
  document.getElementById('desc-real').className      = 'mode-desc mode-desc-real'      + (modo === 'real'      ? ' active' : '');
  document.getElementById('desc-consulta').className  = 'mode-desc mode-desc-consulta'  + (modo === 'consulta'  ? ' active' : '');
  document.getElementById('desc-historial').className = 'mode-desc mode-desc-historial' + (modo === 'historial' ? ' active' : '');
  document.getElementById('desc-editor').className    = 'mode-desc mode-desc-editor'    + (modo === 'editor'    ? ' active' : '');

  document.getElementById('warning-real').className = 'warning-real' + (modo === 'real' ? ' visible' : '');

  const allForms = ['form-generador', 'form-consulta', 'form-historial', 'form-editor'];
  allForms.forEach(f => document.getElementById(f).style.display = 'none');

  if (modo === 'consulta') {
    document.getElementById('form-consulta').style.display = 'block';
  } else if (modo === 'historial') {
    document.getElementById('form-historial').style.display = 'block';
    cargarHistorial();
  } else if (modo === 'editor') {
    document.getElementById('form-editor').style.display = 'block';
    editorCargarListaArchivos();
  } else {
    document.getElementById('form-generador').style.display = 'block';
  }

  hideToast();
}

// ── Area Cards ────────────────────────────────────
function agregarArea() {
  areaCount++;
  const container = document.getElementById('areas-container');
  const id = areaCount;

  const card = document.createElement('div');
  card.className = 'area-card';
  card.id = `area-card-${id}`;
  card.innerHTML = `
    <div class="area-card-header">
      <div class="area-card-title">
        <span class="area-num">#${id}</span>
        Área ${id}
      </div>
      <div style="display:flex; gap: 8px; align-items: center;">
        <input type="file" id="excel-file-${id}" accept=".xlsx,.xls" style="display:none;" onchange="procesarExcel(${id}, this)" />
        <button class="btn-excel" onclick="document.getElementById('excel-file-${id}').click()" title="Autocompletar área desde archivo Excel">
          📊 Excel
        </button>
        ${id > 1 ? `<button class="btn-remove-area" onclick="eliminarArea(${id})" title="Eliminar esta área">✕</button>` : ''}
      </div>
    </div>
    <div class="area-card-body">
      <div class="area-row">
        <div class="field">
          <label>Nombre del Área <span class="req">*</span></label>
          <input type="text" id="nombre-${id}" placeholder="Ej: 507531"/>
        </div>
        <div class="field">
          <label>Celda de Referencia <span class="req">*</span></label>
          <input type="text" id="referencia-${id}" placeholder="Ej: 18P09K21D02I"/>
        </div>
      </div>
      <div class="field">
        <label>Celdas (separadas por coma) <span class="req">*</span></label>
        <textarea id="celdas-${id}" placeholder="18P09K04K05R, 18N05N14M12R, ..." oninput="autoCompletarReferencia(${id}, this)"></textarea>
      </div>
      <div class="area-row" style="margin-top: 4px; border-top: 1px dashed var(--border); padding-top: 12px;">
        <div class="field">
          <label>Certificado Ambiental (.pdf)</label>
          <input type="file" id="certificado-${id}" accept=".pdf" />
        </div>
        <div class="field">
          <label>Sheips (.zip)</label>
          <input type="file" id="sheips-${id}" accept=".zip" />
        </div>
      </div>
    </div>`;

  container.appendChild(card);
  actualizarContador();
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function eliminarArea(id) {
  const card = document.getElementById(`area-card-${id}`);
  if (card) {
    card.style.animation = 'none';
    card.style.opacity = '0';
    card.style.transform = 'translateY(-8px)';
    card.style.transition = 'all 0.2s';
    setTimeout(() => { card.remove(); actualizarContador(); }, 200);
  }
}

function actualizarContador() {
  const cards = document.querySelectorAll('.area-card');
  document.getElementById('areas-count').textContent = cards.length;
}

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

// ── Excel Import ──────────────────────────────────
async function procesarExcel(id, inputEl) {
  if (!inputEl.files || inputEl.files.length === 0) return;
  const file = inputEl.files[0];
  const formData = new FormData();
  formData.append('excel', file);

  showToast('search', '⏳ Cargando Excel', `Procesando ${file.name}...`);

  try {
    const res = await fetch('/api/leer-excel', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.ok) {
      document.getElementById(`nombre-${id}`).value = data.nombreArea;
      document.getElementById(`celdas-${id}`).value = data.celdas.join(', ');
      if (data.celdas.length > 0) {
        document.getElementById(`referencia-${id}`).value = data.celdas[0];
      }
      showToast('success', '✅ Excel importado', `Se cargaron ${data.celdas.length} celdas en el Área ${id}.`);
    } else {
      showToast('error', '❌ Error en Excel', data.error);
    }
  } catch (e) {
    showToast('error', '❌ Error de conexión', 'No se pudo leer el archivo Excel. Verifica el servidor.');
  }

  inputEl.value = '';
}

// ── Document Automation ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('clienteSeleccionado').addEventListener('change', (e) => {
    const inputNuevo = document.getElementById('clienteNuevo');
    if (e.target.value === 'Nuevo') {
      inputNuevo.style.display = 'block';
    } else {
      inputNuevo.style.display = 'none';
      inputNuevo.value = '';
    }
  });

  loadScripts();
  agregarArea();
});

function getClienteNombre() {
  const sel = document.getElementById('clienteSeleccionado').value;
  if (sel === 'Nuevo') return document.getElementById('clienteNuevo').value.trim();
  return sel;
}

async function verificarDocumentosReglamentarios(inputEl) {
  if (!inputEl.files || inputEl.files.length === 0) return;
  const cliente = getClienteNombre();

  if (!cliente) {
    alert("⚠️ Por favor selecciona o escribe el nombre del cliente primero para verificar los documentos.");
    inputEl.value = '';
    return;
  }

  for (const file of inputEl.files) {
    if (reglamentariosFiles.some(f => f.name === file.name)) continue;

    try {
      const res = await fetch('/api/verificar-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente, fileName: file.name })
      });
      const data = await res.json();

      let proceed = true;
      if (data.ok && data.existe) {
        proceed = confirm(`⚠️ El documento "${file.name}" ya existe para el cliente ${cliente}.\n\n¿Desea cargarlo? El anterior será reemplazado.`);
      }

      if (proceed) {
        reglamentariosFiles.push(file);
      }
    } catch (e) {
      console.error("Error verificando documento:", e);
      reglamentariosFiles.push(file);
    }
  }

  inputEl.value = '';
  renderizarListaReglamentarios();
}

function renderizarListaReglamentarios() {
  const container = document.getElementById('reglamentarios-list');
  container.innerHTML = reglamentariosFiles.map((file, idx) => `
    <div class="file-item">
      <span>📄 ${file.name}</span>
      <span class="file-item-remove" onclick="removerArchivoReg(${idx})">✕</span>
    </div>
  `).join('');
}

function removerArchivoReg(index) {
  reglamentariosFiles.splice(index, 1);
  renderizarListaReglamentarios();
}

// ── Load Scripts ──────────────────────────────────
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

// ── Generate ──────────────────────────────────────
async function generar() {
  hideToast();

  const cards = document.querySelectorAll('.area-card');
  if (cards.length === 0) {
    showToast('error', '⚠️ Sin áreas', 'Agrega al menos una área para continuar.');
    return;
  }

  const areas = [];
  for (const card of cards) {
    const idStr      = card.id.replace('area-card-', '');
    const nombre     = document.getElementById(`nombre-${idStr}`).value.trim();
    const referencia = document.getElementById(`referencia-${idStr}`).value.trim();
    const celdas     = document.getElementById(`celdas-${idStr}`).value.trim();

    if (!nombre || !referencia || !celdas) {
      showToast('error', '⚠️ Campos incompletos', `El Área #${idStr} tiene campos vacíos. Por favor complétalos.`);
      document.getElementById(`nombre-${idStr}`).focus();
      return;
    }
    areas.push({ nombre, referencia, celdas });
  }

  const archivoBase  = document.getElementById('archivoBase').value;
  const nombreSalida = document.getElementById('nombreSalida').value.trim();

  if (!archivoBase)  { showToast('error', '⚠️ Falta el script base', 'Selecciona un script base.'); return; }
  if (!nombreSalida) { showToast('error', '⚠️ Falta el nombre', 'Escribe el nombre del archivo de salida.'); return; }

  const btn = document.getElementById('btn-generar');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const res = await fetch('/api/generar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivoBase, modo: modoActual, areas, nombreSalida }),
    });
    const data = await res.json();

    if (data.ok) {
      const cliente = getClienteNombre();
      let docsMensaje = '';

      if (cliente) {
        const formData = new FormData();
        formData.append('cliente', cliente);
        let hasFiles = false;

        if (reglamentariosFiles.length > 0) {
          for (const file of reglamentariosFiles) {
            formData.append('reglamentario', file);
            hasFiles = true;
          }
        }

        const allCards = document.querySelectorAll('.area-card');
        for (const card of allCards) {
          const idStr = card.id.replace('area-card-', '');
          const nombreArea = document.getElementById(`nombre-${idStr}`).value.trim();

          const certInput = document.getElementById(`certificado-${idStr}`);
          if (certInput && certInput.files.length > 0) {
            formData.append(`certificado-${nombreArea}`, certInput.files[0]);
            hasFiles = true;
          }

          const sheipsInput = document.getElementById(`sheips-${idStr}`);
          if (sheipsInput && sheipsInput.files.length > 0) {
            formData.append(`sheips-${nombreArea}`, sheipsInput.files[0]);
            hasFiles = true;
          }
        }

        if (hasFiles) {
          try {
            const dRes = await fetch('/api/subir-documentos', { method: 'POST', body: formData });
            const dData = await dRes.json();
            if (dData.ok) {
              docsMensaje = `<br><br>📂 <strong>Documentos:</strong> Se guardaron ${dData.count} archivos correctamente en la carpeta de ${cliente}.`;
            } else {
              docsMensaje = `<br><br>⚠️ <strong>Documentos:</strong> Hubo un error guardándolos (${dData.error})`;
            }
          } catch (e) {
            docsMensaje = `<br><br>⚠️ <strong>Documentos:</strong> Falló la conexión al subir documentos.`;
          }
        }
      }

      const modoLabel = modoActual === 'prueba' ? '🧪 Modo Prueba' : '🚀 Modo Real';
      const areaList  = areas.map(a => `<br>&nbsp;&nbsp;&nbsp;&nbsp;• <strong>${a.nombre}</strong>`).join('');
      showToast('success', `✅ Proceso completado exitosamente`,
        `Archivo generado: <strong>${data.archivo}</strong><br>Modo: <strong>${modoLabel}</strong><br>Áreas inyectadas (${areas.length}):${areaList}${docsMensaje}<br><br>Ejecuta el script con: <code>node "${data.archivo}"</code>`
      );

      reglamentariosFiles = [];
      renderizarListaReglamentarios();
      document.querySelectorAll('.area-card input[type="file"]').forEach(f => f.value = '');
    } else {
      showToast('error', '❌ Error al generar', data.error);
    }
  } catch (e) {
    showToast('error', '❌ Error de conexión', 'No se pudo conectar con el servidor. Verifica que <code>node server.js</code> esté corriendo.');
  }

  btn.classList.remove('loading');
  btn.disabled = false;
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

// ── Search (Consulta) ─────────────────────────────
async function consultar() {
  hideToast();
  const input = document.getElementById('consulta-input').value;
  if (!input.trim()) {
    showToast('error', '⚠️ Campo vacío', 'Pega al menos una celda para buscar.');
    return;
  }

  let queries = input.split(/[\s,;-]+/);
  queries = queries.filter(q => q.trim() !== '');
  queries = [...new Set(queries)];

  if (queries.length === 0) return;

  const btn = document.getElementById('btn-consultar');
  btn.classList.add('loading');
  btn.disabled = true;
  document.getElementById('consulta-results-container').style.display = 'none';

  try {
    const res = await fetch('/api/consultar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries }),
    });
    const data = await res.json();

    if (data.ok) {
      showToast('search', `Búsqueda Completada`, `Se procesaron ${queries.length} términos.`);
      renderizarResultados(data.resultados);
    } else {
      showToast('error', '❌ Error al consultar', data.error);
    }
  } catch (e) {
    showToast('error', '❌ Error de conexión', 'No se pudo conectar con el servidor.');
  }

  btn.classList.remove('loading');
  btn.disabled = false;
}

function renderizarResultados(resultados) {
  const container = document.getElementById('consulta-results-container');
  const body = document.getElementById('consulta-results-body');

  let html = '<table class="results-table">';
  html += '<tr><th style="width: 30%">Término</th><th>Archivos Encontrados</th></tr>';

  for (const [query, files] of Object.entries(resultados)) {
    html += '<tr>';
    html += `<td><strong>${query}</strong></td>`;
    html += '<td>';
    if (files.length === 0) {
      html += '<span class="badge-missing">No encontrado</span>';
    } else {
      files.forEach(f => { html += `<span class="badge-found">${f}</span>`; });
    }
    html += '</td>';
    html += '</tr>';
  }
  html += '</table>';

  body.innerHTML = html;
  container.style.display = 'block';
}

// ── Historial ─────────────────────────────────────
async function cargarHistorial() {
  const tbody = document.getElementById('historial-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Cargando historial...</td></tr>';
  try {
    const res = await fetch('/api/historial');
    const data = await res.json();

    if (data.ok && data.historial.length > 0) {
      tbody.innerHTML = data.historial.map(row => {
        const fechaRow   = new Date(row.fecha).toLocaleString();
        const badgeClass = row.modo.includes('Importado') ? 'badge-missing' : 'badge-found';
        const areasStr   = Array.isArray(row.areas) ? row.areas.join(', ') : '';
        return `
          <tr>
            <td style="white-space:nowrap; font-size:0.8rem;">${fechaRow}</td>
            <td><strong>${row.nombreSalida}</strong></td>
            <td>${row.cliente}</td>
            <td><span style="font-size: 0.75rem; max-width: 150px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${areasStr}">${areasStr}</span></td>
            <td><span class="${badgeClass}">${row.modo}</span></td>
            <td>${row.estado}</td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No hay registros en el historial aún.</td></tr>';
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #fca5a5;">Error cargando historial de servidor.</td></tr>';
  }
}

// ── Editor de JS ──────────────────────────────────
async function editorCargarListaArchivos() {
  const sel = document.getElementById('editor-file-select');
  try {
    const res = await fetch('/api/editor/list-js');
    const data = await res.json();
    if (data.ok) {
      sel.innerHTML = '<option value="">— Selecciona un archivo —</option>' +
        data.files.map(f => `<option value="${f}">${f}</option>`).join('');
    } else {
      sel.innerHTML = '<option value="">Error al cargar archivos</option>';
    }
  } catch (e) {
    sel.innerHTML = '<option value="">Error de conexión</option>';
  }
}

async function editorCargarAreas() {
  const filename = document.getElementById('editor-file-select').value;
  if (!filename) {
    showToast('error', '⚠️ Selecciona un archivo', 'Elige un archivo .js del desplegable.');
    return;
  }

  editorCurrentFile = filename;
  const container = document.getElementById('editor-areas-container');
  container.innerHTML = '<div class="editor-empty"><div class="editor-empty-icon">⏳</div>Cargando áreas...</div>';
  document.getElementById('editor-summary').style.display = 'none';
  document.getElementById('editor-controls').style.display = 'none';

  try {
    const res = await fetch(`/api/editor/get-areas/${encodeURIComponent(filename)}`);
    const data = await res.json();

    if (data.ok) {
      editorAreaCount = 0;
      container.innerHTML = '';

      if (data.areas.length === 0) {
        container.innerHTML = '<div class="editor-empty"><div class="editor-empty-icon">📭</div>No se encontraron áreas activas en este archivo.<br><small>Puedes agregar una nueva.</small></div>';
      } else {
        data.areas.forEach(area => {
          editorCrearAreaCard(area.nombre, area.referencia, area.celdas);
        });
      }

      document.getElementById('editor-summary').style.display = 'flex';
      document.getElementById('editor-client-row').style.display = 'block';
      document.getElementById('editor-summary').innerHTML = `
        <div class="editor-summary-item">
          <span class="editor-summary-label">Archivo Abierto</span>
          <span class="editor-summary-value" style="font-size: 1rem;">${filename}</span>
        </div>
        <div class="editor-summary-item">
          <span class="editor-summary-label">Áreas en el código</span>
          <span class="editor-summary-value">${data.areas.length}</span>
        </div>
      `;

      document.getElementById('editor-controls').style.display = 'block';
      showToast('success', '✅ Áreas cargadas', `Se encontraron ${data.areas.length} áreas en ${filename}.`);
    } else {
      container.innerHTML = `<div class="editor-empty"><div class="editor-empty-icon">❌</div>${data.error}</div>`;
      showToast('error', '❌ Error', data.error);
    }
  } catch (e) {
    container.innerHTML = '<div class="editor-empty"><div class="editor-empty-icon">❌</div>Error de conexión al servidor.</div>';
    showToast('error', '❌ Error de conexión', 'No se pudo conectar con el servidor.');
  }
}

function editorCrearAreaCard(nombre = '', referencia = '', celdas = '') {
  editorAreaCount++;
  const id = editorAreaCount;
  const container = document.getElementById('editor-areas-container');

  const card = document.createElement('div');
  card.className = 'editor-area-card';
  card.id = `editor-area-card-${id}`;
  card.innerHTML = `
    <div class="area-card-header">
      <div class="area-card-title">
        <span class="area-num" style="background: #ec4899;">#${id}</span>
        Área ${id}
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="file" id="editor-excel-file-${id}" accept=".xlsx,.xls" style="display:none;" onchange="editorProcesarExcel(${id}, this)" />
        <button class="btn-excel" onclick="document.getElementById('editor-excel-file-${id}').click()" title="Autocompletar área desde archivo Excel" style="border-color: rgba(236,72,153,0.3); color: #f9a8d4;">
          📊 Excel
        </button>
        <button class="btn-remove-area" onclick="editorEliminarArea(${id})" title="Eliminar esta área">✕</button>
      </div>
    </div>
    <div class="area-card-body">
      <div class="area-row">
        <div class="field">
          <label>NombreArea <span class="req">*</span></label>
          <input type="text" id="editor-nombre-${id}" value="${nombre}" placeholder="Ej: Libre11"/>
        </div>
        <div class="field">
          <label>Referencia <span class="req">*</span></label>
          <input type="text" id="editor-referencia-${id}" value="${referencia}" placeholder="Ej: 18P09K21D02I"/>
        </div>
      </div>
      <div class="field">
        <label>Celdas (separadas por coma) <span class="req">*</span></label>
        <textarea id="editor-celdas-${id}" placeholder="18P09K04K05R, 18N05N14M12R, ..." oninput="autoCompletarReferencia(${id}, this, 'editor-')">${celdas}</textarea>
      </div>
      <div class="area-row" style="margin-top: 4px; border-top: 1px dashed var(--border); padding-top: 12px;">
        <div class="field">
          <label>Certificado Ambiental (.pdf)</label>
          <input type="file" id="editor-certificado-${id}" accept=".pdf" />
        </div>
        <div class="field">
          <label>Sheips (.zip)</label>
          <input type="file" id="editor-sheips-${id}" accept=".zip" />
        </div>
      </div>
    </div>
  `;

  container.appendChild(card);
  editorActualizarContador();
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function editorEliminarArea(id) {
  const card = document.getElementById(`editor-area-card-${id}`);
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(-8px)';
    card.style.transition = 'all 0.2s';
    setTimeout(() => { card.remove(); editorActualizarContador(); }, 200);
  }
}

function editorAgregarArea() {
  editorCrearAreaCard();
}

function editorActualizarContador() {
  const count = document.querySelectorAll('.editor-area-card').length;
  const summaryEl = document.getElementById('editor-summary');
  if (summaryEl && summaryEl.style.display !== 'none') {
    const items = summaryEl.querySelectorAll('.editor-summary-value');
    if (items.length >= 2) items[1].textContent = count;
  }
}

async function editorProcesarExcel(id, inputEl) {
  if (!inputEl.files || inputEl.files.length === 0) return;
  const file = inputEl.files[0];
  const formData = new FormData();
  formData.append('excel', file);

  showToast('search', '⏳ Cargando Excel', `Procesando ${file.name}...`);

  try {
    const res = await fetch('/api/leer-excel', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.ok) {
      document.getElementById(`editor-nombre-${id}`).value = data.nombreArea;
      document.getElementById(`editor-celdas-${id}`).value = data.celdas.join(', ');
      if (data.celdas.length > 0) {
        document.getElementById(`editor-referencia-${id}`).value = data.celdas[0];
      }
      showToast('success', '✅ Excel importado', `Se cargaron ${data.celdas.length} celdas en el Área ${id}.`);
    } else {
      showToast('error', '❌ Error en Excel', data.error);
    }
  } catch (e) {
    showToast('error', '❌ Error de conexión', 'No se pudo leer el archivo Excel.');
  }
  inputEl.value = '';
}

async function editorGuardar() {
  if (!editorCurrentFile) {
    showToast('error', '⚠️ Sin archivo', 'No hay archivo seleccionado.');
    return;
  }

  const cards = document.querySelectorAll('.editor-area-card');
  if (cards.length === 0) {
    showToast('error', '⚠️ Sin áreas', 'Agrega al menos un área antes de guardar.');
    return;
  }

  const areas = [];
  const areaDocs = [];
  for (const card of cards) {
    const idStr      = card.id.replace('editor-area-card-', '');
    const nombre     = document.getElementById(`editor-nombre-${idStr}`).value.trim();
    const referencia = document.getElementById(`editor-referencia-${idStr}`).value.trim();
    const celdas     = document.getElementById(`editor-celdas-${idStr}`).value.trim();

    if (!nombre || !referencia || !celdas) {
      showToast('error', '⚠️ Campos incompletos', `El Área #${idStr} tiene campos vacíos.`);
      document.getElementById(`editor-nombre-${idStr}`).focus();
      return;
    }
    areas.push({ nombre, referencia, celdas });

    const certInput   = document.getElementById(`editor-certificado-${idStr}`);
    const sheipsInput = document.getElementById(`editor-sheips-${idStr}`);
    if (certInput.files.length > 0)   areaDocs.push({ field: `certificado-${nombre}`, file: certInput.files[0] });
    if (sheipsInput.files.length > 0) areaDocs.push({ field: `sheips-${nombre}`,      file: sheipsInput.files[0] });
  }

  const cliente = document.getElementById('editor-cliente-select').value;

  let confirmMsg = `¿Estás seguro de guardar ${areas.length} áreas en ${editorCurrentFile}?\n\nSe creará un backup automático (.bak).`;
  if (cliente && areaDocs.length > 0) {
    confirmMsg += `\n\nTambién se subirán ${areaDocs.length} documentos a la carpeta de ${cliente}.`;
  } else if (!cliente && areaDocs.length > 0) {
    alert("⚠️ Has seleccionado archivos para subir pero NO has seleccionado un Cliente. Los documentos NO se guardarán. Por favor selecciona un cliente si deseas subir los certificados.");
    return;
  }

  if (!confirm(confirmMsg)) return;

  const btn = document.getElementById('btn-editor-save');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="display:block;"></div>&nbsp;&nbsp;⏳ Procesando...';

  let docsMensaje = '';

  try {
    if (cliente && areaDocs.length > 0) {
      const formData = new FormData();
      formData.append('cliente', cliente);
      areaDocs.forEach(d => formData.append(d.field, d.file));

      const dRes = await fetch('/api/subir-documentos', { method: 'POST', body: formData });
      const dData = await dRes.json();
      if (dData.ok) {
        docsMensaje = `<br><br>📂 <strong>Documentos:</strong> Se guardaron ${dData.count} archivos en ${cliente}.`;
      } else {
        docsMensaje = `<br><br>⚠️ <strong>Documentos:</strong> Error (${dData.error})`;
      }
    }

    const res = await fetch('/api/editor/save-areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: editorCurrentFile, areas }),
    });
    const data = await res.json();

    if (data.ok) {
      showToast('success', '✅ Proceso completado', data.mensaje + docsMensaje);
      document.querySelectorAll('.editor-area-card input[type="file"]').forEach(f => f.value = '');
    } else {
      showToast('error', '❌ Error al guardar', data.error);
    }
  } catch (e) {
    showToast('error', '❌ Error de conexión', 'Fallo en la comunicación con el servidor.');
  }

  btn.disabled = false;
  btn.innerHTML = '💾 Guardar Cambios';
}
