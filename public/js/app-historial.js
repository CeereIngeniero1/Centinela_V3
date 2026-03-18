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
