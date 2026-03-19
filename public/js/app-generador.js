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

// ── Cliente / Documentos ──────────────────────────
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
