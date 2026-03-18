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
