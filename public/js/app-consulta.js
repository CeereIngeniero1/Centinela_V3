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
