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

// Botón Admin flotante con modal de login
(function(){
  const css = `
    #sc-admin-btn{position:fixed;bottom:22px;right:22px;z-index:9000;background:#003352;color:#fff;border:none;border-radius:50px;padding:10px 18px;font-family:sans-serif;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.22);display:flex;align-items:center;gap:7px;transition:background .2s,transform .15s}
    #sc-admin-btn:hover{background:#004d78;transform:translateY(-2px)}
    #sc-admin-btn svg{width:15px;height:15px;fill:#fff;flex-shrink:0}
    #sc-admin-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9001;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s;backdrop-filter:blur(2px)}
    #sc-admin-overlay.open{opacity:1;pointer-events:all}
    #sc-admin-modal{background:#fff;border-radius:18px;padding:36px 32px;width:100%;max-width:360px;box-shadow:0 24px 64px rgba(0,0,0,.22);transform:translateY(20px);transition:transform .2s}
    #sc-admin-overlay.open #sc-admin-modal{transform:translateY(0)}
    #sc-admin-modal img{height:44px;display:block;margin:0 auto 20px}
    #sc-admin-modal h2{font-family:sans-serif;font-size:1.1rem;font-weight:700;color:#003352;text-align:center;margin-bottom:4px}
    #sc-admin-modal p{font-family:sans-serif;font-size:.8rem;color:#64748b;text-align:center;margin-bottom:24px}
    .sc-field{margin-bottom:14px}
    .sc-field label{display:block;font-family:sans-serif;font-size:.72rem;font-weight:600;color:#374151;margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px}
    .sc-field input{width:100%;padding:11px 13px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:.9rem;font-family:sans-serif;outline:none;box-sizing:border-box;transition:border-color .2s}
    .sc-field input:focus{border-color:#003352}
    #sc-admin-submit{width:100%;padding:12px;background:#003352;color:#fff;border:none;border-radius:9px;font-size:.9rem;font-weight:600;cursor:pointer;font-family:sans-serif;margin-top:4px;transition:background .2s}
    #sc-admin-submit:hover{background:#004d78}
    #sc-admin-submit:disabled{background:#94a3b8;cursor:not-allowed}
    #sc-admin-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:9px 13px;border-radius:8px;font-size:.8rem;font-family:sans-serif;margin-bottom:12px;display:none;text-align:center}
    #sc-admin-close{position:absolute;top:14px;right:16px;background:none;border:none;font-size:20px;color:#94a3b8;cursor:pointer;line-height:1}
    #sc-admin-modal{position:relative}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Botón
  const btn = document.createElement('button');
  btn.id = 'sc-admin-btn';
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg> Admin';
  document.body.appendChild(btn);

  // Modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'sc-admin-overlay';
  overlay.innerHTML = `
    <div id="sc-admin-modal">
      <button id="sc-admin-close" onclick="document.getElementById('sc-admin-overlay').classList.remove('open')" aria-label="Cerrar">✕</button>
      <img src="https://sancarlos.edu.ar/wpcsc/wp-content/uploads/2016/06/plantilla-logo-home-SC.png" alt="San Carlos" />
      <h2>Panel de Administración</h2>
      <p>Ingresá tus datos para continuar</p>
      <div id="sc-admin-err">Usuario o contraseña incorrectos</div>
      <form id="sc-admin-form" autocomplete="on">
        <div class="sc-field"><label>Usuario</label><input id="sc-user" type="text" autocomplete="username" placeholder="admin" required /></div>
        <div class="sc-field"><label>Contraseña</label><input id="sc-pass" type="password" autocomplete="current-password" placeholder="••••••••••••" required /></div>
        <button type="submit" id="sc-admin-submit">Ingresar</button>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  btn.addEventListener('click', () => {
    overlay.classList.add('open');
    document.getElementById('sc-user').focus();
  });
  overlay.addEventListener('click', e => {
    if(e.target === overlay) overlay.classList.remove('open');
  });

  document.getElementById('sc-admin-form').addEventListener('submit', async function(e){
    e.preventDefault();
    const submitBtn = document.getElementById('sc-admin-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verificando...';
    const user = document.getElementById('sc-user').value.trim();
    const pass = document.getElementById('sc-pass').value;
    const hash = Array.from(new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pass))
    )).map(b => b.toString(16).padStart(2,'0')).join('');
    if(user === 'admin' && hash === '3d1a38c82efb47f0a567acc4840f281f9d72f02f0e7d995b6cd7b47f1c48f4e1'){
      sessionStorage.setItem('sc_admin','1');
      window.location.href = 'admin.html';
    } else {
      document.getElementById('sc-admin-err').style.display = 'block';
      setTimeout(() => document.getElementById('sc-admin-err').style.display = 'none', 3000);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ingresar';
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
