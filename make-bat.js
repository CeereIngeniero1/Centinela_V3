const path = require('path');
const {
  safeBasenameNoExt,
  getDesktopDir,
  resolveTarget,
  buildBatContent,
  writeBatFile
} = require('./tools/bat-generator');

function parseArgs(argv) {
  const args = {
    target: 'server.js',
    name: null,
    out: null,
    pause: true,
    node: null
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target' || a === '-t') {
      args.target = argv[++i];
      continue;
    }
    if (a === '--name' || a === '-n') {
      args.name = argv[++i];
      continue;
    }
    if (a === '--out' || a === '-o') {
      args.out = argv[++i];
      continue;
    }
    if (a === '--no-pause') {
      args.pause = false;
      continue;
    }
    if (a === '--pause') {
      args.pause = true;
      continue;
    }
    if (a === '--node') {
      args.node = argv[++i];
      continue;
    }
    if (a === '--help' || a === '-h') {
      args.help = true;
      continue;
    }
  }

  return args;
}

function usage() {
  return [
    'Uso:',
    '  npm run make-bat -- --target server.js',
    '  npm run make-bat -- --target "Collective Sebas.js" --name "Correr Collective Sebas"',
    '',
    'Opciones:',
    '  --target, -t   Archivo .js a ejecutar (por defecto: server.js)',
    '  --name, -n     Nombre del .bat (sin extension). Default: "Run_<archivo>"',
    '  --out, -o      Ruta de salida del .bat. Default: Escritorio',
    '  --no-pause     No hace pause al final',
    '  --node         Ruta/Comando de node (default: node)',
    ''
  ].join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }

  const projectDir = __dirname;
  const targetAbs = resolveTarget(projectDir, args.target);

  if (!targetAbs.toLowerCase().endsWith('.js')) {
    console.error('El target debe ser un archivo .js.');
    process.exit(1);
  }

  const nodeCmd = args.node || 'node';
  const batName = (args.name && args.name.trim())
    ? args.name.trim()
    : `Run_${safeBasenameNoExt(targetAbs)}`;

  const outDir = args.out
    ? path.isAbsolute(args.out) ? args.out : path.resolve(projectDir, args.out)
    : getDesktopDir();

  const content = buildBatContent({ projectDir, targetAbs, nodeCmd, pause: args.pause });
  const outPath = writeBatFile({ outDir, batName, content });
  console.log(`OK: creado ${outPath}`);
}

main();

