const fs = require('fs');
const path = require('path');
const os = require('os');

function safeBasenameNoExt(p) {
  const b = path.basename(p);
  return b.toLowerCase().endsWith('.js') ? b.slice(0, -3) : b;
}

function getDesktopDir() {
  const home = os.homedir();
  const candidates = [
    path.join(home, 'Desktop'),
    path.join(home, 'Escritorio'),
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Desktop') : null,
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Escritorio') : null,
    process.env.OneDrive ? path.join(process.env.OneDrive, 'Desktop') : null,
    process.env.OneDrive ? path.join(process.env.OneDrive, 'Escritorio') : null,
    process.env.OneDriveConsumer ? path.join(process.env.OneDriveConsumer, 'Desktop') : null,
    process.env.OneDriveCommercial ? path.join(process.env.OneDriveCommercial, 'Desktop') : null
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir;
    } catch { /* ignore */ }
  }

  return candidates[0] || process.cwd();
}

function resolveTarget(projectDir, targetArg) {
  const trimmed = String(targetArg || '').trim();
  const fallback = path.join(projectDir, 'server.js');
  if (!trimmed) return fallback;

  if (!trimmed.includes('/') && !trimmed.includes('\\') && !path.isAbsolute(trimmed)) {
    return path.join(projectDir, trimmed);
  }

  return path.isAbsolute(trimmed) ? trimmed : path.resolve(projectDir, trimmed);
}

function buildBatContent({ projectDir, targetAbs, nodeCmd = 'node', pause = true }) {
  const lines = [
    '@echo off',
    'setlocal',
    `cd /d "${projectDir}"`,
    `${nodeCmd} "${targetAbs}" %*`,
    pause ? 'pause' : '',
    'endlocal'
  ].filter(Boolean);

  return lines.join('\r\n') + '\r\n';
}

function writeBatFile({ outDir, batName, content }) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${batName}.bat`);
  fs.writeFileSync(outPath, content, 'utf8');
  return outPath;
}

module.exports = {
  safeBasenameNoExt,
  getDesktopDir,
  resolveTarget,
  buildBatContent,
  writeBatFile
};

