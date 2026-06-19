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

// Botón admin (solo visible en localhost)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  const btn = document.createElement('a');
  btn.href = 'http://localhost:3001/admin';
  btn.target = '_blank';
  btn.title = 'Panel de administración';
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg> Admin';
  btn.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9999;background:rgba(0,51,82,.85);color:#fff;font-family:sans-serif;font-size:11px;font-weight:600;padding:6px 12px;border-radius:20px;text-decoration:none;display:flex;align-items:center;gap:5px;backdrop-filter:blur(4px);box-shadow:0 2px 10px rgba(0,0,0,.2);letter-spacing:.3px';
  btn.onmouseenter = () => btn.style.background = 'rgba(0,51,82,1)';
  btn.onmouseleave = () => btn.style.background = 'rgba(0,51,82,.85)';
  document.body.appendChild(btn);
}

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
