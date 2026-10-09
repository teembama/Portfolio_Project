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

    // Land the section's label 32px under the nav, not the section box. The box
    // carries --sect of top padding, so aiming at it leaves that whole band
    // exposed; aiming at the label lets the nav overlap the excess instead.
    // #home has no .eyebrow, so it falls back to the header and offset 0.
    var label = target.querySelector('.eyebrow');
    var anchorEl = label || target;
    var offset = (id === '#home') ? 0 : nav.offsetHeight + 32;
    var y = anchorEl.getBoundingClientRect().top + window.pageYOffset - offset;

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
  // Elements that enter view together are staggered 70ms apart (up to 4 steps),
  // so a batch of cards doesn't fire at once. The delay is cleared once the
  // reveal is done, so it never lags a later hover.
  var items = document.querySelectorAll('.reveal');
  function reveal(el){ el.classList.add('in'); }
  function revealAll(){ items.forEach(reveal); }
  function checkReveal(){
    var vh = window.innerHeight;
    items.forEach(function(el){
      if(el.getBoundingClientRect().top < vh - 40) reveal(el);
    });
  }
  var observing = false;
  if('IntersectionObserver' in window){
    try {
      var io = new IntersectionObserver(function(entries){
        var k = 0;
        entries.forEach(function(en){
          if(!en.isIntersecting) return;
          var el = en.target, delay = Math.min(k++, 4) * 70;
          el.style.transitionDelay = delay + 'ms';
          reveal(el);
          setTimeout(function(){ el.style.transitionDelay = ''; }, delay + 450);
          io.unobserve(el);
        });
      }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
      items.forEach(function(el){ io.observe(el); });
      observing = true;
    } catch(e){}
  }
  if(!observing){
    window.addEventListener('scroll', checkReveal, {passive:true});
    setTimeout(checkReveal, 50);
    // Final safety: force-reveal anything still hidden after 2s (CSS @keyframes
    // covers the no-JS case the same way)
    setTimeout(revealAll, 2000);
  }

  // ─── INTRO: hero settle, once per session ───
  // The inline script in <head> sets html.intro. Any click, key, wheel, touch
  // or scroll ends it at once; otherwise it is cleared after 1.2s.
  var root = document.documentElement;
  if(root.classList.contains('intro')){
    try { sessionStorage.setItem('introSeen', '1'); } catch(e){}
    var skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
    var endIntro = function(){
      root.classList.remove('intro');
      skipEvents.forEach(function(t){ window.removeEventListener(t, endIntro, true); });
    };
    skipEvents.forEach(function(t){ window.addEventListener(t, endIntro, {capture:true, passive:true}); });
    setTimeout(endIntro, 1200);
  }

  // ─── PIPELINE: stages light up in sequence ───
  // Lit is the CSS default. Only with the observer and full motion is the strip
  // armed (unlit) and then run once when most of it is in view.
  var pipe = document.querySelector('.pipe');
  if(pipe && 'IntersectionObserver' in window &&
     !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    try {
      var pio = new IntersectionObserver(function(entries){
        if(!entries[0].isIntersecting) return;
        pipe.classList.add('run');
        pio.disconnect();
      }, {threshold:0.6});
      pipe.classList.add('armed');
      pio.observe(pipe);
    } catch(e){ pipe.classList.remove('armed'); }
  }

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
      'Claude', 'Agent SDK', 'MCP', 'n8n', 'Python',
      'TypeScript', 'JavaScript', 'Node.js', 'React', 'React Native',
      'Next.js', 'Expo', 'Django', 'DRF', 'FastAPI',
      'Streamlit', 'Supabase', 'PostgreSQL', 'SQL', 'Docker',
      'Git', 'Vercel', 'Railway', 'Firecrawl', 'Apify',
      'Vapi', 'Zod', 'Tailwind', 'React Query', 'REST APIs',
      'JWT', 'XGBoost', 'Whisper', 'Figma'
    ];
    var SKILLS_SM = [
      'Claude', 'Agent SDK', 'MCP', 'n8n', 'Python',
      'TypeScript', 'React Native', 'Next.js', 'Django', 'FastAPI',
      'Supabase', 'PostgreSQL', 'Docker', 'Git', 'Vercel',
      'Firecrawl', 'Vapi', 'REST APIs'
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

    // The loop only runs while the canvas is on screen: off-screen it used to
    // redraw at 60fps for nothing. The observer restarts it on the way back.
    var raf = null, onScreen = true;
    function draw() {
      raf = null;
      if (!onScreen) return;
      if (!measured || !pts) { raf = requestAnimationFrame(draw); return; }
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
      raf = requestAnimationFrame(draw);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen && !raf) raf = requestAnimationFrame(draw);
      }).observe(canvas);
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
    var tags = document.getElementById('phTags');
    if(!box) return;
    if(window.matchMedia('(hover: none)').matches) return;
    // The preview stands in for the in-card media only where CSS hides that
    // (a fine pointer that can hover, above 900px). Checked on every hover so
    // a resize across 900px is honoured.
    var previewMQ = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');

    var tx = 0, ty = 0, cx = 0, cy = 0, active = false, raf = null;

    // The preview shows everywhere on a card except while the pointer is over
    // its Demo / GitHub / Details row. There it hides at once (no fade), so it
    // never covers the button being aimed at, and stays where it is so it
    // can't drift. It returns only once the pointer is SHOW_PAD clear of the
    // row and has stayed clear for SHOW_DELAY, so crossing the row's edge, or
    // leaving a button diagonally, can't make it flicker.
    var SHOW_PAD = 8, SHOW_DELAY = 150;
    // While the page scrolls, the row travels under a still pointer, so the
    // hide distance grows by LAG_FRAMES frames at the current scroll speed.
    var LAG_FRAMES = 2, scrollVel = 0, lastScrollY = window.pageYOffset;
    var rows = document.querySelectorAll('.proj-links');
    var nearRow = false, clearSince = 0;

    function pointerOverRow(x, y, pad){
      for(var i = 0; i < rows.length; i++){
        var r = rows[i].getBoundingClientRect();
        if(!r.width) continue;                         // in a card the filters have hidden
        if(x > r.left - pad && x < r.right + pad &&
           y > r.top - pad && y < r.bottom + pad) return true;
      }
      return false;
    }
    function updateNearRow(){
      var y = window.pageYOffset;
      scrollVel = Math.max(Math.abs(y - lastScrollY), scrollVel * 0.85);
      lastScrollY = y;
      if(pointerOverRow(tx, ty, scrollVel * LAG_FRAMES)){ nearRow = true; clearSince = 0; return; }
      if(!nearRow) return;
      if(pointerOverRow(tx, ty, SHOW_PAD)){ clearSince = 0; return; }
      var now = performance.now();
      if(!clearSince) clearSince = now;
      else if(now - clearSince >= SHOW_DELAY){
        nearRow = false;
        cx = tx; cy = ty;                              // re-enter at the pointer, as on card entry
      }
    }

    function loop(){
      if(active) updateNearRow();
      if(!nearRow){
        cx += (tx - cx) * 0.16;
        cy += (ty - cy) * 0.16;
        box.style.left = cx + 'px';
        box.style.top  = cy + 'px';
      }
      box.classList.toggle('on', active && !nearRow);
      // Over a row the preview would sit on the buttons, so it skips the fade.
      box.style.visibility = nearRow ? 'hidden' : '';
      raf = requestAnimationFrame(loop);
    }

    // Each card's .proj-media is the single source: its data-title and
    // data-tags fill the placeholder, and once it is an <img> its src fills
    // the preview image.
    document.querySelectorAll('.proj').forEach(function(card){
      card.addEventListener('mouseenter', function(e){
        var media = card.querySelector('.proj-media');   // looked up per hover, so a swapped-in <img> is picked up
        if(!media || !previewMQ.matches) return;
        label.textContent = media.dataset.title || '';
        if(tags) tags.textContent = media.dataset.tags || '';
        img.removeAttribute('src');
        img.style.display = 'none';
        box.classList.remove('has-img');
        var src = media.tagName === 'IMG' ? (media.currentSrc || media.src) : '';
        if(src){
          img.onload  = function(){ img.style.display = 'block'; box.classList.add('has-img'); };
          img.onerror = function(){ img.style.display = 'none'; box.classList.remove('has-img'); };
          img.src = src;
        }
        tx = cx = e.clientX; ty = cy = e.clientY;
        box.style.left = cx + 'px';
        box.style.top  = cy + 'px';
        nearRow = false; clearSince = 0;
        lastScrollY = window.pageYOffset; scrollVel = 0;
        updateNearRow();                               // entering right by the buttons: stay hidden
        active = true;
        box.classList.toggle('on', !nearRow);
        if(!raf) loop();
      });
      card.addEventListener('mousemove', function(e){
        tx = e.clientX; ty = e.clientY;
      });
      // Clicking a card while the preview shows opens the larger view of its
      // image, since the click lands on the image the pointer is carrying.
      // Links, buttons and text selections are left alone.
      card.addEventListener('click', function(e){
        var media = card.querySelector('.proj-media');
        if(!media || !window.openZoom || !previewMQ.matches || nearRow) return;
        if(e.target.closest('a, button')) return;
        var sel = window.getSelection && window.getSelection();
        if(sel && String(sel).trim()) return;
        window.openZoom(media);
      });
      card.addEventListener('mouseleave', function(){
        box.classList.remove('on');
        active = false;                                // nearRow stays as is, so a fading preview by the buttons doesn't start moving
        setTimeout(function(){
          if(!active && raf){ cancelAnimationFrame(raf); raf = null; }
        }, 320);
      });
    });

    // Warm the preview images once the page has finished loading, so the fetch
    // lands in idle time rather than on first hover, where it showed the
    // gradient placeholder until the image arrived. Detached Image objects
    // only: nothing enters the DOM and no markup changes.
    //
    // Deliberately not <link rel="preload" as="image">, which would raise these
    // to high priority and make them compete with render-critical work for what
    // is an optional hover effect. Background warming is the right priority.
    //
    // This sits inside the preview IIFE on purpose, so the (hover: none) bail
    // above covers it too and a touch device never spends data on images it
    // cannot trigger.
    function prewarm(){
      try{
        document.querySelectorAll('.proj img.proj-media').forEach(function(media){
          var src = media.currentSrc || media.src;
          if(!src) return;
          var warm = new Image();
          warm.onerror = function(){};   // a failed warm is silent; hover retries
          warm.src = src;
        });
      }catch(e){ /* never let an optional optimisation surface an error */ }
    }
    function schedulePrewarm(){
      if(typeof window.requestIdleCallback === 'function'){
        window.requestIdleCallback(prewarm, {timeout:3000});
      } else {
        setTimeout(prewarm, 1500);   // Safari has no requestIdleCallback
      }
    }
    if(document.readyState === 'complete') schedulePrewarm();
    else window.addEventListener('load', schedulePrewarm);
  })();

  // ─── THERESE.TS LIVE TERMINAL (terminal.js, frames in terminal-frames.js) ───
  if(window.ThereseTerminal) window.ThereseTerminal.init(document.querySelector('.code-card'));

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

// ─── DIALOGS ───
// Shared by every .modal: the page behind goes inert, Esc and the overlay
// close it, Tab wraps at its edges, and focus returns to whatever opened it.
// Callers move focus into the dialog themselves after openDialog().
const shell = document.querySelector('.shell');
let openState = null;

function openDialog(modal, onClose) {
  if (!modal || openState) return;
  openState = { modal: modal, onClose: onClose, lastFocus: document.activeElement };
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  // The page behind the scrim can't take focus or clicks while a dialog is open.
  if (shell) shell.inert = true;
}
function closeDialog() {
  if (!openState) return;
  const { modal, onClose, lastFocus } = openState;
  openState = null;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (shell) shell.inert = false;
  if (onClose) onClose();
  // Back to whatever opened it, so keyboard users keep their place.
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
document.addEventListener('click', (e) => {
  if (openState && e.target.classList && e.target.classList.contains('modal-overlay')) closeDialog();
});
document.addEventListener('keydown', (e) => {
  if (!openState) return;
  if (e.key === 'Escape') { closeDialog(); return; }
  if (e.key !== 'Tab') return;
  // inert keeps focus off the page; this wraps it at the dialog's edges
  // rather than letting it leave for the browser UI.
  const items = Array.from(openState.modal.querySelectorAll('button, input, textarea, a[href]'))
    .filter((el) => !el.disabled && el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

// ─── EMAIL MODAL + FORMSPREE FETCH ───
const emailModal   = document.getElementById('emailModal');
const openModalBtn = document.getElementById('openEmailModal');
const closeModalBtn= document.getElementById('closeModal');
const cancelBtn    = document.getElementById('cancelBtn');
const contactForm  = document.getElementById('contactForm');
const sendBtn      = document.getElementById('sendBtn');
const formView     = document.getElementById('formView');
const successView  = document.getElementById('successView');
const errorView    = document.getElementById('errorView');
const successDismiss = document.getElementById('successDismiss');
const errorDismiss   = document.getElementById('errorDismiss');

// Where focus lands when each view appears. The form's buttons vanish with the
// form, so without a target focus drops to <body> on success or error.
const viewFocus = { form: 'name', success: 'successDismiss', error: 'errorDismiss' };

function showView(which, moveFocus) {
  if (!formView) return;
  formView.style.display    = which === 'form'    ? 'block' : 'none';
  successView.style.display = which === 'success' ? 'block' : 'none';
  errorView.style.display   = which === 'error'   ? 'block' : 'none';
  if (moveFocus) {
    const target = document.getElementById(viewFocus[which]);
    if (target) target.focus();
  }
}
function resetEmailModal() {
  if (contactForm) contactForm.reset();
  if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send Message'; }
  showView('form');
}
function openModal() {
  if (!emailModal) return;
  openDialog(emailModal, resetEmailModal);
  showView('form', true);
}
if (openModalBtn) openModalBtn.addEventListener('click', openModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeDialog);
if (cancelBtn) cancelBtn.addEventListener('click', closeDialog);
if (successDismiss) successDismiss.addEventListener('click', closeDialog);
if (errorDismiss) errorDismiss.addEventListener('click', () => showView('form', true));

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
      if (res.ok) showView('success', true);
      else showView('error', true);
    } catch (err) {
      showView('error', true);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Message';
    }
  });
}

// ─── PROJECT DETAILS MODAL ───
// Each card carries its own write-up in a <template class="proj-detail">. The
// pop-up copies that in along with the card's title, meta line, tags and links,
// so there is one place to edit per project. The Details buttons ship hidden
// and only appear here, since without JS they would do nothing.
const projectModal = document.getElementById('projectModal');
if (projectModal) {
  const projectContent = projectModal.querySelector('.modal-content');
  const projectTitle   = document.getElementById('projectTitle');
  const projectMeta    = document.getElementById('projectMeta');
  const projectBody    = document.getElementById('projectBody');
  const projectTags    = document.getElementById('projectTags');
  const projectLinks   = document.getElementById('projectLinks');
  const closeProject   = document.getElementById('closeProject');

  const openProject = (card) => {
    const detail = card.querySelector('.proj-detail');
    if (!detail) return;
    const meta = card.querySelector('.proj-meta');
    projectTitle.textContent = card.querySelector('h3').textContent;
    projectMeta.textContent  = meta ? meta.textContent : '';
    projectBody.replaceChildren(detail.content.cloneNode(true));
    projectTags.replaceChildren(...Array.from(card.querySelectorAll('.tag'), (t) => t.cloneNode(true)));
    projectLinks.replaceChildren(...Array.from(card.querySelectorAll('.proj-links a'), (a) => a.cloneNode(true)));
    projectLinks.hidden = !projectLinks.children.length;
    openDialog(projectModal);
    projectContent.scrollTop = 0;
    closeProject.focus();
  };

  document.querySelectorAll('.proj-details').forEach((btn) => {
    btn.hidden = false;
    btn.closest('.proj-links').hidden = false;
    btn.addEventListener('click', () => openProject(btn.closest('.proj')));
  });
  closeProject.addEventListener('click', closeDialog);
}

// ─── PROJECT FILTERS ───
// Toggle buttons (aria-pressed) that hide the cards outside a category. They
// ship hidden, so without JS every card simply shows.
const projFilters = document.querySelector('.proj-filters');
if (projFilters) {
  const filterBtns = projFilters.querySelectorAll('.filter');
  const projCards  = document.querySelectorAll('.proj[data-category]');
  const projCount  = document.getElementById('projCount');
  projFilters.hidden = false;
  projFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    const want = btn.dataset.filter;
    filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    let shown = 0;
    projCards.forEach((card) => {
      const show = want === 'all' || card.dataset.category === want;
      card.hidden = !show;
      if (show) { shown++; card.classList.add('in'); }   // skip the scroll reveal for cards shown by a filter
    });
    if (projCount) projCount.textContent = 'Showing ' + shown + (shown === 1 ? ' project' : ' projects');
  });
}

// ─── IMAGE LIGHTBOX ───
// Clicking or tapping a card's image opens a larger copy of it: the screenshot,
// or the gradient placeholder until there is one. Where the image shows in the
// card (touch, and 900px and below) it becomes a keyboard-reachable button and
// gets focus back on close; on desktop the hover preview stands in for it and
// the card's click handler above calls openZoom(). The Demo button stays the
// only way to the demo video.
const imageModal = document.getElementById('imageModal');
if (imageModal) {
  const zoomTitle = document.getElementById('zoomTitle');
  const zoomFrame = document.getElementById('zoomFrame');
  const closeImage = document.getElementById('closeImage');

  window.openZoom = (media) => {
    const copy = media.cloneNode(true);
    ['tabindex', 'role', 'aria-label', 'aria-hidden', 'loading', 'id'].forEach((a) => copy.removeAttribute(a));
    zoomTitle.textContent = media.dataset.title || '';
    zoomFrame.replaceChildren(copy);
    openDialog(imageModal, () => zoomFrame.replaceChildren());
    closeImage.focus();
  };
  closeImage.addEventListener('click', closeDialog);

  document.querySelectorAll('.proj-media').forEach((media) => {
    const name = media.dataset.title || 'this project';
    media.removeAttribute('aria-hidden');
    media.setAttribute('role', 'button');
    media.setAttribute('tabindex', '0');
    media.setAttribute('aria-label', 'View a larger image of ' + name);
    media.addEventListener('click', () => {
      media.focus({ preventScroll: true });           // so closing returns focus here
      window.openZoom(media);
    });
    media.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      window.openZoom(media);
    });
  });
}
