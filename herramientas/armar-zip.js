const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

const os = require('os');

// La raiz del proyecto es la carpeta que contiene a herramientas/
const RAIZ = path.join(__dirname, '..');
const SALIDA = path.join(os.homedir(), 'Desktop', 'SITIO-COMPLETO.zip');

// Carpetas y archivos que NO van al servidor
const CARPETAS_FUERA = new Set([
  '.git', '.github', '.claude', 'info', 'node_modules', 'herramientas',
]);
const RUTAS_FUERA = [
  'admin/node_modules', 'admin/data',
  'img/sancarlos-original', 'img/novedades/ilustradora',
];
const ARCHIVOS_FUERA = new Set([
  'CLAUDE.md', 'estructura_raw.xml', '.gitignore',
  '.ftp-deploy-sync-state.json', 'desktop.ini',
]);

const aUrl = p => p.split(path.sep).join('/');

function recorrer(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    const rel = aUrl(path.relative(RAIZ, abs));

    if (e.isDirectory()) {
      if (CARPETAS_FUERA.has(e.name)) continue;
      if (RUTAS_FUERA.some(r => rel === r || rel.startsWith(r + '/'))) continue;
      recorrer(abs, acc);
    } else {
      if (ARCHIVOS_FUERA.has(e.name)) continue;
      if (/\.(bat|zip|ai)$/i.test(e.name)) continue;
      if (rel === 'admin/package.json' || rel === 'admin/package-lock.json') continue;
      if (RUTAS_FUERA.some(r => rel.startsWith(r + '/'))) continue;
      acc.push({ abs, rel });
    }
  }
  return acc;
}

(async () => {
  const archivos = recorrer(RAIZ);
  const zip = new JSZip();
  const porTipo = {};
  let bytes = 0;

  for (const { abs, rel } of archivos) {
    zip.file(rel, fs.readFileSync(abs));
    bytes += fs.statSync(abs).size;
    const ext = (path.extname(rel) || '(sin ext)').toLowerCase();
    porTipo[ext] = (porTipo[ext] || 0) + 1;
  }

  const buf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  fs.writeFileSync(SALIDA, buf);

  console.log('CONTENIDO:');
  for (const [ext, n] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + String(n).padStart(4) + '  ' + ext);
  }
  console.log('');
  console.log('Archivos:      ' + archivos.length);
  console.log('Sin comprimir: ' + (bytes / 1048576).toFixed(1) + ' MB');
  console.log('ZIP final:     ' + (buf.length / 1048576).toFixed(1) + ' MB');
  console.log('-> ' + SALIDA);

  // control: los imprescindibles tienen que estar
  const debe = ['index.html', 'styles.css', 'script.js', '.htaccess', 'favicon.ico', 'admisiones.html'];
  console.log('\nCONTROL:');
  for (const d of debe) {
    console.log('  ' + (zip.file(d) ? 'OK  ' : 'FALTA ') + d);
  }
  console.log('  ' + (Object.keys(zip.files).filter(f => f.startsWith('img/')).length) + ' archivos dentro de img/');
})();
