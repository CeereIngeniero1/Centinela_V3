async function batLoadScripts() {
  const sel = document.getElementById('bat-target');
  if (!sel) return;

  try {
    const res = await fetch('/api/scripts');
    const scripts = await res.json();
    sel.innerHTML = '<option value="">— Selecciona un script —</option>' +
      scripts.map(s => `<option value="${s}">${s}</option>`).join('');
  } catch (e) {
    sel.innerHTML = '<option value="">Error al cargar scripts</option>';
  }
}

async function batCrear(action) {
  hideToast();

  const target = (document.getElementById('bat-target').value || '').trim();
  const name = (document.getElementById('bat-name').value || '').trim();

  if (!target) {
    showToast('error', '⚠️ Falta el script', 'Selecciona el script .js para generar el .bat.');
    return;
  }

  if (action === 'download') {
    try {
      const res = await fetch('/api/tools/bat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, name, action: 'download' })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast('error', '❌ Error creando BAT', data.error || 'No fue posible generar el archivo.');
        return;
      }

      const blob = await res.blob();
      const fileName = (name && name.length > 0) ? `${name}.bat` : `Run_${target.replace(/\.js$/i, '')}.bat`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showToast('success', '✅ BAT descargado', `Se descargó <strong>${fileName}</strong>.`);
    } catch (e) {
      showToast('error', '❌ Error de conexión', 'No se pudo conectar con el servidor.');
    }
    return;
  }

  try {
    const res = await fetch('/api/tools/bat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, name, action: 'desktop' })
    });
    const data = await res.json();

    if (data.ok) {
      showToast('success', '✅ BAT creado en Escritorio', `Archivo: <strong>${data.file}</strong><br>Ruta: <code>${data.outPath}</code>`);
    } else {
      showToast('error', '❌ Error creando BAT', data.error || 'No fue posible generar el .bat.');
    }
  } catch (e) {
    showToast('error', '❌ Error de conexión', 'No se pudo conectar con el servidor.');
  }
}

