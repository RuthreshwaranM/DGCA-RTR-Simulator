/* ============================================================
   ATC-VOICE.JS — RTR Simulator Voice Practice Engine
   ============================================================
   Add ONE line inside <head> of every paper HTML:
   <script src="../atc-voice.js"></script>

   This file auto-injects:
   - Voice controls in topbar (voice select + speed)
   - Conversation flow replacing the answer box
   - Step-by-step: Pilot turn → ATC speaks → Readback → next ATC...
   - Phonetic engine (NATO, FL, QNH, frequencies, callsigns)
   - Full answer reveal still available at bottom
   ============================================================ */

(function(){
'use strict';

/* ── WAIT FOR PAGE TO FULLY LOAD ── */
window.addEventListener('load', function(){
  injectStyles();
  injectVoiceControls();
  patchRevealAnswer();
  loadVoices();
});

/* ================================================================
   PHONETIC ENGINE
================================================================ */
const NATO = {
  A:'Alpha',B:'Bravo',C:'Charlie',D:'Delta',E:'Echo',F:'Foxtrot',
  G:'Golf',H:'Hotel',I:'India',J:'Juliet',K:'Kilo',L:'Lima',
  M:'Mike',N:'November',O:'Oscar',P:'Papa',Q:'Quebec',R:'Romeo',
  S:'Sierra',T:'Tango',U:'Uniform',V:'Victor',W:'Whiskey',X:'X-ray',
  Y:'Yankee',Z:'Zulu'
};
const DIGITS = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];

function toPhonetic(text){
  let out = text.replace(/\n/g,', ');

  /* Flight Level: FL310 or Flight Level 310 */
  out = out.replace(/\bFL\s*(\d+)/gi,(_,n)=>
    'Flight Level '+n.split('').map(c=>DIGITS[+c]).join(' '));
  out = out.replace(/Flight Level\s+(\d{2,3})/gi,(_,n)=>
    'Flight Level '+n.split('').map(c=>DIGITS[+c]).join(' '));

  /* Runway: Runway 27 → Runway Two Seven */
  out = out.replace(/Runway\s+(\d{1,2}[LRC]?)/gi,(_,n)=>{
    const num = n.replace(/[LRC]/,'');
    const suf = n.match(/[LRC]/)?.[0]||'';
    const sufWord = {L:'Left',R:'Right',C:'Centre'}[suf]||'';
    return 'Runway '+num.split('').map(c=>DIGITS[+c]).join(' ')+(sufWord?' '+sufWord:'');
  });

  /* QNH: QNH 1012 → QNH One Zero One Two */
  out = out.replace(/\bQNH\s*(\d+)/gi,(_,n)=>
    'QNH '+n.split('').map(c=>DIGITS[+c]).join(' '));

  /* Frequencies: 118.7 → One One Eight Decimal Seven */
  out = out.replace(/\b(\d{3})\.(\d{1,3})\b/g,(_,a,b)=>
    a.split('').map(c=>DIGITS[+c]).join(' ')+' Decimal '+
    b.split('').map(c=>DIGITS[+c]).join(' '));

  /* Callsigns: VT-ABC, AIC-150, QP-142 */
  out = out.replace(/\b([A-Z]{2,3})-([A-Z0-9]{2,5})\b/g,(_,pre,suf)=>{
    const p=pre.split('').map(c=>NATO[c]||c).join(' ');
    const s=suf.split('').map(c=>NATO[c]||DIGITS[+c]||c).join(' ');
    return p+' '+s;
  });

  /* Known abbreviations to keep as-is */
  const KEEP=/^(MAYDAY|PAN|WILCO|ROGER|IFR|VFR|UTC|NM|DME|ILS|ATC|RTR|ATIS|RVSM|POB|HDG|ETA|QTE|QDM|QDR|QNH|QFE|VOR|DME|NDB|ADF|GPS|RNAV|SID|STAR|APP|ARR|DEP|TWR|GND|ACC|CTR|TMA|CTZ|FIR|UIR|NOTAM|SIGMET|PIREP|METAR|SPECI|TAF|ATIS)$/;

  /* Short ALL-CAPS words → spell out */
  out = out.replace(/\b([A-Z]{2,5})\b/g,(m,w)=>{
    if(KEEP.test(w)) return w;
    if(/^[A-Z]{2,5}$/.test(w)) return w.split('').map(c=>NATO[c]||c).join(' ');
    return m;
  });

  /* Time: 4-digit time 0356 → Zero Three Five Six */
  out = out.replace(/\b(\d{4})\b/g,(_,n)=>
    n.split('').map(c=>DIGITS[+c]).join(' '));

  /* 3-digit numbers: 150 → One Five Zero */
  out = out.replace(/\b(\d{3})\b/g,(_,n)=>
    n.split('').map(c=>DIGITS[+c]).join(' '));

  /* 2-digit numbers */
  out = out.replace(/\b(\d{2})\b/g,(_,n)=>
    n.split('').map(c=>DIGITS[+c]).join(' '));

  /* Single digits */
  out = out.replace(/\b(\d)\b/g,(_,n)=>DIGITS[+n]);

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
    sel.innerHTML = '';
    /* Prefer English voices */
    const eng = voices.filter(v=>v.lang.startsWith('en'));
    const list = eng.length ? eng : voices;
    list.forEach((v,i)=>{
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = v.name.replace(/Microsoft /,'').replace(/ - .*$/,'').substring(0,22);
      sel.appendChild(opt);
    });
    /* Pick a good default — prefer David/Mark/Google UK */
    const preferred=['David','Mark','Google UK','Google US','Daniel','James'];
    let defIdx=0;
    for(const p of preferred){
      const found=list.findIndex(v=>v.name.includes(p));
      if(found>=0){ defIdx=found; break; }
    }
    sel.value=defIdx;
    selectedVoice=list[defIdx];
  }
  populate();
  window.speechSynthesis.onvoiceschanged=populate;
}

function setVoice(idx){
  const voices=window.speechSynthesis.getVoices()
    .filter(v=>v.lang.startsWith('en'));
  const list=voices.length?voices:window.speechSynthesis.getVoices();
  selectedVoice=list[idx]||null;
}

function setSpeed(s){
  speechRate=s;
  document.querySelectorAll('.atcv-spd').forEach(b=>{
    b.classList.toggle('atcv-spd-on', parseFloat(b.dataset.s)===s);
  });
}

function stopSpeech(){
  window.speechSynthesis.cancel();
  if(currentBtn){
    currentBtn.textContent='▶ Play Again';
    currentBtn.classList.remove('atcv-speaking');
    currentBtn=null;
  }
}

function speakPhonetic(text, btn, onDone){
  stopSpeech();
  const phonetic = toPhonetic(text);
  const utt = new SpeechSynthesisUtterance(phonetic);
  if(selectedVoice) utt.voice=selectedVoice;
  utt.rate=speechRate;
  utt.pitch=0.92;
  if(btn){
    btn.textContent='⏹ Stop';
    btn.classList.add('atcv-speaking');
    currentBtn=btn;
  }
  utt.onend=()=>{
    if(btn){ btn.textContent='▶ Play Again'; btn.classList.remove('atcv-speaking'); }
    if(currentBtn===btn) currentBtn=null;
    if(onDone) onDone();
  };
  utt.onerror=()=>{
    if(btn){ btn.textContent='▶ Play Again'; btn.classList.remove('atcv-speaking'); }
    if(onDone) onDone();
  };
  window.speechSynthesis.speak(utt);
}

/* ================================================================
   INJECT CSS STYLES
================================================================ */
function injectStyles(){
  const s=document.createElement('style');
  s.textContent=`
/* ── ATC VOICE ENGINE STYLES ── */
#atcv-controls{display:flex;align-items:center;gap:6px;flex-shrink:0}
#atcv-voice-sel{
  padding:3px 6px;font-size:10px;font-weight:600;
  border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);
  color:inherit;border-radius:4px;cursor:pointer;outline:none;
  max-width:120px;
}
.atcv-spd{
  padding:3px 7px;font-size:10px;font-weight:700;
  border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);
  color:rgba(255,255,255,.5);border-radius:3px;cursor:pointer;
  letter-spacing:.3px;transition:all .12s;
}
.atcv-spd-on{background:rgba(74,143,255,.5)!important;color:#fff!important;border-color:#4a8fff!important}
.atcv-spd:hover{background:rgba(255,255,255,.12)}

/* Conversation flow container */
#atcv-flow{display:flex;flex-direction:column;gap:10px;padding:14px;overflow-y:auto;flex:1}

/* Step cards */
.atcv-card{
  border-radius:8px;border:1px solid #1a2a4a;
  overflow:hidden;transition:all .25s;
}
.atcv-card.atcv-active{border-color:#4a8fff;box-shadow:0 0 0 2px rgba(74,143,255,.15)}
.atcv-card.atcv-done{opacity:.65}
.atcv-card.atcv-future{opacity:.25;pointer-events:none}

/* ATC card */
.atcv-atc-head{
  background:#180d00;border-bottom:1px solid #ff8800;
  padding:7px 12px;display:flex;align-items:center;gap:8px;
}
.atcv-atc-body{
  background:#180d00;padding:10px 14px;
  font-size:13px;font-weight:600;color:#e0c8a0;
  white-space:pre-line;line-height:1.75;
}
.atcv-atc-lbl{font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#ff8800}

/* Pilot card */
.atcv-pilot-head{
  background:#08182a;border-bottom:1px solid #4a8fff;
  padding:7px 12px;display:flex;align-items:center;gap:8px;
}
.atcv-pilot-lbl{font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#4a8fff}

/* Readback card */
.atcv-rb-head{
  background:#06101c;border-bottom:1px solid #2a6aaa;
  padding:7px 12px;display:flex;align-items:center;gap:8px;
}
.atcv-rb-lbl{font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#4a7ab0}

/* Your turn block */
.atcv-your-turn{
  background:#08182a;
  display:flex;align-items:center;gap:8px;
  padding:10px 14px;flex-wrap:wrap;
}
.atcv-rb-body{background:#06101c}
.atcv-your-turn-rb{background:#06101c}
.atcv-mic{font-size:20px}
.atcv-turn-txt{font-size:12px;font-weight:600;color:#8aaad0;flex:1}

/* Buttons */
.atcv-play-btn{
  margin-left:auto;padding:4px 12px;font-size:10px;font-weight:700;
  border:1px solid #ff8800;background:rgba(255,136,0,.1);
  color:#ff8800;border-radius:4px;cursor:pointer;
  letter-spacing:.5px;transition:all .15s;white-space:nowrap;
}
.atcv-play-btn:hover{background:rgba(255,136,0,.22)}
@keyframes atcv-pulse{from{opacity:.8}to{opacity:1}}
.atcv-speaking{animation:atcv-pulse .7s infinite alternate}

.atcv-hint-btn{
  padding:4px 10px;font-size:10px;font-weight:700;
  border:1px solid #1a2a4a;background:transparent;
  color:#4a6a8a;border-radius:4px;cursor:pointer;
  letter-spacing:.5px;transition:all .15s;
}
.atcv-hint-btn:hover{background:rgba(255,255,255,.06);color:#8aaad0}

.atcv-cont-btn{
  padding:5px 14px;font-size:10px;font-weight:700;
  border:none;background:#4a8fff;color:#fff;
  border-radius:4px;cursor:pointer;letter-spacing:.5px;
  transition:all .15s;
}
.atcv-cont-btn:hover{filter:brightness(1.1)}

.atcv-hint-reveal{
  display:none;padding:8px 14px 10px;
  font-size:12px;font-weight:600;color:#c8d8f0;
  white-space:pre-line;line-height:1.7;
  border-top:1px dashed #1a2a4a;
  background:rgba(74,143,255,.06);
}
.atcv-hint-reveal.atcv-vis{display:block}

.atcv-done-tick{
  margin-left:auto;width:20px;height:20px;
  background:#00cc88;color:#fff;border-radius:50%;
  font-size:11px;font-weight:800;
  display:flex;align-items:center;justify-content:center;
}

/* Restart button */
.atcv-restart-btn{
  width:100%;padding:9px;font-size:11px;font-weight:700;
  border:1px solid #1a2a4a;background:transparent;
  color:#4a6a8a;border-radius:6px;cursor:pointer;
  letter-spacing:1px;text-transform:uppercase;
  transition:all .15s;margin-top:4px;
}
.atcv-restart-btn:hover{background:rgba(255,255,255,.05);color:#8aaad0}

/* Full answer reveal (bottom of flow) */
.atcv-full-reveal-btn{
  width:100%;padding:8px;font-size:10px;font-weight:700;
  border:1px solid #1a4228;background:rgba(0,204,136,.06);
  color:#00cc88;border-radius:6px;cursor:pointer;
  letter-spacing:1px;text-transform:uppercase;
  transition:all .15s;margin-top:6px;
}
.atcv-full-reveal-btn:hover{background:rgba(0,204,136,.12)}
.atcv-full-answer{display:none;margin-top:10px}
.atcv-full-answer.atcv-vis{display:block}
`;
  document.head.appendChild(s);
}

/* ================================================================
   INJECT VOICE CONTROLS INTO TOPBAR
================================================================ */
function injectVoiceControls(){
  /* Find topbar right area */
  const tbRight = document.querySelector('.topbar-right') ||
                  document.querySelector('#topbar');
  if(!tbRight) return;

  const wrap = document.createElement('div');
  wrap.id = 'atcv-controls';
  wrap.innerHTML=`
    <select id="atcv-voice-sel" onchange="window._atcvSetVoice(this.value)" title="ATC Voice"></select>
    <button class="atcv-spd atcv-spd-on" data-s="1" onclick="window._atcvSetSpeed(1)">1×</button>
    <button class="atcv-spd" data-s="0.8" onclick="window._atcvSetSpeed(0.8)">0.8×</button>
    <button class="atcv-spd" data-s="1.2" onclick="window._atcvSetSpeed(1.2)">1.2×</button>
  `;

  /* Insert before timer or at start of topbar-right */
  const timer = tbRight.querySelector('#timer-display');
  if(timer) tbRight.insertBefore(wrap, timer);
  else tbRight.prepend(wrap);

  /* Expose to window */
  window._atcvSetVoice = setVoice;
  window._atcvSetSpeed = setSpeed;
}

/* ================================================================
   PATCH revealAnswer — inject conversation flow
================================================================ */
function patchRevealAnswer(){
  /* Wait for the page script to define revealAnswer */
  const maxWait = 3000;
  const start   = Date.now();

  function tryPatch(){
    if(typeof window.revealAnswer === 'function'){
      doInject();
    } else if(Date.now()-start < maxWait){
      setTimeout(tryPatch, 100);
    }
  }
  tryPatch();
}

function doInject(){
  /* Replace the answer box with our flow container */
  const ansBox = document.getElementById('answer-box');
  if(!ansBox) return;

  /* Create flow div right after the question text area */
  const qbody = ansBox.closest('#qbody') || ansBox.parentNode;

  /* Create the flow container */
  const flowWrap = document.createElement('div');
  flowWrap.id = 'atcv-flow-wrap';

  /* Hide original answer box — we replace it */
  ansBox.style.display = 'none';

  /* Also hide original reveal button */
  const revBtn = document.getElementById('reveal-btn');
  if(revBtn) revBtn.style.display = 'none';

  /* Insert flow wrap before answer box */
  ansBox.parentNode.insertBefore(flowWrap, ansBox);

  /* Override loadScenario to rebuild flow */
  const origLoadScenario = window.loadScenario;
  window.loadScenario = function(i){
    origLoadScenario(i);
    buildFlow();
  };

  /* Build flow immediately */
  buildFlow();
}

/* ================================================================
   BUILD CONVERSATION FLOW
================================================================ */
function buildFlow(){
  const wrap = document.getElementById('atcv-flow-wrap');
  if(!wrap) return;

  /* Get current scenario from page state */
  const paper = typeof papers !== 'undefined' ? papers : null;
  const cp = typeof window.cp !== 'undefined' ? window.cp : 0;
  const cs = typeof window.cs !== 'undefined' ? window.cs : 0;

  if(!paper || !paper[cp] || !paper[cp].scenarios[cs]){
    wrap.innerHTML=''; return;
  }

  const s = paper[cp].scenarios[cs];
  const transmissions = s.answer ? s.answer.transmissions : [];
  if(!transmissions.length){ wrap.innerHTML=''; return; }

  stopSpeech();

  const labelMap = {
    pilot:    ['atcv-pilot',    '✈ Pilot — Your Turn'],
    atc:      ['atcv-atc',      '📻 ATC'],
    readback: ['atcv-rb',       '↺ Readback — Your Turn']
  };

  let html='<div id="atcv-flow">';

  transmissions.forEach((t,idx)=>{
    const[cls,lbl]=labelMap[t.who]||['atcv-pilot','Pilot'];
    const state = idx===0 ? 'atcv-active' : 'atcv-future';
    const esc   = t.text.replace(/`/g,'&#96;').replace(/'/g,'&#39;').replace(/"/g,'&quot;');
    const isPilot = t.who==='pilot'||t.who==='readback';
    const headCls = `atcv-${t.who==='atc'?'atc':t.who==='readback'?'rb':'pilot'}-head`;
    const lblCls  = `atcv-${t.who==='atc'?'atc':t.who==='readback'?'rb':'pilot'}-lbl`;

    if(!isPilot){
      /* ATC card */
      html+=`
      <div class="atcv-card ${state}" id="atcv-step-${idx}">
        <div class="${headCls}">
          <span class="${lblCls}">${lbl}</span>
          <button class="atcv-play-btn" id="atcv-pb-${idx}"
            onclick="window._atcvPlay(${idx},'${esc}')">▶ Play</button>
        </div>
        <div class="atcv-atc-body">${t.text.replace(/\n/g,'<br>')}</div>
      </div>`;
    } else {
      /* Pilot / Readback card */
      const turnBg = t.who==='readback' ? 'atcv-your-turn-rb' : '';
      html+=`
      <div class="atcv-card ${state}" id="atcv-step-${idx}">
        <div class="${headCls}">
          <span class="${lblCls}">${lbl}</span>
        </div>
        <div class="atcv-your-turn ${turnBg}">
          <span class="atcv-mic">🎤</span>
          <span class="atcv-turn-txt">Speak your transmission, then click Continue</span>
          <button class="atcv-hint-btn" onclick="window._atcvHint(${idx})">💡 Hint</button>
          <button class="atcv-cont-btn" onclick="window._atcvNext(${idx})">✓ Continue</button>
        </div>
        <div class="atcv-hint-reveal" id="atcv-hint-${idx}">${t.text.replace(/\n/g,'<br>')}</div>
      </div>`;
    }
  });

  /* Restart + Full answer at bottom */
  html+=`
  <button class="atcv-restart-btn" onclick="window._atcvRestart()">↺ Restart Exchange</button>
  <button class="atcv-full-reveal-btn" onclick="window._atcvFullReveal()">▼ Show Full Answer</button>
  <div class="atcv-full-answer" id="atcv-full-ans"></div>
  </div>`;

  wrap.innerHTML=html;

  /* Auto-play first ATC if scenario starts with ATC */
  if(transmissions[0] && transmissions[0].who==='atc'){
    setTimeout(()=>{
      const btn=document.getElementById('atcv-pb-0');
      speakPhonetic(transmissions[0].text, btn, null);
    }, 400);
  }

  /* Expose functions */
  window._atcvPlay    = playStep;
  window._atcvNext    = nextStep;
  window._atcvHint    = toggleHint;
  window._atcvRestart = buildFlow;
  window._atcvFullReveal = fullReveal;
}

function playStep(idx, text){
  const decoded = text.replace(/&#96;/g,'`').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
  const btn = document.getElementById(`atcv-pb-${idx}`);
  if(btn && btn.classList.contains('atcv-speaking')){ stopSpeech(); return; }
  speakPhonetic(decoded, btn, null);
}

function nextStep(idx){
  stopSpeech();

  /* Mark current step done */
  const cur = document.getElementById(`atcv-step-${idx}`);
  if(cur){
    cur.classList.remove('atcv-active');
    cur.classList.add('atcv-done');
    const head = cur.querySelector('[class*="-head"]');
    if(head && !head.querySelector('.atcv-done-tick')){
      const tick=document.createElement('div');
      tick.className='atcv-done-tick'; tick.textContent='✓';
      head.appendChild(tick);
    }
  }

  /* Activate next step */
  const next = document.getElementById(`atcv-step-${idx+1}`);
  if(next){
    next.classList.remove('atcv-future');
    next.classList.add('atcv-active');
    next.scrollIntoView({behavior:'smooth', block:'nearest'});

    /* If next is ATC → auto-play */
    const cp = typeof window.cp!=='undefined'?window.cp:0;
    const cs = typeof window.cs!=='undefined'?window.cs:0;
    if(typeof papers!=='undefined' && papers[cp] && papers[cp].scenarios[cs]){
      const t = papers[cp].scenarios[cs].answer.transmissions[idx+1];
      if(t && t.who==='atc'){
        setTimeout(()=>{
          const btn=document.getElementById(`atcv-pb-${idx+1}`);
          speakPhonetic(t.text, btn, null);
        }, 400);
      }
    }
  }
}

function toggleHint(idx){
  const h=document.getElementById(`atcv-hint-${idx}`);
  if(!h) return;
  const vis=h.classList.toggle('atcv-vis');
  const card=document.getElementById(`atcv-step-${idx}`);
  if(card){
    const btn=card.querySelector('.atcv-hint-btn');
    if(btn) btn.textContent=vis?'🙈 Hide':'💡 Hint';
  }
}

function fullReveal(){
  const cp=typeof window.cp!=='undefined'?window.cp:0;
  const cs=typeof window.cs!=='undefined'?window.cs:0;
  if(typeof papers==='undefined'||!papers[cp]||!papers[cp].scenarios[cs]) return;

  const s=papers[cp].scenarios[cs];
  const trs=s.answer?s.answer.transmissions:[];
  const map={
    pilot:   ['#08182a','#4a8fff','✈ Pilot'],
    atc:     ['#180d00','#ff8800','📻 ATC'],
    readback:['#06101c','#4a7ab0','↺ Readback']
  };

  const box=document.getElementById('atcv-full-ans');
  if(!box) return;

  if(box.classList.contains('atcv-vis')){
    box.classList.remove('atcv-vis');
    box.innerHTML='';
    const btn=box.previousElementSibling;
    if(btn) btn.textContent='▼ Show Full Answer';
    return;
  }

  box.innerHTML=trs.map(t=>{
    const[bg,bdr,lbl]=map[t.who]||['#08182a','#4a8fff','Pilot'];
    return `<div style="background:${bg};border-left:3px solid ${bdr};border-radius:6px;padding:10px 13px;margin-bottom:8px;font-size:12px;font-weight:600;color:#c8d8f0;white-space:pre-line;line-height:1.65">
      <div style="font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${bdr};margin-bottom:4px">${lbl}</div>
      ${t.text}
    </div>`;
  }).join('');
  box.classList.add('atcv-vis');
  const btn=box.previousElementSibling;
  if(btn) btn.textContent='▲ Hide Full Answer';
}

})();
