const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const RAIZ = 'C:/Users/Educacion/Desktop/web San Carlos - new';
const ANCHO_MAX = 1800;
const CALIDAD_JPG = 82;
const NO_TOCAR = /^(favicon|apple-touch-icon|icon-\d+)/i;

const esImagen = f => /\.(jpe?g|png)$/i.test(f);
const abrir = buf => sharp(buf, { failOn: 'none' });        // tolera archivos truncados
const aUrl = p => path.relative(RAIZ, p).split(path.sep).join('/');

function listar(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listar(p, acc);
    else if (esImagen(e.name)) acc.push(p);
  }
  return acc;
}

async function tieneTransparenciaReal(buf) {
  const meta = await abrir(buf).metadata();
  if (!meta.hasAlpha) return false;
  const { data, info } = await abrir(buf)
    .resize({ width: 200, withoutEnlargement: true })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += info.channels) {
    if (data[i] < 250) return true;                          // hay pixeles no opacos
  }
  return false;
}

(async () => {
  const archivos = listar(path.join(RAIZ, 'img'));
  const renombres = [], fallados = [];
  let antes = 0, despues = 0, saltados = 0, hechos = 0;

  for (const abs of archivos) {
    const rel = aUrl(abs);
    if (NO_TOCAR.test(path.basename(abs))) { saltados++; continue; }

    const bytesAntes = fs.statSync(abs).size;

    try {
      const entrada = fs.readFileSync(abs);
      const ext = path.extname(abs).toLowerCase();
      const conservarPng = ext === '.png' && await tieneTransparenciaReal(entrada);

      const base = abrir(entrada)
        .rotate()                                            // respeta orientacion EXIF
        .resize({ width: ANCHO_MAX, withoutEnlargement: true });

      let buf, destino = abs;
      if (conservarPng) {
        buf = await base.png({ compressionLevel: 9, palette: true }).toBuffer();
      } else {
        buf = await base.jpeg({ quality: CALIDAD_JPG, mozjpeg: true }).toBuffer();
        if (ext !== '.jpg') {
          destino = abs.slice(0, -ext.length) + '.jpg';
          renombres.push({ de: rel, a: aUrl(destino) });
        }
      }

      // si no mejora y no cambia de formato, dejarlo como esta
      if (buf.length >= bytesAntes && destino === abs) {
        antes += bytesAntes; despues += bytesAntes; saltados++;
        continue;
      }

      fs.writeFileSync(destino, buf);
      if (destino !== abs) fs.unlinkSync(abs);
      antes += bytesAntes; despues += buf.length; hechos++;

    } catch (e) {
      fallados.push({ rel, msg: String(e.message || e).split('\n')[0] });
      antes += bytesAntes; despues += bytesAntes;
    }
  }

  const mb = b => (b / 1048576).toFixed(1) + ' MB';
  console.log('='.repeat(62));
  console.log('Optimizadas:        ' + hechos);
  console.log('Sin tocar:          ' + saltados);
  console.log('Convertidas a .jpg: ' + renombres.length);
  console.log('Con problemas:      ' + fallados.length);
  console.log('-'.repeat(62));
  console.log('Antes:   ' + mb(antes));
  console.log('Despues: ' + mb(despues));
  console.log('Ahorro:  ' + (100 - despues / antes * 100).toFixed(1) + '%');

  if (fallados.length) {
    console.log('\nNO SE PUDIERON PROCESAR (quedaron intactos):');
    for (const f of fallados) console.log('  ' + f.rel + '\n      ' + f.msg);
  }

  fs.writeFileSync(path.join(__dirname, 'renombres.json'), JSON.stringify(renombres, null, 2));
  console.log('\nrenombres.json escrito con ' + renombres.length + ' entradas');
})();
