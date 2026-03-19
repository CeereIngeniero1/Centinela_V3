function gitEscapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function gitSetOutput(title, data) {
  const out = document.getElementById('git-result');
  if (!out) return;

  const stdout = data && data.stdout ? data.stdout : '';
  const stderr = data && data.stderr ? data.stderr : '';
  const error = data && data.error ? data.error : '';

  const blocks = [];
  blocks.push(`## ${title}`);
  if (stdout.trim()) blocks.push(`STDOUT:\n${stdout}`);
  if (stderr.trim()) blocks.push(`STDERR:\n${stderr}`);
  if (error && !stderr.includes(error)) blocks.push(`ERROR:\n${error}`);
  if (blocks.length === 1) blocks.push('Sin salida adicional.');

  out.textContent = blocks.join('\n\n');
}

function gitSetBusy(isBusy) {
  const ids = ['btn-git-install'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = isBusy;
  });
}

function gitAbrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('visible');
}

function gitCerrarModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('visible');
}

async function gitCargarStatus() {
  try {
    const res = await fetch('/api/git/status');
    const data = await res.json();
    if (!data.ok) {
      showToast('error', 'Error de Git', data.error || 'No fue posible consultar estado.');
      return;
    }

    document.getElementById('git-branch').textContent = `Rama: ${data.branch || 'N/A'}`;
    document.getElementById('git-commit').textContent = `Último commit: ${data.lastCommit || 'N/A'}`;

    if (Array.isArray(data.statusLines) && data.statusLines.length > 0) {
      document.getElementById('git-files').innerHTML = `Cambios locales:<br>${data.statusLines.map(l => `- ${gitEscapeHtml(l)}`).join('<br>')}`;
    } else {
      document.getElementById('git-files').textContent = 'Cambios locales: ninguno';
    }
  } catch (err) {
    showToast('error', 'Error de red', err.message || 'No se pudo cargar estado Git.');
  }
}

function gitSolicitarPull() {
  gitAbrirModal('git-modal-pull');
}

async function gitConfirmarPull() {
  gitCerrarModal('git-modal-pull');
  await gitEjecutarPull(false);
}

async function gitConfirmarPullForzado() {
  gitCerrarModal('git-modal-force-pull');
  await gitEjecutarPull(true);
}

async function gitEjecutarPull(force) {
  try {
    gitSetBusy(true);
    showToast('search', force ? 'Forzando actualización' : 'Bajando cambios', 'Ejecutando operación Git...');

    const res = await fetch('/api/git/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(force ? { force: true } : {})
    });
    const data = await res.json();

    if (!data.ok && !force) {
      gitSetOutput('Git pull (falló, requiere decisión)', data);
      gitAbrirModal('git-modal-force-pull');
      showToast('error', 'Conflicto detectado', 'Hay cambios locales/conflictos. Decide si quieres forzar.');
      return;
    }

    gitSetOutput(force ? 'Git pull forzado' : 'Git pull', data);
    if (data.ok) {
      showToast('success', force ? 'Actualización forzada completa' : 'Cambios bajados', 'La operación terminó correctamente.');
    } else {
      showToast('error', 'Error al bajar cambios', data.error || 'Revisa la salida de Git.');
    }
    await gitCargarStatus();
  } catch (err) {
    gitSetOutput('Error de red', { error: err.message });
    showToast('error', 'Error de red', err.message || 'No se pudo ejecutar git pull.');
  } finally {
    gitSetBusy(false);
  }
}

function gitSolicitarPush() {
  const message = (document.getElementById('git-commit-message').value || '').trim();
  if (!message) {
    showToast('error', 'Falta mensaje', 'Debes escribir un mensaje de commit antes de subir.');
    return;
  }

  const txt = document.getElementById('git-push-confirm-text');
  txt.textContent = `Se ejecutará add, commit y push con este mensaje: "${message}". ¿Deseas continuar?`;
  gitAbrirModal('git-modal-push');
}

async function gitConfirmarPush() {
  const message = (document.getElementById('git-commit-message').value || '').trim();
  if (!message) {
    gitCerrarModal('git-modal-push');
    showToast('error', 'Falta mensaje', 'Debes escribir un mensaje de commit.');
    return;
  }

  gitCerrarModal('git-modal-push');
  try {
    gitSetBusy(true);
    showToast('search', 'Subiendo cambios', 'Ejecutando git add, commit y push...');

    const res = await fetch('/api/git/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    gitSetOutput('Git push', data);

    if (data.ok) {
      showToast('success', 'Cambios subidos', 'Push ejecutado correctamente.');
      document.getElementById('git-commit-message').value = '';
    } else {
      showToast('error', 'Error al subir', data.error || 'Revisa la salida de Git.');
    }
    await gitCargarStatus();
  } catch (err) {
    gitSetOutput('Error de red', { error: err.message });
    showToast('error', 'Error de red', err.message || 'No se pudo ejecutar git push.');
  } finally {
    gitSetBusy(false);
  }
}

function gitSolicitarInstallDeps() {
  gitAbrirModal('git-modal-install');
}

async function gitConfirmarInstallDeps() {
  gitCerrarModal('git-modal-install');

  try {
    gitSetBusy(true);
    showToast('search', 'Instalando dependencias', 'Ejecutando npm install, esto puede tardar...');

    const res = await fetch('/api/git/install-deps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    gitSetOutput('npm install', data);

    if (data.ok) {
      showToast('success', 'Dependencias instaladas', 'npm install terminó correctamente.');
    } else {
      showToast('error', 'Error instalando dependencias', data.error || 'Revisa la salida de npm.');
    }
  } catch (err) {
    gitSetOutput('Error de red', { error: err.message });
    showToast('error', 'Error de red', err.message || 'No se pudo ejecutar npm install.');
  } finally {
    gitSetBusy(false);
  }
}
