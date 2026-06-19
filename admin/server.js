'use strict';
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const NOVEDADES_FILE = path.join(DATA_DIR, 'novedades.json');
const PORT = 3001;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(CONFIG_FILE)) {
  const hash = bcrypt.hashSync('SanCarlos2025!', 10);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ username: 'admin', password: hash }, null, 2));
}

if (!fs.existsSync(NOVEDADES_FILE)) {
  try {
    const html = fs.readFileSync(path.join(ROOT, 'novedades.html'), 'utf8');
    const $ = cheerio.load(html);
    const novedades = [];
    $('.noticia-card').each((i, el) => {
      const href = $(el).find('a.noticia-card__img').attr('href') || '';
      const slug = href.replace('novedad-', '').replace('.html', '') || ('novedad-' + i);
      novedades.push({
        slug,
        href: href || ('novedad-' + slug + '.html'),
        img: $(el).find('.noticia-card__img img').attr('src') || '',
        cat: $(el).find('.noticia-card__cat').text().trim(),
        date: $(el).find('time').text().trim(),
        title: $(el).find('h3').text().trim(),
        excerpt: $(el).find('p').text().trim(),
      });
    });
    fs.writeFileSync(NOVEDADES_FILE, JSON.stringify(novedades, null, 2));
  } catch (e) {
    fs.writeFileSync(NOVEDADES_FILE, '[]');
  }
}

const git = simpleGit(ROOT);
const app = express();

const imgDir = path.join(ROOT, 'img', 'novedades');
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
      cb(null, imgDir);
    },
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  }),
  fileFilter: (req, file, cb) => cb(null, /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname))
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
  secret: 'sc-admin-2025-x7q',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));

function auth(req, res, next) {
  if (req.session.ok) return next();
  res.redirect('/admin/login');
}

function getConfig() { return JSON.parse(fs.readFileSync(CONFIG_FILE)); }
function getNovedades() {
  if (!fs.existsSync(NOVEDADES_FILE)) return [];
  return JSON.parse(fs.readFileSync(NOVEDADES_FILE));
}
function saveNovedades(data) { fs.writeFileSync(NOVEDADES_FILE, JSON.stringify(data, null, 2)); }

function slugify(t) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── NOVEDAD HTML GENERATOR ─────────────────────────────────────────────────

function generateNovedadHtml(nov) {
  const gallery = nov.gallery || [];
  const related = nov.related || [];

  const gallerySlides = gallery.map((g, i) =>
    `<div class="carousel__slide"><img src="${g.src}" alt="${escHtml(g.alt || nov.title)}" loading="lazy"/></div>`
  ).join('\n            ');

  const galleryDots = gallery.map((g, i) =>
    `<button class="carousel__dot${i === 0 ? ' active' : ''}" aria-label="Foto ${i + 1}"></button>`
  ).join('\n            ');

  const relatedHtml = related.slice(0, 3).map(r => `
        <a href="${r.href}" class="related-card">
          <img src="${r.img}" alt="${escHtml(r.title)}" loading="lazy" />
          <div class="related-card__body">
            <span class="related-card__cat">${escHtml(r.cat)}</span>
            <h4>${escHtml(r.title)}</h4>
          </div>
        </a>`).join('');

  const carouselSection = gallery.length > 0 ? `
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="article-container">
        <h3 style="font-family:'Raleway',sans-serif;font-size:1rem;font-weight:700;color:var(--primary);margin-bottom:18px">Galería de fotos</h3>
        <div class="carousel" id="carousel-${nov.slug}">
          <div class="carousel__track">
            ${gallerySlides}
          </div>
          <button class="carousel__btn carousel__btn--prev" aria-label="Anterior">&#8249;</button>
          <button class="carousel__btn carousel__btn--next" aria-label="Siguiente">&#8250;</button>
          <div class="carousel__dots">${galleryDots}</div>
          <div class="carousel__counter">1 / ${gallery.length}</div>
        </div>
      </div>
    </div>
  </section>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(nov.title)} | Colegio San Carlos Diálogos</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800&family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
  <style>
    .article-hero{position:relative;height:55vh;min-height:380px;max-height:580px;overflow:hidden;display:flex;align-items:flex-end}
    .article-hero__img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .article-hero__overlay{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,51,82,.88) 0%,rgba(0,71,108,.45) 55%,rgba(0,71,108,.10) 100%)}
    .article-hero__content{position:relative;z-index:2;padding-bottom:48px;color:#fff;max-width:760px}
    .article-cat{display:inline-block;background:var(--accent);color:#fff;font-family:'Raleway',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:16px}
    .article-hero__content h1{font-family:'Raleway',sans-serif;font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;color:#fff;line-height:1.15;margin-bottom:12px}
    .article-hero__content time{font-family:'Raleway',sans-serif;font-size:13px;color:rgba(255,255,255,.75);font-weight:500}
    .article-container{max-width:760px;margin:0 auto}
    .article-back{display:inline-flex;align-items:center;gap:8px;font-family:'Raleway',sans-serif;font-size:13px;font-weight:600;color:var(--primary);text-decoration:none;margin-bottom:40px;padding:8px 0;border-bottom:2px solid transparent;transition:border-color .2s}
    .article-back:hover{border-bottom-color:var(--primary)}
    .article-text p{color:var(--text-lt);line-height:1.85;margin-bottom:18px;font-size:16px}
    .article-text h2{font-family:'Raleway',sans-serif;font-size:1.35rem;font-weight:800;color:var(--primary);margin:36px 0 14px}
    .article-text ul{padding-left:22px;margin-bottom:18px}
    .article-text ul li{color:var(--text-lt);font-size:16px;line-height:1.8;margin-bottom:6px}
    .article-text .highlight{background:var(--light);border-left:4px solid var(--accent);padding:18px 22px;border-radius:0 var(--radius-sm) var(--radius-sm) 0;margin:28px 0}
    .article-text .highlight p{margin-bottom:0;font-size:15px;font-style:italic}
    .related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
    .related-card{background:var(--white);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);border:1px solid var(--gray-border);text-decoration:none;transition:transform .25s ease;display:block}
    .related-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
    .related-card img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
    .related-card__body{padding:14px 16px 18px}
    .related-card__cat{font-family:'Raleway',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--accent);display:block;margin-bottom:6px}
    .related-card__body h4{font-size:.9rem;color:var(--primary);line-height:1.3}
    @media(max-width:700px){.related-grid{grid-template-columns:1fr}}
    .carousel{position:relative;border-radius:var(--radius);overflow:hidden;background:#111}
    .carousel__track{display:flex;transition:transform .5s ease}
    .carousel__slide{min-width:100%;aspect-ratio:16/9;overflow:hidden}
    .carousel__slide img{width:100%;height:100%;object-fit:contain;display:block}
    .carousel__btn{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.9);border:none;border-radius:50%;width:44px;height:44px;cursor:pointer;font-size:1.4rem;font-weight:700;color:var(--primary);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.2);transition:background .2s;z-index:3}
    .carousel__btn:hover{background:#fff}.carousel__btn--prev{left:14px}.carousel__btn--next{right:14px}
    .carousel__dots{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:3}
    .carousel__dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.45);border:none;cursor:pointer;padding:0;transition:background .2s}
    .carousel__dot.active{background:#fff}
    .carousel__counter{position:absolute;top:12px;right:14px;background:rgba(0,0,0,.45);color:#fff;font-family:'Raleway',sans-serif;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;z-index:3}
  </style>
</head>
<body>
  <div class="topbar"><div class="container topbar__inner">
    <div class="topbar__contact">
      <span><svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:rgba(255,255,255,.7);flex-shrink:0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg> José María Paz 2431 – Olivos – Vte. López</span>
      <a href="tel:+541147960504"><svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg> +54 (11) 4796-0504</a>
    </div>
    <div class="topbar__social">
      <a href="https://www.instagram.com/sancarlos_colegio" target="_blank" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
    </div>
  </div></div>
  <header class="header" id="header"><div class="container header__inner">
    <a href="index.html" class="header__logo"><img src="https://sancarlos.edu.ar/wpcsc/wp-content/uploads/2016/06/plantilla-logo-home-SC.png" alt="Colegio San Carlos Diálogos" /></a>
    <button class="header__burger" id="burger" aria-label="Abrir menú"><span></span><span></span><span></span></button>
    <nav class="nav" id="nav">
      <button class="nav__close" id="navClose" aria-label="Cerrar menú">✕</button>
      <ul class="nav__list">
        <li><a href="index.html" class="nav__link">Inicio</a></li>
        <li class="has-dropdown"><a href="index.html#niveles" class="nav__link">Niveles <svg viewBox="0 0 24 24" class="chevron"><path d="M7 10l5 5 5-5z"/></svg></a>
          <ul class="dropdown"><li><a href="nivel-inicial.html">Nivel Inicial</a></li><li><a href="nivel-primario.html">Nivel Primario</a></li><li><a href="nivel-secundario.html">Nivel Secundario</a></li></ul>
        </li>
        <li><a href="nuestra-identidad.html" class="nav__link">Nuestra Identidad</a></li>
        <li><a href="talleres.html" class="nav__link">Talleres</a></li>
        <li><a href="novedades.html" class="nav__link active">Novedades</a></li>
        <li><a href="contacto.html" class="nav__link">Contacto</a></li>
      </ul>
      <a href="https://linktr.ee/sancarlos_colegio" target="_blank" rel="noopener" class="btn btn--primary nav__cta">Admisiones</a>
    </nav>
  </div></header>

  <div class="article-hero">
    <img src="${nov.heroImg}" alt="${escHtml(nov.title)}" class="article-hero__img" />
    <div class="article-hero__overlay"></div>
    <div class="container article-hero__content">
      <span class="article-cat">${escHtml(nov.cat)}</span>
      <h1>${escHtml(nov.title)}</h1>
      <time>${escHtml(nov.date)}</time>
    </div>
  </div>

  <section class="section"><div class="container"><div class="article-container">
    <a href="novedades.html" class="article-back">← Volver a Novedades</a>
    <div class="article-text">${nov.body}</div>
  </div></div></section>
  ${carouselSection}

  <section class="section bg-light"><div class="container">
    <div class="section__header">
      <p class="section__eyebrow">Seguí leyendo</p>
      <h2 class="section__title">Más novedades</h2>
    </div>
    <div class="related-grid">${relatedHtml}</div>
    <div style="text-align:center;margin-top:40px"><a href="novedades.html" class="btn btn--primary">Ver todas las novedades</a></div>
  </div></section>

  <footer class="footer"><div class="container footer__grid">
    <div class="footer__brand">
      <img src="https://sancarlos.edu.ar/wpcsc/wp-content/uploads/2016/06/plantilla-logo-home-SC.png" alt="Colegio San Carlos Diálogos" class="footer__logo" loading="lazy" />
    </div>
    <div class="footer__col"><h5>Novedades</h5><ul><li><a href="novedades.html">Todas las novedades</a></li></ul></div>
    <div class="footer__col"><h5>El Colegio</h5><ul><li><a href="nivel-inicial.html">Nivel Inicial</a></li><li><a href="nivel-primario.html">Nivel Primario</a></li><li><a href="nivel-secundario.html">Nivel Secundario</a></li><li><a href="nuestra-identidad.html">Nuestra Identidad</a></li></ul></div>
    <div class="footer__col"><h5>Contacto</h5><ul><li>José María Paz 2431, Olivos</li><li><a href="tel:+541147960504">(+11) 4796-0504</a></li><li>Lun–Vie 7:30 a 19:00 hs</li></ul></div>
  </div><div class="footer__bottom"><p>&copy; 2025 Colegio San Carlos Diálogos. Todos los derechos reservados.</p></div></footer>

  <script>
    const burger=document.getElementById('burger'),nav=document.getElementById('nav'),navClose=document.getElementById('navClose');
    burger.addEventListener('click',()=>nav.classList.toggle('open'));
    navClose.addEventListener('click',()=>nav.classList.remove('open'));
    ${gallery.length > 0 ? `function initCarousel(id){const el=document.getElementById(id);if(!el)return;const track=el.querySelector('.carousel__track'),slides=el.querySelectorAll('.carousel__slide'),dots=el.querySelectorAll('.carousel__dot'),counter=el.querySelector('.carousel__counter');let cur=0,timer;function go(n){cur=(n+slides.length)%slides.length;track.style.transform='translateX(-'+cur*100+'%)';dots.forEach((d,i)=>d.classList.toggle('active',i===cur));if(counter)counter.textContent=(cur+1)+' / '+slides.length;}el.querySelector('.carousel__btn--prev').addEventListener('click',()=>{clearInterval(timer);go(cur-1);start();});el.querySelector('.carousel__btn--next').addEventListener('click',()=>{clearInterval(timer);go(cur+1);start();});dots.forEach((d,i)=>d.addEventListener('click',()=>{clearInterval(timer);go(i);start();}));function start(){timer=setInterval(()=>go(cur+1),4500);}go(0);start();}initCarousel('carousel-${nov.slug}');` : ''}
  </script>
</body>
</html>`;
}

// ── REGENERATE novedades.html GRID ─────────────────────────────────────────

function regenerateNovedadesGrid(novedades) {
  const htmlFile = path.join(ROOT, 'novedades.html');
  let html = fs.readFileSync(htmlFile, 'utf8');
  const cards = novedades.map(n => `
        <article class="noticia-card fade-in" data-cat="${escHtml(n.cat)}">
          <a href="${n.href || 'novedad-' + n.slug + '.html'}" class="noticia-card__img">
            <img src="${n.img}" alt="${escHtml(n.title)}" loading="lazy" />
            <span class="noticia-card__cat">${escHtml(n.cat)}</span>
          </a>
          <div class="noticia-card__body">
            <time>${escHtml(n.date)}</time>
            <h3>${escHtml(n.title)}</h3>
            <p>${escHtml(n.excerpt)}</p>
            <a href="${n.href || 'novedad-' + n.slug + '.html'}" class="link-arrow">Leer más →</a>
          </div>
        </article>`).join('\n');
  html = html.replace(
    /(<div class="noticias-grid" id="noticiasGrid">)([\s\S]*?)(<p class="no-results")/,
    `$1\n${cards}\n\n        $3`
  );
  fs.writeFileSync(htmlFile, html);
}

// ── ADMIN CSS ───────────────────────────────────────────────────────────────

const ADMIN_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;color:#1e293b;min-height:100vh}
a{color:inherit;text-decoration:none}
/* Login */
.login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#003352 0%,#00476a 100%)}
.login-card{background:#fff;border-radius:16px;padding:48px 40px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.login-logo{text-align:center;margin-bottom:32px}
.login-logo img{height:52px}
.login-card h1{font-size:1.3rem;font-weight:700;color:#003352;margin-bottom:6px;text-align:center}
.login-card p{font-size:.875rem;color:#64748b;text-align:center;margin-bottom:32px}
.field{margin-bottom:18px}
.field label{display:block;font-size:.8rem;font-weight:600;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px}
.field input{width:100%;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.95rem;transition:border-color .2s;outline:none}
.field input:focus{border-color:#3b82f6}
.btn-login{width:100%;padding:13px;background:#003352;color:#fff;border:none;border-radius:8px;font-size:.95rem;font-weight:600;cursor:pointer;transition:background .2s}
.btn-login:hover{background:#004d78}
.alert{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 14px;border-radius:8px;font-size:.875rem;margin-bottom:18px}
.alert-ok{background:#f0fdf4;border-color:#bbf7d0;color:#15803d}
/* Layout */
.layout{display:flex;min-height:100vh}
.sidebar{width:240px;background:#0f172a;color:#e2e8f0;flex-shrink:0;display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:100}
.sidebar__logo{padding:24px 20px 20px;border-bottom:1px solid #1e293b}
.sidebar__logo img{height:40px}
.sidebar__logo span{display:block;font-size:.7rem;color:#64748b;margin-top:6px;letter-spacing:.5px;text-transform:uppercase}
.sidebar__nav{flex:1;padding:16px 0;overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:12px;padding:11px 20px;font-size:.875rem;font-weight:500;color:#94a3b8;cursor:pointer;transition:all .2s;border:none;background:none;width:100%;text-align:left;border-left:3px solid transparent}
.nav-item svg{width:18px;height:18px;fill:currentColor;flex-shrink:0}
.nav-item:hover{color:#e2e8f0;background:#1e293b}
.nav-item.active{color:#fff;background:#1e3a5f;border-left-color:#3b82f6}
.sidebar__bottom{padding:16px;border-top:1px solid #1e293b}
.btn-logout{display:flex;align-items:center;gap:8px;font-size:.8rem;color:#64748b;background:none;border:none;cursor:pointer;padding:8px 4px}
.btn-logout:hover{color:#e2e8f0}
.main{margin-left:240px;flex:1;display:flex;flex-direction:column}
.topbar-admin{background:#fff;border-bottom:1px solid #e2e8f0;padding:0 32px;height:60px;display:flex;align-items:center;justify-content:space-between}
.topbar-admin h2{font-size:1rem;font-weight:600;color:#1e293b}
.topbar-admin .badge{background:#f1f5f9;padding:4px 12px;border-radius:20px;font-size:.75rem;color:#64748b}
.content{padding:28px 32px;flex:1}
/* Cards */
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px}
.stat-card{background:#fff;border-radius:12px;padding:20px 24px;border:1px solid #e2e8f0}
.stat-card__num{font-size:2rem;font-weight:700;color:#003352}
.stat-card__label{font-size:.8rem;color:#64748b;margin-top:4px}
/* Panel */
.panel{background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden}
.panel__header{padding:18px 24px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between}
.panel__header h3{font-size:.95rem;font-weight:600}
.panel__body{padding:24px}
/* Table */
.table{width:100%;border-collapse:collapse}
.table th{text-align:left;padding:10px 14px;font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:#64748b;border-bottom:2px solid #e2e8f0}
.table td{padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:.875rem;vertical-align:middle}
.table tr:last-child td{border-bottom:none}
.table tr:hover td{background:#f8fafc}
.table img{width:52px;height:38px;object-fit:cover;border-radius:6px}
/* Badges */
.tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.7rem;font-weight:600;letter-spacing:.5px}
.tag-blue{background:#dbeafe;color:#1d4ed8}
.tag-green{background:#dcfce7;color:#15803d}
.tag-orange{background:#ffedd5;color:#c2410c}
.tag-purple{background:#f3e8ff;color:#7c3aed}
.tag-red{background:#fee2e2;color:#b91c1c}
/* Buttons */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;border:none;transition:all .2s}
.btn-primary{background:#003352;color:#fff}.btn-primary:hover{background:#004d78}
.btn-accent{background:#e85d26;color:#fff}.btn-accent:hover{background:#c94d1e}
.btn-ghost{background:#f1f5f9;color:#374151}.btn-ghost:hover{background:#e2e8f0}
.btn-danger{background:#fee2e2;color:#b91c1c}.btn-danger:hover{background:#fecaca}
.btn-sm{padding:5px 12px;font-size:.75rem}
.btn svg{width:14px;height:14px;fill:currentColor}
/* Form */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.form-group{margin-bottom:20px}
.form-group.full{grid-column:1/-1}
.form-group label{display:block;font-size:.8rem;font-weight:600;color:#374151;margin-bottom:6px}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.875rem;font-family:inherit;outline:none;transition:border-color .2s}
.form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:#3b82f6}
.form-group textarea{resize:vertical;min-height:120px}
.form-group .hint{font-size:.75rem;color:#94a3b8;margin-top:4px}
.img-preview{width:100%;height:160px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;margin-top:8px;display:none}
.img-preview.show{display:block}
/* Rich text toolbar */
.editor-wrap{border:1.5px solid #e2e8f0;border-radius:8px;overflow:hidden}
.editor-wrap:focus-within{border-color:#3b82f6}
.editor-toolbar{background:#f8fafc;padding:8px 10px;display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid #e2e8f0}
.editor-toolbar button{padding:4px 8px;border:none;background:none;border-radius:4px;cursor:pointer;font-size:.8rem;font-weight:600;color:#374151}
.editor-toolbar button:hover{background:#e2e8f0}
.editor-content{min-height:200px;padding:14px;outline:none;font-size:.9rem;line-height:1.7}
/* Git history */
.commit-list{list-style:none}
.commit-item{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #f1f5f9}
.commit-item:last-child{border-bottom:none}
.commit-hash{font-family:monospace;font-size:.75rem;background:#f1f5f9;padding:3px 8px;border-radius:4px;color:#64748b;flex-shrink:0}
.commit-msg{flex:1;font-size:.875rem}
.commit-date{font-size:.75rem;color:#94a3b8;flex-shrink:0}
/* Tabs */
.tabs{display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:24px}
.tab{padding:10px 20px;font-size:.875rem;font-weight:600;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;background:none;border-top:none;border-left:none;border-right:none}
.tab.active{color:#003352;border-bottom-color:#003352}
.tab-pane{display:none}.tab-pane.active{display:block}
/* Toast */
#toast{position:fixed;bottom:24px;right:24px;background:#0f172a;color:#fff;padding:12px 20px;border-radius:10px;font-size:.875rem;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,.2);z-index:9999;transform:translateY(100px);opacity:0;transition:all .3s}
#toast.show{transform:translateY(0);opacity:1}
#toast.ok{background:#15803d}
#toast.err{background:#b91c1c}
/* Confirm modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:999;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s}
.modal-overlay.show{opacity:1;pointer-events:all}
.modal-box{background:#fff;border-radius:14px;padding:32px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.modal-box h4{font-size:1rem;font-weight:700;margin-bottom:10px}
.modal-box p{font-size:.875rem;color:#64748b;margin-bottom:24px}
.modal-actions{display:flex;gap:10px;justify-content:flex-end}
`;

// ── PAGE FIELD DEFINITIONS ──────────────────────────────────────────────────

const PAGE_FIELDS = {
  'index.html': [
    { id: 'hero_title',   label: 'Hero - Título',        selector: '.hero__title',      type: 'text' },
    { id: 'hero_sub',     label: 'Hero - Subtítulo',     selector: '.hero__subtitle',   type: 'textarea' },
    { id: 'hero_eyebrow', label: 'Hero - Etiqueta',      selector: '.hero .section__eyebrow', type: 'text' },
  ],
  'contacto.html': [
    { id: 'dir',    label: 'Dirección',       selector: '.contact-info .address',  type: 'text' },
    { id: 'phone',  label: 'Teléfono',        selector: '.contact-info .phone',    type: 'text' },
    { id: 'email',  label: 'Email',           selector: '.contact-info .email',    type: 'text' },
    { id: 'hours',  label: 'Horario',         selector: '.contact-info .hours',    type: 'text' },
  ],
  'nuestra-identidad.html': [
    { id: 'id_title',  label: 'Título principal', selector: 'h1.page-title, .hero-title h1, .page-hero h1', type: 'text' },
  ],
};

// Fallback: edit raw text sections by page with cheerio best-effort
function getPageFields(filename) {
  const filePath = path.join(ROOT, filename);
  if (!fs.existsSync(filePath)) return [];
  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'));
  const fields = [];

  // Extract hero content
  const heroTitle = $('.hero__title, .hero-title, .page-hero h1').first();
  if (heroTitle.length) fields.push({ id: 'hero_title', label: 'Título del hero', val: heroTitle.text().trim() });

  const heroSub = $('.hero__subtitle, .hero p, .hero-sub').first();
  if (heroSub.length) fields.push({ id: 'hero_sub', label: 'Subtítulo / descripción', val: heroSub.text().trim() });

  const eyebrow = $('.hero .section__eyebrow, .hero__eyebrow').first();
  if (eyebrow.length) fields.push({ id: 'eyebrow', label: 'Etiqueta (eyebrow)', val: eyebrow.text().trim() });

  // Paragraphs in main content sections (first 3)
  let pCount = 0;
  $('section .section__text p, section .content-block p, section .prose p').each((i, el) => {
    if (pCount >= 3) return false;
    const txt = $(el).text().trim();
    if (txt.length > 20) {
      fields.push({ id: 'p_' + i, label: `Párrafo ${pCount + 1}`, val: txt });
      pCount++;
    }
  });

  return fields;
}

function updatePageField(filename, fieldId, value) {
  const filePath = path.join(ROOT, filename);
  if (!fs.existsSync(filePath)) return false;
  let html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  if (fieldId === 'hero_title') {
    const el = $('.hero__title, .hero-title, .page-hero h1').first();
    if (el.length) { el.text(value); fs.writeFileSync(filePath, $.html()); return true; }
  }
  if (fieldId === 'hero_sub') {
    const el = $('.hero__subtitle, .hero p, .hero-sub').first();
    if (el.length) { el.text(value); fs.writeFileSync(filePath, $.html()); return true; }
  }
  if (fieldId === 'eyebrow') {
    const el = $('.hero .section__eyebrow, .hero__eyebrow').first();
    if (el.length) { el.text(value); fs.writeFileSync(filePath, $.html()); return true; }
  }
  if (fieldId.startsWith('p_')) {
    const idx = parseInt(fieldId.replace('p_', ''));
    let pCount = 0;
    let updated = false;
    $('section .section__text p, section .content-block p, section .prose p').each((i, el) => {
      const txt = $(el).text().trim();
      if (txt.length > 20) {
        if (pCount === idx) { $(el).text(value); updated = true; return false; }
        pCount++;
      }
    });
    if (updated) { fs.writeFileSync(filePath, $.html()); return true; }
  }
  return false;
}

// ── ADMIN HTML SHELL ────────────────────────────────────────────────────────

function adminShell(activeTab, title, body) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)} — Admin San Carlos</title>
  <style>${ADMIN_CSS}</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="sidebar__logo">
      <img src="https://sancarlos.edu.ar/wpcsc/wp-content/uploads/2016/06/plantilla-logo-home-SC.png" alt="San Carlos" />
      <span>Panel de administración</span>
    </div>
    <nav class="sidebar__nav">
      <a href="/admin/dashboard" class="nav-item${activeTab==='dashboard'?' active':''}">
        <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
        Inicio
      </a>
      <a href="/admin/novedades" class="nav-item${activeTab==='novedades'?' active':''}">
        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        Novedades
      </a>
      <a href="/admin/paginas" class="nav-item${activeTab==='paginas'?' active':''}">
        <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        Páginas
      </a>
      <a href="/admin/historial" class="nav-item${activeTab==='historial'?' active':''}">
        <svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
        Historial
      </a>
      <a href="/admin/publicar" class="nav-item${activeTab==='publicar'?' active':''}">
        <svg viewBox="0 0 24 24"><path d="M5 4v2h14V4H5zm0 10h4v6h6v-6h4l-7-7-7 7z"/></svg>
        Publicar
      </a>
    </nav>
    <div class="sidebar__bottom">
      <form action="/admin/logout" method="post">
        <button type="submit" class="btn-logout">
          <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          Cerrar sesión
        </button>
      </form>
    </div>
  </aside>
  <div class="main">
    <div class="topbar-admin">
      <h2>${escHtml(title)}</h2>
      <span class="badge">Colegio San Carlos Diálogos</span>
    </div>
    <div class="content">${body}</div>
  </div>
</div>
<div id="toast"></div>
<div class="modal-overlay" id="confirmModal">
  <div class="modal-box">
    <h4 id="modalTitle">¿Confirmar acción?</h4>
    <p id="modalMsg"></p>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" id="modalConfirmBtn">Confirmar</button>
    </div>
  </div>
</div>
<script>
function toast(msg, type='ok'){const t=document.getElementById('toast');t.textContent=msg;t.className='show '+(type==='ok'?'ok':'err');setTimeout(()=>t.className='',3000);}
function closeModal(){document.getElementById('confirmModal').classList.remove('show');}
function confirm(title,msg,cb){document.getElementById('modalTitle').textContent=title;document.getElementById('modalMsg').textContent=msg;document.getElementById('modalConfirmBtn').onclick=()=>{closeModal();cb();};document.getElementById('confirmModal').classList.add('show');}
async function api(url,opts={}){const r=await fetch(url,{headers:{'Content-Type':'application/json'},...opts});const j=await r.json();return j;}
</script>
</body>
</html>`;
}

// ── ROUTES ──────────────────────────────────────────────────────────────────

// Login
app.get('/admin', (req, res) => res.redirect(req.session.ok ? '/admin/dashboard' : '/admin/login'));

app.get('/admin/login', (req, res) => {
  if (req.session.ok) return res.redirect('/admin/dashboard');
  const err = req.session.loginErr; delete req.session.loginErr;
  res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin — San Carlos</title><style>${ADMIN_CSS}</style></head><body>
<div class="login-page">
  <div class="login-card">
    <div class="login-logo"><img src="https://sancarlos.edu.ar/wpcsc/wp-content/uploads/2016/06/plantilla-logo-home-SC.png" alt="San Carlos" /></div>
    <h1>Panel de Administración</h1>
    <p>Ingresá tus credenciales para continuar</p>
    ${err ? `<div class="alert">${escHtml(err)}</div>` : ''}
    <form method="post" action="/admin/login">
      <div class="field"><label>Usuario</label><input name="username" type="text" autocomplete="username" required autofocus /></div>
      <div class="field"><label>Contraseña</label><input name="password" type="password" autocomplete="current-password" required /></div>
      <button type="submit" class="btn-login">Ingresar</button>
    </form>
  </div>
</div></body></html>`);
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const cfg = getConfig();
  if (username === cfg.username && bcrypt.compareSync(password, cfg.password)) {
    req.session.ok = true;
    return res.redirect('/admin/dashboard');
  }
  req.session.loginErr = 'Usuario o contraseña incorrectos.';
  res.redirect('/admin/login');
});

app.post('/admin/logout', (req, res) => { req.session.destroy(); res.redirect('/admin/login'); });

// Dashboard
app.get('/admin/dashboard', auth, (req, res) => {
  const novedades = getNovedades();
  const body = `
  <div class="stats">
    <div class="stat-card"><div class="stat-card__num">${novedades.length}</div><div class="stat-card__label">Novedades publicadas</div></div>
    <div class="stat-card"><div class="stat-card__num">6</div><div class="stat-card__label">Páginas del sitio</div></div>
    <div class="stat-card"><div class="stat-card__num">1</div><div class="stat-card__label">Repositorio activo</div></div>
  </div>
  <div class="panel">
    <div class="panel__header"><h3>Accesos rápidos</h3></div>
    <div class="panel__body" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
      <a href="/admin/novedades/nueva" class="btn btn-accent" style="justify-content:center;padding:16px">
        <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Nueva novedad
      </a>
      <a href="/admin/novedades" class="btn btn-ghost" style="justify-content:center;padding:16px">Ver todas las novedades</a>
      <a href="/admin/publicar" class="btn btn-primary" style="justify-content:center;padding:16px">
        <svg viewBox="0 0 24 24"><path d="M5 4v2h14V4H5zm0 10h4v6h6v-6h4l-7-7-7 7z"/></svg>
        Publicar cambios
      </a>
    </div>
  </div>
  <div style="margin-top:20px" class="panel">
    <div class="panel__header"><h3>Últimas novedades</h3><a href="/admin/novedades" class="btn btn-ghost btn-sm">Ver todas</a></div>
    <table class="table">
      <thead><tr><th>Imagen</th><th>Título</th><th>Categoría</th><th>Fecha</th><th></th></tr></thead>
      <tbody>
        ${novedades.slice(0, 5).map(n => `
        <tr>
          <td><img src="${escHtml(n.img)}" alt="" /></td>
          <td><strong>${escHtml(n.title)}</strong></td>
          <td><span class="tag tag-blue">${escHtml(n.cat)}</span></td>
          <td>${escHtml(n.date)}</td>
          <td><a href="/admin/novedades/${encodeURIComponent(n.slug)}/editar" class="btn btn-ghost btn-sm">Editar</a></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
  res.send(adminShell('dashboard', 'Inicio', body));
});

// Novedades list
app.get('/admin/novedades', auth, (req, res) => {
  const novedades = getNovedades();
  const rows = novedades.map((n, i) => `
    <tr>
      <td><img src="${escHtml(n.img)}" alt="" /></td>
      <td><strong>${escHtml(n.title)}</strong><br><span style="font-size:.75rem;color:#94a3b8">${escHtml(n.href || 'novedad-' + n.slug + '.html')}</span></td>
      <td><span class="tag tag-blue">${escHtml(n.cat)}</span></td>
      <td>${escHtml(n.date)}</td>
      <td style="display:flex;gap:6px;align-items:center">
        <a href="/admin/novedades/${encodeURIComponent(n.slug)}/editar" class="btn btn-ghost btn-sm">Editar</a>
        <button onclick="deleteNov('${escHtml(n.slug)}','${escHtml(n.title)}')" class="btn btn-danger btn-sm">Eliminar</button>
        ${i > 0 ? `<button onclick="moveNov('${escHtml(n.slug)}','up')" class="btn btn-ghost btn-sm" title="Subir">↑</button>` : ''}
        ${i < novedades.length-1 ? `<button onclick="moveNov('${escHtml(n.slug)}','down')" class="btn btn-ghost btn-sm" title="Bajar">↓</button>` : ''}
      </td>
    </tr>`).join('');

  const body = `
  <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
    <a href="/admin/novedades/nueva" class="btn btn-accent">
      <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
      Nueva novedad
    </a>
  </div>
  <div class="panel">
    <div class="panel__header"><h3>Todas las novedades (${novedades.length})</h3></div>
    <table class="table">
      <thead><tr><th>Imagen</th><th>Título</th><th>Categoría</th><th>Fecha</th><th>Acciones</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:32px">No hay novedades todavía.</td></tr>'}</tbody>
    </table>
  </div>
  <script>
  async function deleteNov(slug, title) {
    confirm('Eliminar novedad', '¿Eliminar "' + title + '"? Esta acción no se puede deshacer.', async () => {
      const r = await api('/admin/api/novedades/' + slug, {method:'DELETE'});
      if (r.ok) { toast('Novedad eliminada'); setTimeout(()=>location.reload(),800); }
      else toast(r.error||'Error al eliminar','err');
    });
  }
  async function moveNov(slug, dir) {
    const r = await api('/admin/api/novedades/' + slug + '/move', {method:'POST', body: JSON.stringify({dir})});
    if (r.ok) location.reload();
    else toast(r.error||'Error','err');
  }
  </script>`;
  res.send(adminShell('novedades', 'Novedades', body));
});

// New novedad form
app.get('/admin/novedades/nueva', auth, (req, res) => {
  res.send(adminShell('novedades', 'Nueva novedad', novedadForm(null, getNovedades())));
});

// Edit novedad form
app.get('/admin/novedades/:slug/editar', auth, (req, res) => {
  const novedades = getNovedades();
  const nov = novedades.find(n => n.slug === req.params.slug);
  if (!nov) return res.redirect('/admin/novedades');
  // Try to read existing body from HTML file
  const htmlFile = path.join(ROOT, 'novedad-' + nov.slug + '.html');
  if (fs.existsSync(htmlFile) && !nov.body) {
    const $ = cheerio.load(fs.readFileSync(htmlFile, 'utf8'));
    nov.body = $('.article-text').html() || '';
    const slides = [];
    $('.carousel__slide img').each((i, el) => {
      slides.push({ src: $(el).attr('src') || '', alt: $(el).attr('alt') || '' });
    });
    if (slides.length) nov.gallery = slides;
  }
  res.send(adminShell('novedades', 'Editar: ' + nov.title, novedadForm(nov, novedades)));
});

function novedadForm(nov, allNovedades) {
  const cats = ['Académico','Institucional','Deportes','Comunidad','Internacional','Proyecto','Convivencia'];
  const isNew = !nov;
  const related = nov ? (nov.related || []) : [];
  const gallery = nov ? (nov.gallery || []) : [];

  return `
  <form id="novForm" enctype="multipart/form-data">
  <div class="panel" style="margin-bottom:20px">
    <div class="panel__header"><h3>${isNew ? 'Nueva novedad' : 'Editar novedad'}</h3></div>
    <div class="panel__body">
      <div class="form-grid">
        <div class="form-group">
          <label>Título *</label>
          <input type="text" id="fTitle" value="${escHtml(nov?.title||'')}" required placeholder="Ej: Exámenes Cambridge 2026" />
        </div>
        <div class="form-group">
          <label>Categoría *</label>
          <select id="fCat">
            ${cats.map(c => `<option value="${c}"${nov?.cat===c?' selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Fecha</label>
          <input type="text" id="fDate" value="${escHtml(nov?.date||'')}" placeholder="Ej: Junio 2025" />
        </div>
        <div class="form-group">
          <label>Imagen hero (URL o subir)</label>
          <input type="text" id="fImg" value="${escHtml(nov?.img||'')}" placeholder="img/novedades/mi-imagen.jpg" oninput="previewHero(this.value)" />
          <div class="hint">O cargá un archivo:</div>
          <input type="file" id="fImgFile" accept="image/*" onchange="uploadImg(this,'fImg','heroPreview')" />
          <img id="heroPreview" class="img-preview${nov?.img?' show':''}" src="${escHtml(nov?.img||'')}" />
        </div>
        <div class="form-group">
          <label>Extracto (para la lista de novedades)</label>
          <textarea id="fExcerpt" rows="3">${escHtml(nov?.excerpt||'')}</textarea>
        </div>
      </div>
    </div>
  </div>

  <div class="panel" style="margin-bottom:20px">
    <div class="panel__header"><h3>Cuerpo del artículo</h3></div>
    <div class="panel__body">
      <div class="form-group full">
        <label>Contenido HTML (podés usar &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;)</label>
        <div class="editor-wrap">
          <div class="editor-toolbar">
            <button type="button" onclick="fmt('bold')"><strong>N</strong></button>
            <button type="button" onclick="fmt('italic')"><em>K</em></button>
            <button type="button" onclick="insertTag('h2')">H2</button>
            <button type="button" onclick="insertTag('p')">¶ Párrafo</button>
            <button type="button" onclick="insertTag('ul')">Lista</button>
            <button type="button" onclick="insertHighlight()">Cita destacada</button>
          </div>
          <div class="editor-content" id="fBody" contenteditable="true">${nov?.body||'<p>Escribí el contenido de la novedad aquí...</p>'}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="panel" style="margin-bottom:20px">
    <div class="panel__header"><h3>Galería de fotos</h3></div>
    <div class="panel__body">
      <div id="galleryList">
        ${gallery.map((g,i) => `
        <div class="gallery-item" data-i="${i}" style="display:flex;gap:10px;align-items:center;margin-bottom:10px">
          <img src="${escHtml(g.src)}" style="width:60px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0" />
          <input type="text" value="${escHtml(g.src)}" placeholder="URL imagen" style="flex:1;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:.8rem" onchange="updateGallery()" class="g-src" />
          <input type="text" value="${escHtml(g.alt)}" placeholder="Descripción" style="width:200px;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:.8rem" onchange="updateGallery()" class="g-alt" />
          <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.gallery-item').remove();updateGallery()">✕</button>
        </div>`).join('')}
      </div>
      <div style="display:flex;gap:10px;margin-top:12px">
        <button type="button" class="btn btn-ghost btn-sm" onclick="addGalleryRow()">+ Agregar foto por URL</button>
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">
          + Subir foto
          <input type="file" accept="image/*" style="display:none" onchange="uploadImg(this,null,null,true)" multiple />
        </label>
      </div>
    </div>
  </div>

  <div class="panel" style="margin-bottom:20px">
    <div class="panel__header"><h3>Novedades relacionadas (hasta 3)</h3></div>
    <div class="panel__body">
      <div id="relatedList">
        ${related.map((r,i) => `
        <div class="related-row" style="display:flex;gap:10px;align-items:center;margin-bottom:10px">
          <select style="flex:1;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:.8rem" class="r-href" onchange="fillRelated(this)">
            <option value="">— Seleccionar novedad —</option>
            ${allNovedades.filter(n=>n.slug!==nov?.slug).map(n=>`<option value="${escHtml(n.href||'novedad-'+n.slug+'.html')}" data-img="${escHtml(n.img)}" data-cat="${escHtml(n.cat)}" data-title="${escHtml(n.title)}"${r.href===(n.href||'novedad-'+n.slug+'.html')?' selected':''}>${escHtml(n.title)}</option>`).join('')}
          </select>
          <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.related-row').remove()">✕</button>
        </div>`).join('')}
      </div>
      <button type="button" class="btn btn-ghost btn-sm" onclick="addRelatedRow()" style="margin-top:8px">+ Agregar relacionada</button>
    </div>
  </div>

  <div style="display:flex;gap:12px;justify-content:flex-end">
    <a href="/admin/novedades" class="btn btn-ghost">Cancelar</a>
    <button type="button" class="btn btn-primary" onclick="saveNov(false)">Guardar borrador</button>
    <button type="button" class="btn btn-accent" onclick="saveNov(true)">Guardar y publicar</button>
  </div>
  </form>

  <script>
  const CURRENT_SLUG = ${JSON.stringify(nov?.slug || null)};
  const ALL_NOV = ${JSON.stringify(allNovedades)};

  function fmt(cmd){ document.execCommand(cmd); }
  function insertTag(tag){
    const sel=window.getSelection();
    if(!sel.rangeCount)return;
    const range=sel.getRangeAt(0);
    const el=document.createElement(tag==='ul'?'ul':tag);
    if(tag==='ul'){const li=document.createElement('li');li.textContent='Elemento';el.appendChild(li);}
    else el.textContent=sel.toString()||'Texto';
    range.deleteContents();range.insertNode(el);
  }
  function insertHighlight(){
    const div=document.createElement('div');div.className='highlight';
    const p=document.createElement('p');p.textContent='Texto destacado...';
    div.appendChild(p);
    const sel=window.getSelection();
    if(sel.rangeCount){const r=sel.getRangeAt(0);r.deleteContents();r.insertNode(div);}
    else document.getElementById('fBody').appendChild(div);
  }
  function previewHero(v){const p=document.getElementById('heroPreview');p.src=v;p.classList.toggle('show',!!v);}

  async function uploadImg(input, targetId, previewId, gallery=false){
    const files=Array.from(input.files);
    for(const file of files){
      const fd=new FormData();fd.append('img',file);
      const r=await fetch('/admin/api/upload',{method:'POST',body:fd});
      const j=await r.json();
      if(j.ok){
        if(gallery){addGalleryRowWithSrc(j.url);}
        else{if(targetId)document.getElementById(targetId).value=j.url;if(previewId){const p=document.getElementById(previewId);p.src=j.url;p.classList.add('show');}}
      }else toast(j.error||'Error al subir','err');
    }
  }

  function addGalleryRow(src='',alt=''){
    const d=document.createElement('div');d.className='gallery-item';
    d.style='display:flex;gap:10px;align-items:center;margin-bottom:10px';
    d.innerHTML='<img style="width:60px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0" />'+
      '<input type="text" value="'+src+'" placeholder="URL imagen" style="flex:1;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:.8rem" onchange="updateGallery()" class="g-src" oninput="this.previousElementSibling.src=this.value" />'+
      '<input type="text" value="'+alt+'" placeholder="Descripción" style="width:200px;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:.8rem" class="g-alt" />'+
      '<button type="button" class="btn btn-danger btn-sm" onclick="this.closest(\'.gallery-item\').remove()">✕</button>';
    document.getElementById('galleryList').appendChild(d);
  }
  function addGalleryRowWithSrc(src){ addGalleryRow(src,''); }
  function updateGallery(){}

  function addRelatedRow(){
    if(document.querySelectorAll('.related-row').length>=3){toast('Máximo 3 relacionadas','err');return;}
    const d=document.createElement('div');d.className='related-row';
    d.style='display:flex;gap:10px;align-items:center;margin-bottom:10px';
    const opts=ALL_NOV.filter(n=>n.slug!==CURRENT_SLUG).map(n=>'<option value="'+(n.href||'novedad-'+n.slug+'.html')+'" data-img="'+n.img+'" data-cat="'+n.cat+'" data-title="'+n.title+'">'+n.title+'</option>').join('');
    d.innerHTML='<select style="flex:1;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:.8rem" class="r-href" onchange="fillRelated(this)"><option value="">— Seleccionar novedad —</option>'+opts+'</select>'+
      '<button type="button" class="btn btn-danger btn-sm" onclick="this.closest(\'.related-row\').remove()">✕</button>';
    document.getElementById('relatedList').appendChild(d);
  }
  function fillRelated(sel){}

  function getGallery(){
    return Array.from(document.querySelectorAll('.gallery-item')).map(d=>({
      src:d.querySelector('.g-src').value,
      alt:d.querySelector('.g-alt').value
    })).filter(g=>g.src);
  }
  function getRelated(){
    return Array.from(document.querySelectorAll('.related-row select')).map(sel=>{
      const opt=sel.options[sel.selectedIndex];
      if(!opt||!opt.value)return null;
      return{href:opt.value,img:opt.dataset.img||'',cat:opt.dataset.cat||'',title:opt.dataset.title||opt.text};
    }).filter(Boolean);
  }

  async function saveNov(publish){
    const title=document.getElementById('fTitle').value.trim();
    if(!title){toast('El título es obligatorio','err');return;}
    const data={
      slug:CURRENT_SLUG,
      title,
      cat:document.getElementById('fCat').value,
      date:document.getElementById('fDate').value.trim(),
      img:document.getElementById('fImg').value.trim(),
      excerpt:document.getElementById('fExcerpt').value.trim(),
      body:document.getElementById('fBody').innerHTML,
      gallery:getGallery(),
      related:getRelated(),
      publish
    };
    const r=await api('/admin/api/novedades',{method:'POST',body:JSON.stringify(data)});
    if(r.ok){toast(publish?'Novedad publicada':'Guardado');setTimeout(()=>location.href='/admin/novedades/'+r.slug+'/editar',900);}
    else toast(r.error||'Error al guardar','err');
  }
  </script>`;
}

// API: save novedad
app.post('/admin/api/novedades', auth, (req, res) => {
  try {
    const { slug: existingSlug, title, cat, date, img, excerpt, body, gallery, related, publish } = req.body;
    if (!title) return res.json({ ok: false, error: 'Título requerido' });

    const novedades = getNovedades();
    const newSlug = existingSlug || slugify(title);
    const href = 'novedad-' + newSlug + '.html';

    const novData = { slug: newSlug, href, title, cat, date, img, excerpt, body, gallery: gallery || [], related: related || [] };

    const idx = novedades.findIndex(n => n.slug === newSlug);
    const listEntry = { slug: newSlug, href, title, cat, date, img, excerpt };

    if (idx >= 0) novedades[idx] = { ...novedades[idx], ...listEntry };
    else novedades.unshift(listEntry);

    saveNovedades(novedades);

    if (publish) {
      fs.writeFileSync(path.join(ROOT, href), generateNovedadHtml(novData));
      regenerateNovedadesGrid(novedades);
    }

    res.json({ ok: true, slug: newSlug });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// API: delete novedad
app.delete('/admin/api/novedades/:slug', auth, (req, res) => {
  try {
    let novedades = getNovedades();
    const nov = novedades.find(n => n.slug === req.params.slug);
    if (!nov) return res.json({ ok: false, error: 'No encontrado' });
    novedades = novedades.filter(n => n.slug !== req.params.slug);
    saveNovedades(novedades);
    const htmlFile = path.join(ROOT, 'novedad-' + req.params.slug + '.html');
    if (fs.existsSync(htmlFile)) fs.unlinkSync(htmlFile);
    regenerateNovedadesGrid(novedades);
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// API: move novedad
app.post('/admin/api/novedades/:slug/move', auth, (req, res) => {
  try {
    const novedades = getNovedades();
    const idx = novedades.findIndex(n => n.slug === req.params.slug);
    if (idx < 0) return res.json({ ok: false, error: 'No encontrado' });
    const dir = req.body.dir;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= novedades.length) return res.json({ ok: false });
    [novedades[idx], novedades[swapIdx]] = [novedades[swapIdx], novedades[idx]];
    saveNovedades(novedades);
    regenerateNovedadesGrid(novedades);
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// API: upload image
app.post('/admin/api/upload', auth, upload.single('img'), (req, res) => {
  if (!req.file) return res.json({ ok: false, error: 'Sin archivo' });
  const url = 'img/novedades/' + req.file.filename;
  res.json({ ok: true, url });
});

// Páginas
app.get('/admin/paginas', auth, (req, res) => {
  const pages = [
    { file: 'index.html', name: 'Inicio' },
    { file: 'nuestra-identidad.html', name: 'Nuestra Identidad' },
    { file: 'nivel-inicial.html', name: 'Nivel Inicial' },
    { file: 'nivel-primario.html', name: 'Nivel Primario' },
    { file: 'nivel-secundario.html', name: 'Nivel Secundario' },
    { file: 'talleres.html', name: 'Talleres' },
    { file: 'contacto.html', name: 'Contacto' },
    { file: 'novedades.html', name: 'Novedades (lista)' },
  ];

  const cards = pages.map(p => `
    <div class="panel" style="margin-bottom:14px">
      <div class="panel__header">
        <h3>${escHtml(p.name)}</h3>
        <div style="display:flex;gap:8px">
          <a href="/${p.file}" target="_blank" class="btn btn-ghost btn-sm">Vista previa →</a>
          <a href="/admin/paginas/${encodeURIComponent(p.file)}" class="btn btn-primary btn-sm">Editar textos</a>
        </div>
      </div>
    </div>`).join('');

  res.send(adminShell('paginas', 'Páginas', `
  <p style="color:#64748b;margin-bottom:20px;font-size:.875rem">Editá los textos principales de cada página. Los cambios se guardan directamente en el archivo HTML.</p>
  ${cards}`));
});

app.get('/admin/paginas/:file', auth, (req, res) => {
  const filename = req.params.file;
  const safeName = path.basename(filename);
  const filePath = path.join(ROOT, safeName);
  if (!fs.existsSync(filePath)) return res.redirect('/admin/paginas');

  const fields = getPageFields(safeName);
  const saved = req.session.pageSaved; delete req.session.pageSaved;

  const fieldsHtml = fields.length ? fields.map(f => `
    <div class="form-group">
      <label>${escHtml(f.label)}</label>
      ${f.val && f.val.length > 80
        ? `<textarea name="${escHtml(f.id)}" rows="3">${escHtml(f.val)}</textarea>`
        : `<input type="text" name="${escHtml(f.id)}" value="${escHtml(f.val||'')}" />`}
    </div>`).join('')
    : '<p style="color:#94a3b8">No se encontraron campos editables automáticamente en esta página. Usá la edición manual.</p>';

  const body = `
  ${saved ? '<div class="alert alert-ok" style="margin-bottom:16px">Cambios guardados correctamente.</div>' : ''}
  <div style="display:flex;gap:12px;margin-bottom:20px;align-items:center">
    <a href="/admin/paginas" class="btn btn-ghost btn-sm">← Volver</a>
    <a href="/${safeName}" target="_blank" class="btn btn-ghost btn-sm">Ver página →</a>
  </div>
  <div class="panel">
    <div class="panel__header"><h3>Campos editables</h3></div>
    <div class="panel__body">
      <form method="post" action="/admin/paginas/${encodeURIComponent(safeName)}">
        ${fieldsHtml}
        ${fields.length ? '<div style="display:flex;justify-content:flex-end;margin-top:8px"><button type="submit" class="btn btn-primary">Guardar cambios</button></div>' : ''}
      </form>
    </div>
  </div>
  <div class="panel" style="margin-top:16px">
    <div class="panel__header"><h3>Edición HTML directa</h3><span class="badge" style="font-size:.7rem;color:#c2410c">Avanzado</span></div>
    <div class="panel__body">
      <form method="post" action="/admin/paginas/${encodeURIComponent(safeName)}/raw">
        <div class="form-group">
          <label>HTML completo de la página</label>
          <textarea name="raw" rows="20" style="font-family:monospace;font-size:.78rem">${escHtml(fs.readFileSync(filePath, 'utf8'))}</textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px">
          <a href="/admin/paginas" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-accent">Guardar HTML completo</button>
        </div>
      </form>
    </div>
  </div>`;

  res.send(adminShell('paginas', 'Editar: ' + safeName, body));
});

app.post('/admin/paginas/:file', auth, (req, res) => {
  const safeName = path.basename(req.params.file);
  const body = req.body;
  let anyUpdated = false;
  for (const [fieldId, value] of Object.entries(body)) {
    if (updatePageField(safeName, fieldId, value)) anyUpdated = true;
  }
  req.session.pageSaved = true;
  res.redirect('/admin/paginas/' + encodeURIComponent(safeName));
});

app.post('/admin/paginas/:file/raw', auth, (req, res) => {
  const safeName = path.basename(req.params.file);
  const filePath = path.join(ROOT, safeName);
  if (!fs.existsSync(filePath)) return res.redirect('/admin/paginas');
  fs.writeFileSync(filePath, req.body.raw);
  req.session.pageSaved = true;
  res.redirect('/admin/paginas/' + encodeURIComponent(safeName));
});

// Historial (git log + rollback)
app.get('/admin/historial', auth, async (req, res) => {
  let commits = [];
  let gitErr = '';
  try {
    const log = await git.log(['--oneline', '-30']);
    commits = log.all;
  } catch (e) { gitErr = e.message; }

  const rows = commits.map(c => `
    <li class="commit-item">
      <span class="commit-hash">${escHtml(c.hash.slice(0,7))}</span>
      <span class="commit-msg">${escHtml(c.message)}</span>
      <span class="commit-date">${escHtml(c.date ? c.date.slice(0,10) : '')}</span>
      <button class="btn btn-ghost btn-sm" onclick="rollback('${escHtml(c.hash.slice(0,7))}','${escHtml(c.message.replace(/'/g,"\\'"))}')">Restaurar</button>
    </li>`).join('');

  const body = `
  <div class="panel">
    <div class="panel__header">
      <h3>Últimas 30 versiones</h3>
      <span class="badge">Git — rama master</span>
    </div>
    <div class="panel__body">
      ${gitErr ? `<div class="alert">${escHtml(gitErr)}</div>` : ''}
      <ul class="commit-list">${rows || '<li style="padding:20px;color:#94a3b8;text-align:center">Sin commits todavía.</li>'}</ul>
    </div>
  </div>
  <script>
  async function rollback(hash, msg) {
    confirm('Restaurar versión', 'Vas a revertir el sitio al commit "' + msg + '" (' + hash + '). Se creará un nuevo commit con ese estado.', async () => {
      const r = await api('/admin/api/rollback', {method:'POST', body: JSON.stringify({hash})});
      if(r.ok){toast('Versión restaurada. Publicá para subir el cambio.');setTimeout(()=>location.reload(),1200);}
      else toast(r.error||'Error al restaurar','err');
    });
  }
  </script>`;

  res.send(adminShell('historial', 'Historial de versiones', body));
});

app.post('/admin/api/rollback', auth, async (req, res) => {
  try {
    const { hash } = req.body;
    if (!hash) return res.json({ ok: false, error: 'Hash requerido' });
    await git.checkout([hash, '--', '.']);
    await git.add('.');
    await git.commit('Restaurar versión ' + hash + ' (admin)');
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// Publicar (commit + push)
app.get('/admin/publicar', auth, async (req, res) => {
  let status = { modified: [], untracked: [] };
  let gitErr = '';
  try {
    const s = await git.status();
    status.modified = [...s.modified, ...s.created, ...s.deleted, ...s.renamed.map(r => r.to)];
    status.untracked = s.not_added;
  } catch (e) { gitErr = e.message; }

  const allChanged = [...new Set([...status.modified, ...status.untracked])];

  const body = `
  <div class="panel" style="margin-bottom:20px">
    <div class="panel__header"><h3>Archivos con cambios</h3></div>
    <div class="panel__body">
      ${gitErr ? `<div class="alert">${escHtml(gitErr)}</div>` : ''}
      ${allChanged.length === 0
        ? '<p style="color:#64748b;text-align:center;padding:24px">No hay cambios pendientes.</p>'
        : `<ul style="list-style:none;font-family:monospace;font-size:.8rem">${allChanged.map(f => `<li style="padding:4px 0;color:#374151">• ${escHtml(f)}</li>`).join('')}</ul>`}
    </div>
  </div>
  <div class="panel">
    <div class="panel__header"><h3>Publicar al sitio</h3></div>
    <div class="panel__body">
      <div class="form-group">
        <label>Descripción de los cambios</label>
        <input type="text" id="commitMsg" placeholder="Ej: Agregar novedad Cambridge, actualizar textos" value="Actualización del sitio" />
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="doCommit(false)">Solo guardar (commit sin push)</button>
        <button class="btn btn-accent" onclick="doCommit(true)">
          <svg viewBox="0 0 24 24"><path d="M5 4v2h14V4H5zm0 10h4v6h6v-6h4l-7-7-7 7z"/></svg>
          Publicar en GitHub
        </button>
      </div>
      <div id="publishLog" style="margin-top:16px;font-family:monospace;font-size:.8rem;background:#0f172a;color:#a3e635;padding:16px;border-radius:8px;min-height:60px;display:none;white-space:pre-wrap"></div>
    </div>
  </div>
  <script>
  async function doCommit(push) {
    const msg = document.getElementById('commitMsg').value.trim();
    if(!msg){toast('Escribí una descripción','err');return;}
    const log = document.getElementById('publishLog');
    log.style.display='block';
    log.textContent='Procesando...';
    const r = await api('/admin/api/publicar',{method:'POST',body:JSON.stringify({msg,push})});
    if(r.ok){log.textContent=r.output||'OK';toast(push?'Publicado en GitHub':'Commit guardado');}
    else{log.textContent=r.error||'Error';toast(r.error||'Error','err');}
  }
  </script>`;

  res.send(adminShell('publicar', 'Publicar cambios', body));
});

app.post('/admin/api/publicar', auth, async (req, res) => {
  try {
    const { msg, push } = req.body;
    if (!msg) return res.json({ ok: false, error: 'Mensaje requerido' });
    let output = '';
    await git.add('.');
    const commit = await git.commit(msg);
    output += 'Commit: ' + (commit.commit || 'ok') + '\n';
    if (push) {
      const pushResult = await git.push('origin', 'master');
      output += 'Push: OK\n';
    }
    res.json({ ok: true, output });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// Serve site files for preview
app.use('/', express.static(ROOT));

app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('  Admin San Carlos — http://localhost:' + PORT + '/admin');
  console.log('  Usuario: admin');
  console.log('  Contraseña: SanCarlos2025!');
  console.log('========================================\n');
});
