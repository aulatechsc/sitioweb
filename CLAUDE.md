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

## Git

- Remote: `https://github.com/aulatechsc/sitioweb.git`
- Branch principal: `master`
- Config global: `user.email = aulatech@sancarlos.edu.ar`, `user.name = AulaTech San Carlos`
- `.gitignore` excluye: `.claude/`, `admin/node_modules/`, `admin/data/`, `estructura_raw.xml`
