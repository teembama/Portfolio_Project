// ─── THEME: system preference + localStorage override ───
const root = document.documentElement;
const mql = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) { root.setAttribute('data-theme', theme); }

const stored = localStorage.getItem('theme');
applyTheme(stored || (mql.matches ? 'dark' : 'light'));

mql.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
});

function toggleTheme() {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
}

const themeToggle    = document.getElementById('themeToggle');
const themeToggleMob = document.getElementById('themeToggleMob');
if (themeToggle)    themeToggle.addEventListener('click', toggleTheme);
if (themeToggleMob) themeToggleMob.addEventListener('click', toggleTheme);

// ─── HAMBURGER → DROPDOWN ───
const hamburger = document.getElementById('hamburger');
const dropdown  = document.getElementById('mobileDropdown');
if (hamburger && dropdown) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    dropdown.classList.toggle('open');
  });
  document.querySelectorAll('.mob-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      dropdown.classList.remove('open');
    });
  });
}

// ─── FOLDER PROJECT SYSTEM ───
const tabs   = document.querySelectorAll('.folder-tab');
const cards  = document.querySelectorAll('.project-card-overlay');
const body   = document.getElementById('folderBody');
const empty  = document.getElementById('folderEmpty');
let activeCard = null;

function openProject(index) {
  closeProject();
  tabs.forEach(t => t.classList.remove('active'));
  tabs[index].classList.add('active');
  if (empty) empty.style.display = 'none';
  if (body)  body.style.minHeight = '420px';
  const card = document.querySelector(`[data-card="${index}"]`);
  requestAnimationFrame(() => {
    card.classList.add('open');
    activeCard = card;
  });
}
function closeProject() {
  if (activeCard) { activeCard.classList.remove('open'); activeCard = null; }
  tabs.forEach(t => t.classList.remove('active'));
  if (empty) empty.style.display = 'block';
  if (body)  body.style.minHeight = '120px';
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => {
    if (tab.classList.contains('active')) closeProject();
    else openProject(i);
  });
});
document.querySelectorAll('.pc-close').forEach(btn => {
  btn.addEventListener('click', (e) => { e.stopPropagation(); closeProject(); });
});

// ─── BUBBLE CURSOR TRAIL ───
let lastBubble = 0;
const BUBBLE_INTERVAL = 60;
const bubbleColors = () => {
  const isDark = root.getAttribute('data-theme') === 'dark';
  return isDark
    ? ['#c4929e','#8ba06e','#B09C8F','#917266','#c4929e']
    : ['#5D4459','#586144','#917266','#9D6A83','#716361'];
};
document.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastBubble < BUBBLE_INTERVAL) return;
  lastBubble = now;
  const b = document.createElement('div');
  b.className = 'bubble';
  const size = Math.random() * 18 + 6;
  const c = bubbleColors();
  const col = c[Math.floor(Math.random() * c.length)];
  Object.assign(b.style, {
    width: size + 'px', height: size + 'px',
    left:  (e.clientX - size/2) + 'px',
    top:   (e.clientY - size/2) + 'px',
    background: col,
    boxShadow: `0 0 ${size}px ${col}`,
  });
  document.body.appendChild(b);
  b.addEventListener('animationend', () => b.remove());
});

// ─── SCROLL REVEAL (with fallbacks) ───
const rvEls = document.querySelectorAll('.rv');
function reveal(el) { el.classList.add('vis'); }
function checkRv() {
  const vh = window.innerHeight;
  rvEls.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < vh - 40) reveal(el);
  });
}
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) reveal(en.target); });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  rvEls.forEach(el => obs.observe(el));
} else {
  window.addEventListener('scroll', checkRv);
}
window.addEventListener('scroll', checkRv);
setTimeout(checkRv, 50);
// Final safety: force-reveal anything still hidden after 2s (CSS @keyframes also covers this)
setTimeout(() => rvEls.forEach(reveal), 2000);

// ─── SMOOTH SCROLL (internal anchors only) ───
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const t = document.querySelector(href);
    if (t) {
      e.preventDefault();
      t.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  });
});

// ─── NAV AUTO-HIDE ───
let lastY = 0;
const navEl = document.querySelector('nav');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (navEl && (!dropdown || !dropdown.classList.contains('open'))) {
    navEl.style.transform = (y > lastY && y > 100) ? 'translateY(-100%)' : 'translateY(0)';
  }
  lastY = y;
});

// ─── EMAIL MODAL + FORMSPREE FETCH ───
const emailModal   = document.getElementById('emailModal');
const openModalBtn = document.getElementById('openEmailModal');
const closeModalBtn= document.getElementById('closeModal');
const cancelBtn    = document.getElementById('cancelBtn');
const modalOverlay = emailModal && emailModal.querySelector('.modal-overlay');
const contactForm  = document.getElementById('contactForm');
const sendBtn      = document.getElementById('sendBtn');
const formView     = document.getElementById('formView');
const successView  = document.getElementById('successView');
const errorView    = document.getElementById('errorView');
const successDismiss = document.getElementById('successDismiss');
const errorDismiss   = document.getElementById('errorDismiss');

function showView(which) {
  if (!formView) return;
  formView.style.display    = which === 'form'    ? 'block' : 'none';
  successView.style.display = which === 'success' ? 'block' : 'none';
  errorView.style.display   = which === 'error'   ? 'block' : 'none';
}
function openModal() {
  if (!emailModal) return;
  emailModal.classList.add('active');
  emailModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  showView('form');
}
function closeModal() {
  if (!emailModal) return;
  emailModal.classList.remove('active');
  emailModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (contactForm) contactForm.reset();
  if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send Message'; }
  showView('form');
}
if (openModalBtn) openModalBtn.addEventListener('click', openModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
if (successDismiss) successDismiss.addEventListener('click', closeModal);
if (errorDismiss) errorDismiss.addEventListener('click', () => showView('form'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && emailModal && emailModal.classList.contains('active')) closeModal();
});

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sendBtn.disabled) return;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';
    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) showView('success');
      else showView('error');
    } catch (err) {
      showView('error');
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Message';
    }
  });
}
