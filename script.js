// Mobile menu
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const navClose = document.getElementById('navClose');

burger.addEventListener('click', () => nav.classList.add('open'));
navClose.addEventListener('click', () => nav.classList.remove('open'));

// Close nav on link click (mobile)
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

// Dropdown toggle on mobile (tap)
document.querySelectorAll('.has-dropdown > .nav__link').forEach(link => {
  link.addEventListener('click', e => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      link.closest('.has-dropdown').classList.toggle('open');
    }
  });
});

// Hero slider
const slides = document.querySelectorAll('.hero__slide');
const dots = document.querySelectorAll('.dot');
let current = 0;
let sliderTimer;

function goToSlide(index) {
  slides[current].classList.remove('active');
  dots[current].classList.remove('active');
  current = (index + slides.length) % slides.length;
  slides[current].classList.add('active');
  dots[current].classList.add('active');
}

function startSlider() {
  sliderTimer = setInterval(() => goToSlide(current + 1), 5000);
}

dots.forEach(dot => {
  dot.addEventListener('click', () => {
    clearInterval(sliderTimer);
    goToSlide(parseInt(dot.dataset.index));
    startSlider();
  });
});

startSlider();

// Sticky header shadow
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.style.boxShadow = window.scrollY > 10
    ? '0 4px 24px rgba(0,0,0,.12)'
    : '0 2px 16px rgba(0,0,0,.08)';
});

// Scroll animations
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.nivel-card, .proyecto-card, .taller-card, .novedad-card, .stat, .info-item'
).forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

document.querySelectorAll('.slide-left, .slide-right, .slide-up').forEach(el => {
  observer.observe(el);
});

// Login Admin al pie de página
(function(){
  const bar = document.createElement('div');
  bar.id = 'admin-bar';
  bar.style.cssText = 'background:#0f172a;padding:18px 0;text-align:center';
  bar.innerHTML = `
    <form id="admin-login-form" style="display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center">
      <span style="color:#64748b;font-family:sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase">Administración</span>
      <input id="al-user" type="text" placeholder="Usuario" autocomplete="username"
        style="padding:6px 10px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:12px;width:110px;outline:none">
      <input id="al-pass" type="password" placeholder="Contraseña" autocomplete="current-password"
        style="padding:6px 10px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:12px;width:130px;outline:none">
      <button type="submit"
        style="padding:6px 14px;background:#003352;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">
        Entrar
      </button>
      <span id="al-err" style="color:#f87171;font-size:11px;display:none">Usuario o contraseña incorrectos</span>
    </form>`;
  document.body.appendChild(bar);

  document.getElementById('admin-login-form').addEventListener('submit', async function(e){
    e.preventDefault();
    const user = document.getElementById('al-user').value.trim();
    const pass = document.getElementById('al-pass').value;
    const hash = Array.from(new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pass))
    )).map(b=>b.toString(16).padStart(2,'0')).join('');
    if(user === 'admin' && hash === '3d1a38c82efb47f0a567acc4840f281f9d72f02f0e7d995b6cd7b47f1c48f4e1'){
      sessionStorage.setItem('sc_admin','1');
      window.location.href = 'admin.html';
    } else {
      document.getElementById('al-err').style.display = 'inline';
      setTimeout(()=>document.getElementById('al-err').style.display='none', 2500);
    }
  });
})();

// Smooth active nav link on scroll
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = document.querySelector(`.nav__link[href="#${id}"]`);
    if (link) {
      link.classList.toggle('active', scrollY >= top && scrollY < top + height);
    }
  });
}, { passive: true });
