(function(){
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');

  // ─── STICKY NAV BACKGROUND ───
  function onScroll(){
    nav.classList.toggle('stuck', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});

  // ─── NAV HEIGHT → --nav-h ───
  // Anchor landings key off the nav's real height rather than a guessed rem, so
  // they stay flush when the nav reflows (font swap, burger row, zoom).
  function syncNavHeight(){
    document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
  }
  syncNavHeight();
  window.addEventListener('resize', syncNavHeight);
  window.addEventListener('orientationchange', function(){ setTimeout(syncNavHeight, 120); });
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(syncNavHeight);

  // ─── IN-PAGE ANCHOR SCROLLING ───
  // offset by the real nav height, and immune to any scroll-container
  // weirdness the browser might apply to native jumps
  document.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if(!a) return;
    var id = a.getAttribute('href');
    if(!id || id === '#') return;
    var target = document.querySelector(id);
    if(!target) return;

    e.preventDefault();

    var offset = id === '#home' ? 0 : nav.offsetHeight;
    var y = target.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
      top: Math.max(0, y),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });

    if(history.replaceState) history.replaceState(null, '', id);

    closeMenu();
  });

  // ─── MOBILE MENU ───
  function closeMenu(){
    links.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
    burger.textContent = 'menu';
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', function(){
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.textContent = open ? 'close' : 'menu';
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // close on Escape, and whenever we grow past the mobile breakpoint
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && links.classList.contains('open')) closeMenu();
  });
  window.addEventListener('resize', function(){
    if(window.innerWidth > 900 && links.classList.contains('open')) closeMenu();
  });

  // ─── SCROLL REVEAL (with fallbacks) ───
  var items = document.querySelectorAll('.reveal');
  function reveal(el){ el.classList.add('in'); }
  function checkReveal(){
    var vh = window.innerHeight;
    items.forEach(function(el){
      if(el.getBoundingClientRect().top < vh - 40) reveal(el);
    });
  }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          reveal(en.target);
          io.unobserve(en.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
    items.forEach(function(el, i){
      el.style.transitionDelay = (Math.min(i,4) * 60) + 'ms';
      io.observe(el);
    });
  } else {
    window.addEventListener('scroll', checkReveal);
  }
  window.addEventListener('scroll', checkReveal);
  setTimeout(checkReveal, 50);
  // Final safety: force-reveal anything still hidden after 2s (CSS @keyframes also covers this)
  setTimeout(function(){ items.forEach(reveal); }, 2000);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- TECH GLOBE (canvas 2D, orthographic) ---------- */
  (function () {
    var canvas = document.getElementById('globe-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    // The full set crowds a phone-sized sphere, so narrow viewports get a
    // trimmed list. Point count is derived from the array, so swapping sets
    // is just a re-run of fibSphere().
    var SKILLS_FULL = [
      'Python', 'TypeScript', 'JavaScript', 'React', 'React Native',
      'Django', 'DRF', 'FastAPI', 'Node.js', 'Expo',
      'PostgreSQL', 'Supabase', 'SQL', 'Docker', 'Git',
      'Figma', 'VS Code', 'Jupyter', 'React Query', 'JWT',
      'REST APIs', 'Auth & AuthZ', 'Schema Design', 'OOP', 'Systems Design',
      'C++', 'Rust', 'HTML/CSS', 'XGBoost', 'Whisper'
    ];
    var SKILLS_SM = [
      'Python', 'TypeScript', 'React', 'React Native', 'Django',
      'DRF', 'FastAPI', 'Node.js', 'PostgreSQL', 'Supabase',
      'Docker', 'Git', 'Figma', 'SQL', 'REST APIs',
      'JWT', 'C++', 'Rust'
    ];
    var skills = SKILLS_FULL, pts = null, baseFont = 10;

    function pickSet(){
      var want = window.innerWidth <= 640 ? SKILLS_SM : SKILLS_FULL;
      baseFont = window.innerWidth <= 640 ? 11 : 10;
      if (skills !== want || !pts) { skills = want; pts = fibSphere(skills.length); }
    }

    var W, H, radius, cx, cy, dpr = 1;
    var measured = false;
    var baseVelY = reduced ? 0 : 0.003;
    var rotX = 0.3, rotY = 0, velX = 0, velY = baseVelY;
    var dragging = false, lastMX = 0, lastMY = 0;
    // fallbacks mirror the dark-theme tokens; readColours() overwrites them
    var accent = '#F0D9E4', accent2 = '#806C79', label = '#F0D9E4';
    var lineCol = 'rgba(193,160,172,0.10)', ringCol = 'rgba(128,108,121,0.05)';

    // Size the bitmap only — CSS owns the layout box, so every coordinate
    // below is a fraction of the canvas's own W/H. A bad read costs one
    // frame of resolution, never geometry.
    function measure() {
      var rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return false;

      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth <= 600 ? 1.5 : 2);
      var bw = Math.round(rect.width * dpr), bh = Math.round(rect.height * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw; canvas.height = bh;
      }
      W = canvas.width; H = canvas.height;
      cx = W / 2; cy = H / 2;
      radius = Math.min(W, H) * 0.38;

      readColours();
      pickSet();
      if (!measured) { measured = true; canvas.classList.add('is-ready'); }
      return true;
    }

    // colours come from the palette tokens rather than being hard-coded here
    function readColours(){
      var cs = getComputedStyle(document.documentElement);
      // --accent-ink, not --accent: canvas labels are text and need the
      // text-safe end of the accent
      accent  = cs.getPropertyValue('--accent-ink').trim()  || accent;
      accent2 = cs.getPropertyValue('--accent-alt').trim()  || accent2;
      label   = cs.getPropertyValue('--text').trim()        || label;
      lineCol = cs.getPropertyValue('--globe-line').trim()  || lineCol;
      ringCol = cs.getPropertyValue('--globe-ring').trim()  || ringCol;
    }

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(measure).observe(canvas.parentElement || canvas);
    }
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', function(){ setTimeout(measure, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();

    function fibSphere(n) {
      var pts = [], g = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < n; i++) {
        var y = 1 - (i / (n - 1)) * 2;
        var r = Math.sqrt(Math.max(0, 1 - y * y));
        var t = g * i;
        pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
      }
      return pts;
    }
    function rotate3D(x, y, z, rx, ry) {
      var y2 = y * Math.cos(rx) - z * Math.sin(rx);
      var z2 = y * Math.sin(rx) + z * Math.cos(rx);
      var x2 = x * Math.cos(ry) + z2 * Math.sin(ry);
      var z3 = -x * Math.sin(ry) + z2 * Math.cos(ry);
      return [x2, y2, z3];
    }

    function draw() {
      if (!measured || !pts) { requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      // sphere outline
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = lineCol;
      ctx.lineWidth = 1;
      ctx.stroke();

      // latitude rings
      for (var lat = -60; lat <= 60; lat += 30) {
        var yN = Math.sin(lat * Math.PI / 180);
        var rLat = Math.cos(lat * Math.PI / 180) * radius;
        var yS = cy + yN * radius;
        if (yS > 0 && yS < H) {
          ctx.beginPath();
          ctx.ellipse(cx, yS, rLat, rLat * 0.25, 0, 0, Math.PI * 2);
          ctx.strokeStyle = ringCol;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // painter's algorithm — back to front
      var rendered = pts.map(function (pt, i) {
        var r = rotate3D(pt[0], pt[1], pt[2], rotX, rotY);
        return { x: r[0], y: r[1], z: r[2], label: skills[i] };
      }).sort(function (a, b) { return a.z - b.z; });

      rendered.forEach(function (p) {
        var sx = cx + p.x * radius;
        var sy = cy - p.y * radius;
        var depth = (p.z + 1) / 2;
        var alpha = 0.15 + depth * 0.85;
        var sz = (0.65 + depth * 0.6) * dpr;
        var isFront = p.z > 0;
        var fontSize = Math.round(baseFont * sz);

        ctx.save();
        ctx.font = (isFront ? 500 : 400) + ' ' + fontSize + "px 'Space Grotesk', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // pink leading dot on the frontmost labels
        if (depth > 0.75) {
          ctx.fillStyle = accent2;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(sx - ctx.measureText(p.label).width / 2 - 8, sy, 2.5 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = (isFront && depth > 0.6) ? accent : label;
        ctx.globalAlpha = alpha * (isFront ? 0.9 : 0.45);
        ctx.fillText(p.label, sx, sy);
        ctx.restore();
      });

      if (!dragging) {
        rotY += velY;
        rotX += velX;
        velX *= 0.98;
      }
      requestAnimationFrame(draw);
    }
    draw();

    // mouse drag — bound to window so a drag survives leaving the canvas
    canvas.addEventListener('mousedown', function (e) {
      dragging = true; lastMX = e.clientX; lastMY = e.clientY;
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      rotY += (e.clientX - lastMX) * 0.008;
      rotX += (e.clientY - lastMY) * 0.008;
      lastMX = e.clientX; lastMY = e.clientY;
    });
    window.addEventListener('mouseup', function () { dragging = false; });

    // touch drag with an axis lock, so vertical swipes still scroll the page
    var axis = null, startX = 0, startY = 0;
    canvas.addEventListener('touchstart', function (e) {
      dragging = true; axis = null;
      startX = lastMX = e.touches[0].clientX;
      startY = lastMY = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      var t = e.touches[0];
      if (axis === null) {
        var dx = Math.abs(t.clientX - startX), dy = Math.abs(t.clientY - startY);
        if (dx < 6 && dy < 6) return;
        axis = dx > dy ? 'x' : 'y';
        if (axis === 'y') { dragging = false; return; } // let the page scroll
      }
      e.preventDefault();
      rotY += (t.clientX - lastMX) * 0.01;
      rotX += (t.clientY - lastMY) * 0.01;
      lastMX = t.clientX; lastMY = t.clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', function () { dragging = false; axis = null; });

    // cursor proximity nudges spin speed
    document.addEventListener('mousemove', function (e) {
      if (dragging || reduced) return;
      var rect = canvas.getBoundingClientRect();
      var dx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      var dy = (e.clientY - rect.top - rect.height / 2) / rect.height;
      if (Math.sqrt(dx * dx + dy * dy) < 1.5) {
        velY = baseVelY + dx * 0.004;
        velX = dy * 0.003;
      }
    });
  })();

  /* ---------- PROJECT HOVER PREVIEW ---------- */
  (function(){
    var box = document.getElementById('preview');
    var img = document.getElementById('phImg');
    var label = document.getElementById('phLabel');
    if(!box) return;
    if(window.matchMedia('(hover: none)').matches) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, active = false, raf = null;

    function loop(){
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      box.style.left = cx + 'px';
      box.style.top  = cy + 'px';
      raf = requestAnimationFrame(loop);
    }

    document.querySelectorAll('.proj').forEach(function(card){
      card.addEventListener('mouseenter', function(e){
        label.textContent = card.dataset.label || '';
        img.removeAttribute('src');
        img.style.display = 'none';
        var src = card.dataset.img;
        if(src){
          img.onload  = function(){ img.style.display = 'block'; };
          img.onerror = function(){ img.style.display = 'none'; };
          img.src = src;
        }
        tx = cx = e.clientX; ty = cy = e.clientY;
        box.classList.add('on');
        active = true;
        if(!raf) loop();
      });
      card.addEventListener('mousemove', function(e){
        tx = e.clientX; ty = e.clientY;
      });
      card.addEventListener('mouseleave', function(){
        box.classList.remove('on');
        active = false;
        setTimeout(function(){
          if(!active && raf){ cancelAnimationFrame(raf); raf = null; }
        }, 320);
      });
    });
  })();

  // ─── ACTIVE NAV LINK ───
  var sections = ['about','skills','projects','experience','contact']
    .map(function(id){ return document.getElementById(id); })
    .filter(Boolean);
  var navAnchors = links.querySelectorAll('a');

  if('IntersectionObserver' in window){
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          navAnchors.forEach(function(a){
            a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
          });
        }
      });
    }, {rootMargin:'-30% 0px -55% 0px', threshold:0});
    sections.forEach(function(s){ spy.observe(s); });
  }
})();

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
