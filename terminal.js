/* ─── THERESE.TS LIVE TERMINAL ───
   Types the frames in window.THERESE_FRAMES into the existing .code-card, one
   after another, like a streamed response. Frame 1 is the static markup already
   in the card, so crawlers and no-JS visitors still get it.

   Everything runs off one timer. Pausing (card off-screen, tab hidden, pointer
   over the card, card focused) clears that timer and stores what was left of
   its delay; resuming re-arms it, so typing picks up at the same character.

   The card never changes size: every frame renders as exactly LINES lines (the last
   one holds a single space if empty, since a pre drops a trailing blank line), and the frames file keeps
   every line inside the narrowest card width. */
(function(){
  var LINES = 14;                    // the card's height today, in lines
  var TYPE_MIN = 25, TYPE_MAX = 60;  // ms per character
  var HOLD_MIN = 4000, HOLD_MAX = 6000;
  var CLEAR_TOTAL = 1700;            // the erase takes ~1.7s whatever the frame's length:
  var CLEAR_MIN = 120, CLEAR_MAX = 150; // lines go bottom-up, 120-150ms apart
  var CLEAR_GAP = 350;               // blank pause before the next frame types
  var STILL_SWAP = 12000;            // reduced motion: one whole frame every 12s
  var CURSOR = '<span class="tcur" aria-hidden="true"></span>';

  function rand(a, b){ return a + Math.random() * (b - a); }
  function esc(s){ return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // One line → [[class, text], ...] using the card's existing syntax classes:
  // .k keyword, .p object key (and the variable name), .s string, .c comment,
  // '' for punctuation, which reads the pre colour.
  function tokenize(line){
    var out = [], m = line.match(/^(\s*)(\/\/.*)$/);
    function plain(ch){
      var last = out[out.length - 1];
      if(last && last[0] === '') last[1] += ch; else out.push(['', ch]);
    }
    if(m){
      if(m[1]) out.push(['', m[1]]);
      out.push(['c', m[2]]);
      return out;
    }
    var re = /(\bconst\b)|("(?:[^"\\]|\\.)*")|([A-Za-z_$][\w$]*)(?=\s*[:=])|([\s\S])/g, t;
    while((t = re.exec(line))){
      if(t[1]) out.push(['k', t[1]]);
      else if(t[2]) out.push(['s', t[2]]);
      else if(t[3]) out.push(['p', t[3]]);
      else plain(t[4]);
    }
    return out;
  }

  // Plain-language version of a frame for the live region, so a screen reader
  // hears "role: AI automation engineer. stack: Claude Agent SDK, n8n, …" once,
  // instead of punctuation or character-by-character updates.
  function toSpeech(lines){
    var parts = [], list = null;
    function flush(){ if(list){ parts.push(list.key + ' ' + list.items.join(', ')); list = null; } }
    lines.forEach(function(raw){
      var s = raw.trim();
      if(!s || /^const\b/.test(s)) return;
      if(/^\/\//.test(s)){ flush(); parts.push(s.replace(/^\/\/\s*/, '')); return; }
      if(/^[\]\}]/.test(s)){ flush(); return; }
      var clean = s.replace(/"/g, '').replace(/,$/, '');
      if(/[\[\{]$/.test(clean)){ flush(); list = { key: clean.replace(/\s*[\[\{]$/, ''), items: [] }; return; }
      clean = clean.replace(/[\[\]\{\}]/g, '');
      if(list) list.items.push(clean); else parts.push(clean);
    });
    flush();
    return parts.join('. ') + '.';
  }

  function makeFrame(text){
    var lines = text.replace(/\s+$/, '').split('\n');
    return { lines: lines.map(tokenize), speech: toSpeech(lines) };
  }

  function lineHTML(tokens, upto){
    // upto = {tok, ch}: render tokens before tok in full, then ch chars of tok
    var html = '', n = upto ? upto.tok : tokens.length;
    for(var i = 0; i < tokens.length && i <= n; i++){
      var cls = tokens[i][0], text = tokens[i][1];
      if(upto && i === n) text = text.slice(0, upto.ch);
      if(!text) continue;
      html += cls ? '<span class="' + cls + '">' + esc(text) + '</span>' : esc(text);
    }
    return html;
  }

  function init(card, opts){
    opts = opts || {};
    var speed = opts.speed || 1;
    var code = card && card.querySelector('pre code');
    if(!code || !window.THERESE_FRAMES) return null;

    var frames = [makeFrame(code.textContent)].concat(window.THERESE_FRAMES.map(makeFrame));
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var st = { frame: 0, phase: reduced ? 'still' : 'hold', line: 0, tok: 0, ch: 0, keep: 0 };
    var announced = { 0: true };

    var timer = null, pending = null, remaining = 0, dueAt = 0, running = false;
    var onScreen = false, hovered = false, focused = false, pageHidden = false, destroyed = false;

    // Screen readers get each completed frame once, as plain text; the
    // character-by-character <pre> is hidden from them.
    var live = document.createElement('p');
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    live.textContent = frames[0].speech;
    card.appendChild(live);
    card.querySelector('pre').setAttribute('aria-hidden', 'true');

    // Focusable so keyboard (and tap) users can hold a frame still to read it.
    card.tabIndex = 0;
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', 'therese.ts');

    function render(){
      var f = frames[st.frame], out = [];
      var cursorLine = -1, full = 0;
      if(st.phase === 'typing'){ full = st.line; cursorLine = st.line; }
      else if(st.phase === 'hold'){ full = f.lines.length; cursorLine = f.lines.length - 1; }
      else if(st.phase === 'clearing'){ full = st.keep; cursorLine = Math.max(0, st.keep - 1); }
      else if(st.phase === 'gap'){ full = 0; cursorLine = 0; }
      else { full = f.lines.length; }                     // still: whole frame, no cursor

      for(var i = 0; i < LINES; i++){
        var s = '';
        if(i < full && f.lines[i]) s = lineHTML(f.lines[i]);
        else if(st.phase === 'typing' && i === st.line && f.lines[i]) s = lineHTML(f.lines[i], { tok: st.tok, ch: st.ch });
        if(i === cursorLine) s += CURSOR;
        out.push(s);
      }
      if(!out[LINES - 1]) out[LINES - 1] = ' ';         // a pre drops a trailing empty line
      code.innerHTML = out.join('\n');
    }

    // ── one timer, pausable ──
    function schedule(fn, ms){
      pending = fn;
      remaining = ms / speed;
      if(running) arm();
    }
    function arm(){
      dueAt = Date.now() + remaining;
      timer = setTimeout(function(){ timer = null; var fn = pending; pending = null; fn(); }, remaining);
    }
    function setRunning(){
      var want = !destroyed && onScreen && !pageHidden && !document.hidden && !hovered && !focused;
      if(want === running) return;
      running = want;
      if(running){ if(pending) arm(); }
      else if(timer){
        clearTimeout(timer); timer = null;
        remaining = Math.max(0, dueAt - Date.now());
      }
    }

    function announce(){
      if(announced[st.frame]) return;
      announced[st.frame] = true;
      live.textContent = frames[st.frame].speech;
    }

    // ── typing ──
    function skipIndent(){
      var line = frames[st.frame].lines[st.line];
      if(line && line[0] && line[0][0] === '' && /^\s+$/.test(line[0][1])){ st.tok = 1; st.ch = 0; }
    }
    function chunk(){ var r = Math.random(); return r < 0.5 ? 1 : r < 0.85 ? 2 : 3; }

    function typeStep(){
      var f = frames[st.frame];
      if(st.line >= f.lines.length){
        st.phase = 'hold'; render(); announce();
        return schedule(startClear, rand(HOLD_MIN, HOLD_MAX));
      }
      var line = f.lines[st.line];
      if(st.tok >= line.length){                         // end of line
        var blank = !line.length;
        st.line++; st.tok = 0; st.ch = 0;
        if(st.line >= f.lines.length) return typeStep();   // last line: straight to the hold
        skipIndent(); render();
        return schedule(typeStep, blank ? 60 : rand(200, 320));
      }
      var n = chunk(), delay = 0, last = '';
      while(n-- > 0 && st.tok < line.length){
        last = line[st.tok][1].charAt(st.ch);
        st.ch++;
        delay += rand(TYPE_MIN, TYPE_MAX);
        if(st.ch >= line[st.tok][1].length){ st.tok++; st.ch = 0; }
        if(last === ',' || last === '{' || last === '[') break;
      }
      render();
      if(last === ',') delay += rand(140, 220);
      else if(last === '{' || last === '[') delay += 100;
      schedule(typeStep, delay);
    }

    var clearStepMs = CLEAR_MIN;
    function startClear(){
      st.phase = 'clearing';
      st.keep = frames[st.frame].lines.length;
      clearStepMs = Math.min(CLEAR_MAX, Math.max(CLEAR_MIN, CLEAR_TOTAL / st.keep));
      clearStep();
    }
    function clearStep(){
      if(st.keep > 0){ st.keep--; render(); return schedule(clearStep, clearStepMs); }
      st.phase = 'gap'; render();
      schedule(nextFrame, CLEAR_GAP);
    }
    function nextFrame(){
      st.frame = (st.frame + 1) % frames.length;
      st.phase = 'typing'; st.line = 0; st.tok = 0; st.ch = 0;
      skipIndent(); render();
      schedule(typeStep, rand(TYPE_MIN, TYPE_MAX));
    }

    // ── reduced motion: whole frames, slowly, no typing ──
    function stillStep(){
      st.frame = (st.frame + 1) % frames.length;
      render(); announce();
      schedule(stillStep, STILL_SWAP);
    }

    // ── what pauses it ──
    var io = null;
    if('IntersectionObserver' in window){
      io = new IntersectionObserver(function(entries){
        onScreen = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.2;
        setRunning();
      }, { threshold: [0, 0.2, 0.5] });
      io.observe(card);
    } else {
      onScreen = true;
    }
    function onVis(){ setRunning(); }
    function onEnter(){ hovered = true; setRunning(); }
    function onLeave(){ hovered = false; setRunning(); }
    function onFocusIn(){ focused = true; setRunning(); }
    function onFocusOut(){ focused = false; setRunning(); }
    function onPageHide(){ pageHidden = true; setRunning(); }
    function onPageShow(){ pageHidden = false; setRunning(); }
    document.addEventListener('visibilitychange', onVis);
    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mouseleave', onLeave);
    card.addEventListener('focusin', onFocusIn);
    card.addEventListener('focusout', onFocusOut);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);

    if(reduced){
      schedule(stillStep, STILL_SWAP);
    } else {
      render();                                          // frame 1 + cursor
      schedule(startClear, rand(HOLD_MIN, HOLD_MAX));    // armed once it's on screen
    }
    setRunning();

    return {
      destroy: function(){
        destroyed = true;
        setRunning();
        pending = null;
        if(io) io.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mouseleave', onLeave);
        card.removeEventListener('focusin', onFocusIn);
        card.removeEventListener('focusout', onFocusOut);
        window.removeEventListener('pagehide', onPageHide);
        window.removeEventListener('pageshow', onPageShow);
      },
      state: function(){
        return { frame: st.frame + 1, of: frames.length, phase: st.phase, running: running,
                 onScreen: onScreen, hovered: hovered, focused: focused,
                 tabHidden: document.hidden, reduced: reduced };
      }
    };
  }

  window.ThereseTerminal = { init: init };
})();
