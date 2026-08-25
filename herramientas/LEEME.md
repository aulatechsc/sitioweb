# Herramientas del sitio

Scripts para preparar el sitio antes de publicarlo. **No forman parte del sitio**:
no se suben al hosting, viven acá solo para poder repetir el proceso.

## Requisitos (una sola vez)

Necesitan Node.js y dos paquetes:

```bash
npm install jszip sharp
```

## Publicar el sitio (lo habitual)

1. Generar el ZIP con todo el sitio:

```bash
node herramientas/armar-zip.js
```

Queda `SITIO-COMPLETO.zip` en el Escritorio (unos 24 MB).

2. Entrar a DirectAdmin: https://da3.toservers.com:2222/evo/login
3. Administrador de Archivos → `/domains/sancarlos.edu.ar/public_html/`
4. Borrar el contenido **menos la carpeta `.well-known`** (es el certificado SSL)
5. Subir `SITIO-COMPLETO.zip`
6. Clic derecho → **Extract**, destino `/domains/sancarlos.edu.ar/public_html/`,
   con **Merge and overwrite** tildado
7. Borrar el ZIP del servidor

El script excluye solo lo que no va en un servidor web: `info/`, `CLAUDE.md`,
`herramientas/`, `node_modules`, los `.bat`, los `.ai` y las carpetas de fotos
que ninguna página usa.

## Optimizar imágenes nuevas

Cuando se agreguen fotos sacadas del celular o de una cámara, conviene pasarlas
por acá antes de publicarlas:

```bash
node herramientas/optimizar-imagenes.js
```

Recorre `img/`, achica todo a 1800 px de ancho como máximo y recomprime.
Las fotos de cámara suelen bajar más del 90 % sin pérdida visible.

**Ojo:** reescribe los archivos sobre sí mismos y convierte a `.jpg` los PNG que
son fotos. Si cambia alguna extensión, hay que actualizar las referencias en el
HTML. Conviene hacer una copia de `img/` antes de correrlo.

## Por qué no hay deploy automático

Hubo un workflow de GitHub Actions que publicaba por FTP en cada push. Se quitó
porque fallaba: primero por timeout (el default de 30 s no alcanzaba para
subidas grandes) y después porque el servidor dejó de aceptar la conexión desde
las IPs de GitHub (`connect ETIMEDOUT` al puerto 21), probablemente por el
firewall del hosting.

Si alguna vez se quiere retomar, hay que pedirle a Towebs que habilite el acceso
FTP desde GitHub, o mejor, que provea SFTP.
