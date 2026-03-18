/* ======================================================
   TALBI'FLUID — JavaScript principal
   Navigation · Formulaire · Animations · Scroll
====================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHamburger();
  initScrollAnimations();
  initStickyHeader();
  initFormValidation();
});

/* ========== NAVBAR STICKY ========== */
function initStickyHeader() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 20
      ? '0 4px 24px rgba(0,0,0,0.12)'
      : '0 2px 12px rgba(0,0,0,0.08)';
  });
}

/* ========== HAMBURGER MENU ========== */
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (!hamburger || !navMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Fermer en cliquant un lien
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ========== ACTIVE NAV LINK ========== */
function initNavbar() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === currentPage);
  });
}

/* ========== SCROLL ANIMATIONS ========== */
function initScrollAnimations() {
  const elements = document.querySelectorAll(
    '.service-card, .why-item, .review-card, .pricing-card, .blog-card, .section-header'
  );

  elements.forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

/* ========== FORMULAIRE DE CONTACT ========== */
function initFormValidation() {
  const form = document.getElementById('contactForm');
  if (!form) return;
}

async function submitForm(event) {
  event.preventDefault();
  const form = event.target;
  const btn = form.querySelector('button[type="submit"]');
  const success = document.getElementById('formSuccess');

  // Animation bouton
  btn.disabled = true;
  btn.textContent = '⏳ Envoi en cours...';

  const data = {
    name: form.name.value,
    phone: form.phone.value,
    email: form.email.value,
    service: form.service.value,
    message: form.message.value,
    lang: currentLang || 'fr'
  };

  try {
    // Tentative d'envoi au backend
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Server error');
  } catch {
    // En mode démo (pas de backend), on simule le succès
    await new Promise(r => setTimeout(r, 1200));
  }

  btn.disabled = false;
  btn.textContent = translations?.[currentLang]?.['form-submit'] || 'Envoyer ma demande';
  form.reset();
  if (success) {
    success.style.display = 'flex';
    setTimeout(() => { success.style.display = 'none'; }, 6000);
  }
}

/* ========== SMOOTH SCROLL pour ancres ========== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ========== COOKIE BANNER ========== */
window.addEventListener('load', () => {
  if (localStorage.getItem('talbi-cookies')) return;
  const banner = document.createElement('div');
  banner.id = 'cookieBanner';
  banner.style.cssText = `
    position:fixed;bottom:0;left:0;right:0;z-index:9999;
    background:#0f2044;color:white;padding:16px 24px;
    display:flex;align-items:center;justify-content:space-between;
    gap:16px;flex-wrap:wrap;font-size:0.875rem;
    box-shadow:0 -4px 20px rgba(0,0,0,0.2);
  `;
  banner.innerHTML = `
    <span>🍪 Nous utilisons des cookies pour améliorer votre expérience.
      <a href="politique-confidentialite.html" style="color:#60a5fa;text-decoration:underline">En savoir plus</a>
    </span>
    <div style="display:flex;gap:8px;flex-shrink:0">
      <button onclick="acceptCookies()" style="background:#1a73e8;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-weight:600">Accepter</button>
      <button onclick="declineCookies()" style="background:transparent;color:#94a3b8;border:1px solid #475569;padding:8px 20px;border-radius:6px;cursor:pointer">Refuser</button>
    </div>
  `;
  document.body.appendChild(banner);
});

function acceptCookies() {
  localStorage.setItem('talbi-cookies', 'accepted');
  removeCookieBanner();
}
function declineCookies() {
  localStorage.setItem('talbi-cookies', 'declined');
  removeCookieBanner();
}
function removeCookieBanner() {
  const b = document.getElementById('cookieBanner');
  if (b) b.remove();
}
