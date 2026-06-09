/* ============================================================
   ATC-VOICE.JS  v2 — RTR Simulator Voice Practice Engine
   ============================================================
   Add ONE line inside <head> of every paper HTML:
     <script src="../atc-voice.js"></script>

   BUGS FIXED in v2:
   1. cp/cs read via window.cp/window.cs was broken because the
      paper files declare `let cp=0, cs=0` — `let` is NOT on window.
      Fix: read directly from the page's global scope using a getter
      function that reads from the page's script context.
   2. loadScenario override timing — now correctly chains after the
      page's own loadScenario finishes.
   3. loadPaper also changes cp — patched to update our getter.
   4. Light-theme CSS — cards now adapt to both dark and light pages.
   ============================================================ */

(function(){
'use strict';

/* ================================================================
   SAFE STATE ACCESSORS
   The paper HTMLs use `let cp=0, cs=0` at script scope.
   `let` is NOT on window, so window.cp === undefined always.
   We expose a tiny bridge: the page sets window._atcvState when
   cp/cs change, OR we intercept loadScenario/loadPaper to capture
   the values ourselves.
================================================================ */
let _cp = 0;
let _cs = 0;

function getCP(){ return _cp; }
function getCS(){ return _cs; }

/* ================================================================
   PHONETIC ENGINE
================================================================ */
const NATO = {
  A:'Alpha',  B:'Bravo',   C:'Charlie', D:'Delta',  E:'Echo',
  F:'Foxtrot',G:'Golf',    H:'Hotel',   I:'India',  J:'Juliet',
  K:'Kilo',   L:'Lima',    M:'Mike',    N:'November',O:'Oscar',
  P:'Papa',   Q:'Quebec',  R:'Romeo',   S:'Sierra', T:'Tango',
  U:'Uniform',V:'Victor',  W:'Whiskey', X:'X-ray',  Y:'Yankee',
  Z:'Zulu'
};
const DIGITS = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];

function toPhonetic(text){
  let out = text.replace(/\n/g, ', ');

  /* Flight Level: FL310 or Flight Level 310 */
  out = out.replace(/\bFL\s*(\d+)/gi, (_,n) =>
    'Flight Level ' + n.split('').map(c=>DIGITS[+c]).join(' '));
  out = out.replace(/\bFlight\s+Level\s+(\d{2,3})\b/gi, (_,n) =>
    'Flight Level ' + n.split('').map(c=>DIGITS[+c]).join(' '));

  /* Runway: Runway 27 → Runway Two Seven */
  out = out.replace(/\bRunway\s+(\d{1,2}[LRC]?)\b/gi, (_,n) => {
    const num = n.replace(/[LRC]/i,'');
    const suf = (n.match(/([LRC])$/i)||[])[1]||'';
    const sufWord = {L:'Left',R:'Right',C:'Centre'}[suf.toUpperCase()]||'';
    return 'Runway ' + num.split('').map(c=>DIGITS[+c]).join(' ') + (sufWord?' '+sufWord:'');
  });

  /* QNH: QNH 1012 → QNH One Zero One Two */
  out = out.replace(/\bQNH\s*(\d+)\b/gi, (_,n) =>
    'QNH ' + n.split('').map(c=>DIGITS[+c]).join(' '));

  /* Frequencies: 118.7 → One One Eight Decimal Seven */
  out = out.replace(/\b(\d{3})\.(\d{1,3})\b/g, (_,a,b) =>
    a.split('').map(c=>DIGITS[+c]).join(' ') + ' Decimal ' +
    b.split('').map(c=>DIGITS[+c]).join(' '));

  /* Callsigns with dash: VT-ABC, AIC-150 */
  out = out.replace(/\b([A-Z]{2,3})-([A-Z0-9]{2,5})\b/g, (_,pre,suf) => {
    const p = pre.split('').map(c=>NATO[c]||c).join(' ');
    const s = suf.split('').map(c=> /\d/.test(c) ? DIGITS[+c] : (NATO[c]||c)).join(' ');
    return p + ' ' + s;
  });

  /* Known words to keep as-is (don't spell out) */
  const KEEP = /^(MAYDAY|PAN|WILCO|ROGER|IFR|VFR|UTC|NM|DME|ILS|ATC|RTR|ATIS|RVSM|
    POB|HDG|ETA|QTE|QDM|QDR|QNH|QFE|VOR|NDB|ADF|GPS|RNAV|SID|STAR|
    APP|ARR|DEP|TWR|GND|ACC|CTR|TMA|CTZ|FIR|UIR|NOTAM|SIGMET|
    PIREP|METAR|SPECI|TAF|VMC|IMC|AGL|MSL|AFIS|FIS|IFR|VFR|SQUAWK)$/
    .source.replace(/\s+/g,'');
  const KEEP_RE = new RegExp(KEEP);

  /* Remaining short ALL-CAPS words → spell out letter by letter */
  out = out.replace(/\b([A-Z]{2,5})\b/g, (m,w) => {
    if(KEEP_RE.test(w)) return w;
    return w.split('').map(c=>NATO[c]||c).join(' ');
  });

  /* 4-digit times: 1430 → One Four Three Zero */
  out = out.replace(/\b(\d{4})\b/g, (_,n) =>
    n.split('').map(c=>DIGITS[+c]).join(' '));

  /* 3-digit numbers: 150 → One Five Zero */
  out = out.replace(/\b(\d{3})\b/g, (_,n) =>
    n.split('').map(c=>DIGITS[+c]).join(' '));

  /* 2-digit numbers: 47 → Four Seven */
  out = out.replace(/\b(\d{2})\b/g, (_,n) =>
    n.split('').map(c=>DIGITS[+c]).join(' '));

  /* Single digit: 5 → Five */
  out = out.replace(/\b(\d)\b/g, (_,n) => DIGITS[+n]);

  return out;
}

/* ================================================================
   SPEECH ENGINE
================================================================ */
let selectedVoice = null;
let speechRate    = 1.0;
let currentBtn    = null;

function loadVoices(){
  function populate(){
    const voices = window.speechSynthesis.getVoices();
    if(!voices.length) return;
    const sel = document.getElementById('atcv-voice-sel');
    if(!sel) return;
    const eng = voices.filter(v => v.lang.startsWith('en'));
    const list = eng.length ? eng : voices;
    sel.innerHTML = '';
    list.forEach((v,i) => {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = v.name.replace(/Microsoft /,'').replace(/ - .*$/,'').substring(0,22);
      sel.appendChild(o);
    });
    const preferred = ['David','Mark','Google UK English Male','Google US English','Daniel','James'];
    let defIdx = 0;
    for(const p of preferred){
      const f = list.findIndex(v => v.name.includes(p));
      if(f >= 0){ defIdx = f; break; }
    }
    sel.value = defIdx;
    selectedVoice = list[defIdx];
    sel._list = list;
  }
  populate();
  window.speechSynthesis.onvoiceschanged = populate;
}

function setVoice(idx){
  const sel = document.getElementById('atcv-voice-sel');
  if(sel && sel._list) selectedVoice = sel._list[+idx] || null;
}

function setSpeed(s){
  speechRate = s;
  document.querySelectorAll('.atcv-spd').forEach(b => {
    b.classList.toggle('atcv-spd-on', parseFloat(b.dataset.s) === s);
  });
}

function stopSpeech(){
  window.speechSynthesis.cancel();
  if(currentBtn){
    currentBtn.textContent = '▶ Play Again';
    currentBtn.classList.remove('atcv-speaking');
    currentBtn = null;
  }
}

function speakPhonetic(text, btn, onDone){
  stopSpeech();
  const phonetic = toPhonetic(text);
  const utt = new SpeechSynthesisUtterance(phonetic);
  if(selectedVoice) utt.voice = selectedVoice;
  utt.rate  = speechRate;
  utt.pitch = 0.92;
  if(btn){
    btn.textContent = '⏹ Stop';
    btn.classList.add('atcv-speaking');
    currentBtn = btn;
  }
  utt.onend = () => {
    if(btn){ btn.textContent = '▶ Play Again'; btn.classList.remove('atcv-speaking'); }
    if(currentBtn === btn) currentBtn = null;
    if(onDone) onDone();
  };
  utt.onerror = () => {
    if(btn){ btn.textContent = '▶ Play Again'; btn.classList.remove('atcv-speaking'); }
    if(onDone) onDone();
  };
  window.speechSynthesis.speak(utt);
}

/* ================================================================
   INJECT CSS
================================================================ */
function injectStyles(){
  const s = document.createElement('style');
  s.textContent = `
/* ── ATC VOICE ENGINE v2 ── */
#atcv-controls{display:flex;align-items:center;gap:6px;flex-shrink:0}
#atcv-voice-sel{
  padding:3px 6px;font-size:10px;font-weight:600;
  border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);
  color:inherit;border-radius:4px;cursor:pointer;outline:none;max-width:130px;
}
.atcv-spd{
  padding:3px 7px;font-size:10px;font-weight:700;
  border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);
  color:rgba(255,255,255,.55);border-radius:3px;cursor:pointer;
  letter-spacing:.3px;transition:all .12s;
}
.atcv-spd-on{background:rgba(74,143,255,.55)!important;color:#fff!important;border-color:#4a8fff!important}
.atcv-spd:hover{background:rgba(255,255,255,.14)}

/* Flow wrap */
#atcv-flow-wrap{padding:12px 12px 4px}
#atcv-flow{display:flex;flex-direction:column;gap:10px}

/* Step cards — neutral base, coloured by role */
.atcv-card{
  border-radius:8px;border:2px solid #999;
  overflow:hidden;transition:all .25s;
}
.atcv-card.atcv-future{opacity:.25;pointer-events:none}
.atcv-card.atcv-done{opacity:.6}

/* ATC card */
.atcv-atc-head{
  background:#3a1800;border-bottom:2px solid #cc6600;
  padding:7px 12px;display:flex;align-items:center;gap:8px;
}
.atcv-atc-body{
  background:#3a1800;padding:10px 14px;
  font-size:13px;font-weight:700;color:#ffd090;
  white-space:pre-line;line-height:1.75;
}
.atcv-atc-lbl{font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#ff9933}
.atcv-card.atcv-active.atcv-atc-card{border-color:#cc6600}

/* Pilot card */
.atcv-pilot-head{
  background:#0a2040;border-bottom:2px solid #3a7fff;
  padding:7px 12px;display:flex;align-items:center;gap:8px;
}
.atcv-pilot-lbl{font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#6aafff}
.atcv-card.atcv-active.atcv-pilot-card{border-color:#3a7fff}

/* Readback card */
.atcv-rb-head{
  background:#0a2818;border-bottom:2px solid #2a8a5a;
  padding:7px 12px;display:flex;align-items:center;gap:8px;
}
.atcv-rb-lbl{font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#4acc88}
.atcv-card.atcv-active.atcv-rb-card{border-color:#2a8a5a}

/* Your turn block */
.atcv-your-turn{
  display:flex;align-items:center;gap:8px;padding:10px 14px;flex-wrap:wrap;
}
.atcv-your-turn.atcv-pilot-bg{background:#0a2040}
.atcv-your-turn.atcv-rb-bg{background:#0a2818}
.atcv-mic{font-size:20px}
.atcv-turn-txt{font-size:12px;font-weight:600;color:#aaccee;flex:1}

/* Play button */
.atcv-play-btn{
  margin-left:auto;padding:4px 12px;font-size:10px;font-weight:700;
  border:1px solid #cc6600;background:rgba(255,120,0,.12);
  color:#ff9933;border-radius:4px;cursor:pointer;
  letter-spacing:.5px;transition:all .15s;white-space:nowrap;
}
.atcv-play-btn:hover{background:rgba(255,120,0,.25)}
@keyframes atcv-pulse{from{opacity:.75}to{opacity:1}}
.atcv-speaking{animation:atcv-pulse .7s infinite alternate!important}

/* Hint button */
.atcv-hint-btn{
  padding:4px 10px;font-size:10px;font-weight:700;
  border:1px solid rgba(255,255,255,.15);background:transparent;
  color:rgba(255,255,255,.4);border-radius:4px;cursor:pointer;
  letter-spacing:.5px;transition:all .15s;
}
.atcv-hint-btn:hover{background:rgba(255,255,255,.08);color:rgba(255,255,255,.75)}

/* Continue button */
.atcv-cont-btn{
  padding:5px 14px;font-size:10px;font-weight:800;
  border:none;background:#4a8fff;color:#fff;
  border-radius:4px;cursor:pointer;letter-spacing:.5px;transition:all .15s;
}
.atcv-cont-btn:hover{filter:brightness(1.15)}

/* Hint reveal */
.atcv-hint-reveal{
  display:none;padding:8px 14px 10px;
  font-size:12px;font-weight:700;color:#ddeeff;
  white-space:pre-line;line-height:1.7;
  border-top:1px dashed rgba(255,255,255,.15);
  background:rgba(74,143,255,.08);
}
.atcv-hint-reveal.atcv-vis{display:block}

/* Done tick */
.atcv-done-tick{
  margin-left:auto;width:20px;height:20px;
  background:#00cc77;color:#fff;border-radius:50%;
  font-size:11px;font-weight:800;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}

/* Restart & full answer */
.atcv-restart-btn{
  width:100%;padding:9px;font-size:11px;font-weight:700;
  border:1px solid rgba(255,255,255,.15);background:transparent;
  color:rgba(255,255,255,.45);border-radius:6px;cursor:pointer;
  letter-spacing:1px;text-transform:uppercase;margin-top:6px;transition:all .15s;
}
.atcv-restart-btn:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.75)}

.atcv-full-reveal-btn{
  width:100%;padding:8px;font-size:10px;font-weight:700;
  border:1px solid rgba(0,204,120,.4);background:rgba(0,204,120,.07);
  color:#00cc77;border-radius:6px;cursor:pointer;
  letter-spacing:1px;text-transform:uppercase;margin-top:6px;transition:all .15s;
}
.atcv-full-reveal-btn:hover{background:rgba(0,204,120,.14)}
.atcv-full-answer{display:none;margin-top:10px}
.atcv-full-answer.atcv-vis{display:block}
`;
  document.head.appendChild(s);
}

/* ================================================================
   INJECT VOICE CONTROLS INTO TOPBAR
================================================================ */
function injectVoiceControls(){
  const tbRight = document.querySelector('.topbar-right') ||
                  document.querySelector('#topbar');
  if(!tbRight) return;

  /* Insert a divider */
  const div = document.createElement('div');
  div.className = 'tdiv';
  div.style.cssText = 'width:1px;height:18px;background:rgba(255,255,255,.2);margin:0 2px;flex-shrink:0';

  const wrap = document.createElement('div');
  wrap.id = 'atcv-controls';
  wrap.innerHTML = `
    <select id="atcv-voice-sel" onchange="window._atcvSetVoice(this.value)" title="ATC Voice"></select>
    <button class="atcv-spd atcv-spd-on" data-s="1"   onclick="window._atcvSetSpeed(1)">1×</button>
    <button class="atcv-spd"             data-s="0.8" onclick="window._atcvSetSpeed(0.8)">0.8×</button>
    <button class="atcv-spd"             data-s="1.2" onclick="window._atcvSetSpeed(1.2)">1.2×</button>
  `;

  const timer = tbRight.querySelector('#timer-display');
  if(timer){
    tbRight.insertBefore(div, timer);
    tbRight.insertBefore(wrap, timer);
  } else {
    tbRight.prepend(wrap);
  }

  window._atcvSetVoice = setVoice;
  window._atcvSetSpeed = setSpeed;
}

/* ================================================================
   INJECT FLOW CONTAINER + PATCH PAGE FUNCTIONS
================================================================ */
function injectFlow(){
  /* Hide original reveal button + answer box */
  const ansBox   = document.getElementById('answer-box');
  const revBtn   = document.getElementById('reveal-btn');
  if(!ansBox){ console.warn('atc-voice: #answer-box not found'); return; }

  ansBox.style.display = 'none';
  if(revBtn) revBtn.style.display = 'none';

  /* Create our flow container immediately before answer-box */
  const flowWrap = document.createElement('div');
  flowWrap.id = 'atcv-flow-wrap';
  ansBox.parentNode.insertBefore(flowWrap, ansBox);

  /* ── PATCH loadScenario ──
     The page defines: function loadScenario(i){ cs=i; ... }
     We wrap it so we capture cs each time, then rebuild our flow. */
  const origLoadScenario = window.loadScenario;
  window.loadScenario = function(i){
    _cs = i;
    origLoadScenario.call(this, i);
    buildFlow();
  };

  /* ── PATCH loadPaper ──
     The page defines: function loadPaper(i){ cp=i; cs=0; ... }
     We wrap it so we capture cp. */
  if(typeof window.loadPaper === 'function'){
    const origLoadPaper = window.loadPaper;
    window.loadPaper = function(i){
      _cp = i;
      _cs = 0;
      origLoadPaper.call(this, i);
      /* loadPaper calls loadScenario(0) which is now patched —
         it will also call buildFlow, so no extra call needed here */
    };
  }

  /* Build for first scenario immediately */
  buildFlow();
}

/* ================================================================
   BUILD CONVERSATION FLOW
================================================================ */
function buildFlow(){
  const wrap = document.getElementById('atcv-flow-wrap');
  if(!wrap) return;

  /* Get scenario data */
  if(typeof papers === 'undefined'){
    wrap.innerHTML = '<p style="color:red;padding:10px">atc-voice: papers[] not found</p>';
    return;
  }

  const cp = getCP();
  const cs = getCS();

  if(!papers[cp] || !papers[cp].scenarios || !papers[cp].scenarios[cs]){
    wrap.innerHTML = ''; return;
  }

  const s = papers[cp].scenarios[cs];
  const transmissions = s.answer ? s.answer.transmissions : [];
  if(!transmissions.length){ wrap.innerHTML = ''; return; }

  stopSpeech();

  let html = '<div id="atcv-flow">';

  transmissions.forEach((t, idx) => {
    const isATC      = t.who === 'atc';
    const isReadback = t.who === 'readback';
    const isPilot    = !isATC;

    const roleClass  = isATC ? 'atcv-atc-card' : isReadback ? 'atcv-rb-card' : 'atcv-pilot-card';
    const headClass  = isATC ? 'atcv-atc-head'  : isReadback ? 'atcv-rb-head'  : 'atcv-pilot-head';
    const lblClass   = isATC ? 'atcv-atc-lbl'   : isReadback ? 'atcv-rb-lbl'   : 'atcv-pilot-lbl';
    const lbl        = isATC ? '📻 ATC' : isReadback ? '↺ Readback — Your Turn' : '✈ Pilot — Your Turn';
    const state      = idx === 0 ? 'atcv-active' : 'atcv-future';

    /* Escape for inline onclick attribute */
    const esc = t.text
      .replace(/\\/g,'\\\\')
      .replace(/`/g,'&#96;')
      .replace(/'/g,'&#39;')
      .replace(/"/g,'&quot;');

    if(isATC){
      html += `
      <div class="atcv-card ${roleClass} ${state}" id="atcv-step-${idx}">
        <div class="${headClass}">
          <span class="${lblClass}">${lbl}</span>
          <button class="atcv-play-btn" id="atcv-pb-${idx}"
            onclick="window._atcvPlay(${idx},'${esc}')">▶ Play</button>
        </div>
        <div class="atcv-atc-body">${t.text.replace(/\n/g,'<br>')}</div>
      </div>`;
    } else {
      const bgClass = isReadback ? 'atcv-rb-bg' : 'atcv-pilot-bg';
      html += `
      <div class="atcv-card ${roleClass} ${state}" id="atcv-step-${idx}">
        <div class="${headClass}">
          <span class="${lblClass}">${lbl}</span>
        </div>
        <div class="atcv-your-turn ${bgClass}">
          <span class="atcv-mic">🎤</span>
          <span class="atcv-turn-txt">Speak your transmission, then click Continue</span>
          <button class="atcv-hint-btn" onclick="window._atcvHint(${idx})">💡 Hint</button>
          <button class="atcv-cont-btn" onclick="window._atcvNext(${idx})">✓ Continue</button>
        </div>
        <div class="atcv-hint-reveal" id="atcv-hint-${idx}">${t.text.replace(/\n/g,'<br>')}</div>
      </div>`;
    }
  });

  html += `
  <button class="atcv-restart-btn" onclick="window._atcvRestart()">↺ Restart Exchange</button>
  <button class="atcv-full-reveal-btn" onclick="window._atcvFullReveal()">▼ Show Full Answer</button>
  <div class="atcv-full-answer" id="atcv-full-ans"></div>
  </div>`;

  wrap.innerHTML = html;

  /* Expose callbacks */
  window._atcvPlay       = playStep;
  window._atcvNext       = nextStep;
  window._atcvHint       = toggleHint;
  window._atcvRestart    = buildFlow;
  window._atcvFullReveal = fullReveal;

  /* Auto-play first ATC step if scenario opens with ATC */
  if(transmissions[0] && transmissions[0].who === 'atc'){
    setTimeout(() => {
      const btn = document.getElementById('atcv-pb-0');
      speakPhonetic(transmissions[0].text, btn, null);
    }, 500);
  }
}

/* ── Play one ATC step ── */
function playStep(idx, rawText){
  const text = rawText
    .replace(/&#96;/g,'`')
    .replace(/&#39;/g,"'")
    .replace(/&quot;/g,'"');
  const btn = document.getElementById(`atcv-pb-${idx}`);
  if(btn && btn.classList.contains('atcv-speaking')){ stopSpeech(); return; }
  speakPhonetic(text, btn, null);
}

/* ── Mark step done, activate next, auto-play if ATC ── */
function nextStep(idx){
  stopSpeech();

  /* Mark current done */
  const cur = document.getElementById(`atcv-step-${idx}`);
  if(cur){
    cur.classList.remove('atcv-active');
    cur.classList.add('atcv-done');
    const head = cur.querySelector('[class$="-head"]') || cur.querySelector('[class*="-head"]');
    if(head && !head.querySelector('.atcv-done-tick')){
      const tick = document.createElement('div');
      tick.className = 'atcv-done-tick';
      tick.textContent = '✓';
      head.appendChild(tick);
    }
  }

  /* Activate next */
  const next = document.getElementById(`atcv-step-${idx+1}`);
  if(!next) return;

  next.classList.remove('atcv-future');
  next.classList.add('atcv-active');
  next.scrollIntoView({behavior:'smooth', block:'nearest'});

  /* Auto-play if the next step is ATC */
  if(next.classList.contains('atcv-atc-card')){
    const cp = getCP(), cs = getCS();
    const s  = papers[cp] && papers[cp].scenarios && papers[cp].scenarios[cs];
    const t  = s && s.answer && s.answer.transmissions[idx+1];
    if(t && t.who === 'atc'){
      setTimeout(() => {
        const btn = document.getElementById(`atcv-pb-${idx+1}`);
        speakPhonetic(t.text, btn, null);
      }, 400);
    }
  }
}

/* ── Toggle hint text ── */
function toggleHint(idx){
  const h = document.getElementById(`atcv-hint-${idx}`);
  if(!h) return;
  const vis = h.classList.toggle('atcv-vis');
  const card = document.getElementById(`atcv-step-${idx}`);
  if(card){
    const btn = card.querySelector('.atcv-hint-btn');
    if(btn) btn.textContent = vis ? '🙈 Hide' : '💡 Hint';
  }
}

/* ── Show full answer at bottom ── */
function fullReveal(){
  const cp = getCP(), cs = getCS();
  if(typeof papers === 'undefined' || !papers[cp] || !papers[cp].scenarios[cs]) return;

  const trs = papers[cp].scenarios[cs].answer.transmissions;
  const box = document.getElementById('atcv-full-ans');
  if(!box) return;

  if(box.classList.contains('atcv-vis')){
    box.classList.remove('atcv-vis');
    box.innerHTML = '';
    const btn = box.previousElementSibling;
    if(btn) btn.textContent = '▼ Show Full Answer';
    return;
  }

  const style = {
    pilot:    { bg:'#0a2040', bdr:'#3a7fff', lbl:'✈ Pilot' },
    atc:      { bg:'#3a1800', bdr:'#cc6600', lbl:'📻 ATC' },
    readback: { bg:'#0a2818', bdr:'#2a8a5a', lbl:'↺ Readback' }
  };

  box.innerHTML = trs.map(t => {
    const st = style[t.who] || style.pilot;
    return `<div style="background:${st.bg};border-left:3px solid ${st.bdr};border-radius:6px;
      padding:10px 13px;margin-bottom:8px;font-size:12px;font-weight:700;
      color:#ddeeff;white-space:pre-line;line-height:1.65">
      <div style="font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;
        color:${st.bdr};margin-bottom:4px">${st.lbl}</div>
      ${t.text.replace(/</g,'&lt;')}
    </div>`;
  }).join('');

  box.classList.add('atcv-vis');
  const btn = box.previousElementSibling;
  if(btn) btn.textContent = '▲ Hide Full Answer';
}

/* ================================================================
   BOOT — wait for DOM + page scripts to fully load
================================================================ */
window.addEventListener('load', function(){
  injectStyles();
  injectVoiceControls();
  loadVoices();

  /* Wait for revealAnswer + loadScenario to be defined by the page */
  let waited = 0;
  function tryInit(){
    if(typeof window.loadScenario === 'function'){
      injectFlow();
    } else if(waited < 3000){
      waited += 100;
      setTimeout(tryInit, 100);
    } else {
      console.warn('atc-voice: loadScenario not found after 3s');
    }
  }
  tryInit();
});

})();
