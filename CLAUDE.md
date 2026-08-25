# Colegio San Carlos Diálogos — Sitio Web

Sitio estático en HTML/CSS/JS para el Colegio San Carlos Diálogos.
Repositorio GitHub: `aulatechsc/sitioweb` (branch `master`).

## Estructura del proyecto

```
/
├── index.html              # Página principal (hero slider, niveles, proyectos, talleres, novedades, contacto)
├── nivel-inicial.html      # Página Nivel Inicial (3-5 años)
├── nivel-primario.html     # Página Nivel Primario (1°-6° grado)
├── nivel-secundario.html   # Página Nivel Secundario (1°-6° año)
├── nuestra-identidad.html  # Identidad institucional
├── contacto.html           # Contacto e inscripciones
├── novedades.html          # Grilla de novedades
├── talleres.html           # Talleres extracurriculares
├── novedad-*.html          # Páginas individuales de novedades
├── admin.html              # Panel de administración (GitHub API, sin servidor)
├── styles.css              # Diseño completo responsivo
├── script.js               # Interactividad (slider, nav, admin login modal)
└── admin/
    ├── data/novedades.json # Metadata de novedades (ignorado por git)
    └── server.js           # Admin Node.js alternativo (no usar, reemplazado por admin.html)
```

## Datos del colegio

- **Nombre:** Colegio San Carlos Diálogos
- **Dirección:** José María Paz 2431, Olivos, Buenos Aires
- **Teléfono:** (+11) 4796-0504
- **Email:** administracion@sancarlos.edu.ar
- **Horario de atención:** 7:30 a 19:00 hs
- **Instagram:** @sancarlos_colegio

## Paleta de colores (Manual de Marca)

```css
--primary:    #00476C   /* Azul marino */
--primary-dk: #003352   /* Azul oscuro */
--accent:     #E4051F   /* Rojo */
--sky:        #B9CCE1   /* Azul cielo */
```

## Tipografías

- **Raleway** → títulos, nav, botones, etiquetas
- **Ubuntu** → cuerpo de texto

## Panel de administración (`admin.html`)

- Acceso: botón "Admin" (candado) en todas las páginas → modal usuario/contraseña
- Usuario: `admin` / Contraseña: `SanCarlos2025!`
- Sin servidor — usa la API REST de GitHub para leer y escribir archivos
- Requiere un Personal Access Token de GitHub con scope `repo` (se guarda en localStorage)
- Tabs: Dashboard, Novedades (CRUD), Páginas (edición de textos), Historial (rollback)
- La sección "Páginas" auto-descubre todos los textos editables de cada página y los muestra agrupados por sección

## Novedades

- La grilla está en `novedades.html` dentro de `<div id="noticiasGrid">`
- Cada card tiene clase `.noticia-card` con atributo `data-cat`
- Las páginas individuales siguen el patrón `novedad-{slug}.html`
- El admin genera el HTML de las cards con `generateNovedadHtml()` y regenera la grilla con `regenerateNovedadesGrid()`

## Cómo hacer cambios desde Claude Code

> **IMPORTANTE:** El admin panel (`admin.html`) también puede modificar archivos directamente en GitHub.
> Antes de editar cualquier archivo, siempre hacer `git pull origin master` para traer los últimos cambios y no pisar lo que se haya cargado desde el admin.

1. **Siempre primero:** `git pull origin master`
2. Editar los archivos con las herramientas de Claude Code
3. Commit y push:
   ```
   git add <archivo>
   git commit -m "Descripción del cambio"
   git push origin master
   ```

## Publicar el sitio (deploy manual)

**No hay deploy automático.** GitHub es el repositorio de trabajo; el hosting se
actualiza a mano cuando se quiere publicar. Son dos cosas separadas: un `push` a
GitHub **no** publica nada.

Para publicar:

1. `node herramientas/armar-zip.js` → genera `SITIO-COMPLETO.zip` en el Escritorio
2. Entrar a DirectAdmin: https://da3.toservers.com:2222/evo/login
3. Administrador de Archivos → `/domains/sancarlos.edu.ar/public_html/`
4. Borrar el contenido **menos `.well-known`** (certificado SSL)
5. Subir el ZIP y extraerlo ahí con **Merge and overwrite**
6. Borrar el ZIP del servidor

Detalles en `herramientas/LEEME.md`.

Hubo un workflow de GitHub Actions que publicaba por FTP en cada push. Se quitó
porque el servidor dejó de aceptar la conexión desde las IPs de GitHub
(`connect ETIMEDOUT` al puerto 21), aparentemente por el firewall del hosting.

## Imágenes

Las fotos del sitio están optimizadas a 1800 px de ancho máximo. Las que vienen
de cámara o celular pesan 20 o 30 veces más de lo necesario, así que antes de
publicar fotos nuevas conviene pasarlas por `node herramientas/optimizar-imagenes.js`.

## Git

- Remote: `https://github.com/aulatechsc/sitioweb.git`
- Branch principal: `master`
- Config global: `user.email = aulatech@sancarlos.edu.ar`, `user.name = AulaTech San Carlos`
- `.gitignore` excluye: `.claude/`, `admin/node_modules/`, `admin/data/`,
  `herramientas/node_modules/`, `estructura_raw.xml`, `*.zip` y las carpetas de
  material de referencia (`img/sancarlos-original/`, `img/novedades/ilustradora/`)
