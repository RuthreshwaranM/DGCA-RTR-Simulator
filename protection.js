/* ============================================================
   PROTECTION.JS — RTR Simulator Complete Security Shield
   Desktop + Mobile Protection
   ============================================================
   HOW TO USE:
   Add this ONE line inside <head> of every paper HTML file:
   <script src="../protection.js"></script>

   For index.html (root level):
   <script src="protection.js"></script>
   ============================================================ */

(function(){
'use strict';

/* ── CONFIG ── */
const EJS_SERVICE  = "service_w1ep6lz";
const EJS_TEMPLATE = "template_o9w21fv";
const EJS_KEY      = "28GA_rndKYplQYqPZ";
const COOLDOWN_MS  = 15000; /* 15 sec between same alert type */

/* ── DETECT MOBILE ── */
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || window.innerWidth <= 768;

/* ── GET STUDENT INFO ── */
function getStudent(){
  try{
    const d = JSON.parse(sessionStorage.getItem('rtr_auth')||'{}');
    return { name: d.name||'Unknown', userId: d.userId||'Unknown' };
  }catch(e){ return { name:'Unknown', userId:'Unknown' }; }
}

/* ── THROTTLE — prevent email spam ── */
const lastAlerted = {};
function canAlert(type){
  const now = Date.now();
  if(!lastAlerted[type] || now - lastAlerted[type] > COOLDOWN_MS){
    lastAlerted[type] = now; return true;
  }
  return false;
}

/* ── SEND ALERT EMAIL ── */
async function sendAlert(activity){
  if(!canAlert(activity)) return;
  const s = getStudent();
  const now = new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}) + ' IST';
  const page = window.location.pathname;
  const device = isMobile ? '📱 Mobile' : '💻 Desktop';
  try{
    await fetch('https://api.emailjs.com/api/v1.0/email/send',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        service_id:  EJS_SERVICE,
        template_id: EJS_TEMPLATE,
        user_id:     EJS_KEY,
        template_params:{
          student_name:  `⚠️ ALERT: ${s.name}`,
          student_phone: s.userId,
          student_email: activity,
          student_id:    `${s.userId} | ${device}`,
          login_time:    `${now} | Page: ${page}`
        }
      })
    });
  }catch(e){ console.warn('Alert error',e); }
}

/* ── WARNING POPUP ── */
function showWarning(msg){
  let ov = document.getElementById('rtr-warn-ov');
  if(ov){ document.getElementById('rtr-warn-msg').textContent=msg; return; }
  ov = document.createElement('div');
  ov.id = 'rtr-warn-ov';
  ov.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.93);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif';
  ov.innerHTML=`
    <div style="background:#0d1428;border:2px solid #ff4444;border-radius:16px;padding:36px 32px;max-width:380px;width:90%;text-align:center;box-shadow:0 0 60px rgba(255,68,68,0.3)">
      <div style="font-size:44px;margin-bottom:14px">⚠️</div>
      <div style="font-size:17px;font-weight:800;color:#ff4444;margin-bottom:10px;letter-spacing:1px">SECURITY ALERT</div>
      <div id="rtr-warn-msg" style="font-size:12px;color:#c8d8f0;line-height:1.7;margin-bottom:16px">${msg}</div>
      <div style="font-size:11px;color:#4a6a8a;margin-bottom:20px;line-height:1.6">
        This activity has been logged and reported<br>to your instructor automatically.
      </div>
      <button id="rtr-warn-ok" style="padding:10px 28px;background:#1a3a6a;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:1px;text-transform:uppercase">
        I Understand
      </button>
    </div>`;
  document.body.appendChild(ov);
  document.getElementById('rtr-warn-ok').onclick=()=>ov.remove();
}

/* ── BLUR OVERLAY ── */
function showBlur(){
  if(document.getElementById('rtr-blur-ov')) return;
  const bl = document.createElement('div');
  bl.id='rtr-blur-ov';
  bl.style.cssText='position:fixed;inset:0;z-index:999998;background:rgba(5,10,20,0.97);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)';
  bl.innerHTML=`
    <div style="text-align:center;color:#4a6a8a">
      <div style="font-size:36px;margin-bottom:14px">🔒</div>
      <div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#2a4a6a">Content Hidden</div>
      <div style="font-size:11px;margin-top:8px;color:#1a3050">${isMobile?'Tap':'Click'} to continue</div>
    </div>`;
  bl.onclick=()=>bl.remove();
  document.body.appendChild(bl);
}
function hideBlur(){
  const bl=document.getElementById('rtr-blur-ov');
  if(bl) bl.remove();
}

/* ══════════════════════════════════════════
   DESKTOP PROTECTIONS
══════════════════════════════════════════ */
if(!isMobile){

  /* DevTools detection */
  let devOpen=false;
  function checkDevTools(){
    const w=window.outerWidth-window.innerWidth>160;
    const h=window.outerHeight-window.innerHeight>160;
    if((w||h)&&!devOpen){
      devOpen=true;
      showWarning('Developer Tools detected. This activity has been reported.');
      sendAlert('Opened Developer Tools (F12/Inspect)');
      const c=document.getElementById('grid')||document.getElementById('main')||document.getElementById('wrap')||document.body;
      if(c) c.style.filter='blur(20px)';
    }
    if(!w&&!h&&devOpen){
      devOpen=false;
      const c=document.getElementById('grid')||document.getElementById('main')||document.getElementById('wrap')||document.body;
      if(c) c.style.filter='';
    }
  }
  setInterval(checkDevTools,1000);

  /* Keyboard protection */
  document.addEventListener('keydown',function(e){
    const k=e.key?e.key.toLowerCase():'';
    const ctrl=e.ctrlKey||e.metaKey;
    const shift=e.shiftKey;

    /* PrintScreen */
    if(k==='printscreen'||k==='prtscn'){
      e.preventDefault();
      showWarning('Screenshot attempt detected and reported to your instructor.');
      sendAlert('Pressed PrintScreen (Screenshot attempt)');
      try{ navigator.clipboard.writeText(''); }catch(err){}
      return false;
    }
    /* Ctrl+U */
    if(ctrl&&k==='u'){ e.preventDefault(); showWarning('View Source is disabled.'); sendAlert('Ctrl+U (View Source)'); return false; }
    /* Ctrl+S */
    if(ctrl&&k==='s'){ e.preventDefault(); showWarning('Saving pages is disabled.'); sendAlert('Ctrl+S (Save Page)'); return false; }
    /* Ctrl+P */
    if(ctrl&&k==='p'){ e.preventDefault(); showWarning('Printing is disabled.'); sendAlert('Ctrl+P (Print attempt)'); return false; }
    /* F12 */
    if(k==='f12'){ e.preventDefault(); showWarning('Developer Tools is disabled.'); sendAlert('F12 (DevTools)'); return false; }
    /* Ctrl+Shift+I */
    if(ctrl&&shift&&k==='i'){ e.preventDefault(); showWarning('Developer Tools is disabled.'); sendAlert('Ctrl+Shift+I (DevTools)'); return false; }
    /* Ctrl+Shift+J */
    if(ctrl&&shift&&k==='j'){ e.preventDefault(); sendAlert('Ctrl+Shift+J (Console)'); return false; }
    /* Ctrl+Shift+C */
    if(ctrl&&shift&&k==='c'){ e.preventDefault(); sendAlert('Ctrl+Shift+C (Inspect Element)'); return false; }
    /* Ctrl+Shift+S */
    if(ctrl&&shift&&k==='s'){ e.preventDefault(); sendAlert('Ctrl+Shift+S (Screenshot attempt)'); return false; }
    /* Ctrl+A */
    if(ctrl&&k==='a'){ e.preventDefault(); return false; }
    /* Ctrl+C */
    if(ctrl&&k==='c'){ e.preventDefault(); sendAlert('Ctrl+C (Copy attempt)'); return false; }
  },true);

  /* Right click */
  document.addEventListener('contextmenu',function(e){
    e.preventDefault(); sendAlert('Right-click (Context menu)'); return false;
  },true);

  /* Print */
  window.addEventListener('beforeprint',function(){
    showWarning('Printing is disabled.');
    sendAlert('Print dialog opened');
    document.body.style.filter='blur(30px)';
    setTimeout(()=>{ document.body.style.filter=''; },3000);
  });

  /* Console warning */
  console.clear();
  console.log('%c⚠ STOP!','color:red;font-size:48px;font-weight:900');
  console.log('%cThis is a browser developer tool.\nIf someone told you to paste something here,\nthey are trying to hack your account.','color:#ff4444;font-size:14px;font-weight:bold');

}

/* ══════════════════════════════════════════
   MOBILE PROTECTIONS
══════════════════════════════════════════ */
if(isMobile){

  /* Long press disable — stops Save Image, Copy text popup */
  let longPressTimer;
  document.addEventListener('touchstart',function(e){
    longPressTimer = setTimeout(function(){
      sendAlert('Long press detected (possible Save/Copy attempt) on Mobile');
    }, 600);
  },{ passive:true });
  document.addEventListener('touchend',function(){
    clearTimeout(longPressTimer);
  },{ passive:true });
  document.addEventListener('touchmove',function(){
    clearTimeout(longPressTimer);
  },{ passive:true });

  /* Prevent context menu on mobile (long press menu) */
  document.addEventListener('contextmenu',function(e){
    e.preventDefault();
    sendAlert('Long press menu attempt on Mobile');
    return false;
  },true);

  /* Orientation change — possible screen recording indicator */
  let orientationCount = 0;
  window.addEventListener('orientationchange',function(){
    orientationCount++;
    if(orientationCount > 2){
      sendAlert(`Repeated orientation changes on Mobile (possible screen recording) — ${orientationCount} times`);
    }
    showBlur();
    setTimeout(hideBlur, 1500);
  });

  /* Mobile screenshot detection via visibility */
  /* Some Android browsers briefly hide page during screenshot */
  let lastVisible = Date.now();
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){
      lastVisible = Date.now();
      showBlur();
      sendAlert('App switched / Screen possibly captured on Mobile');
    } else {
      const diff = Date.now() - lastVisible;
      /* Very brief hide (< 2 sec) often indicates screenshot */
      if(diff < 2000 && diff > 0){
        sendAlert(`Possible screenshot on Mobile (screen hidden for ${diff}ms)`);
      }
      hideBlur();
    }
  });

  /* Disable zoom (prevents zoom-in to read content better) */
  document.addEventListener('touchstart',function(e){
    if(e.touches.length > 1){
      e.preventDefault();
    }
  },{ passive:false });

  let lastTouchEnd = 0;
  document.addEventListener('touchend',function(e){
    const now = Date.now();
    if(now - lastTouchEnd <= 300){
      e.preventDefault(); /* disable double-tap zoom */
    }
    lastTouchEnd = now;
  },false);

}

/* ══════════════════════════════════════════
   COMMON — DESKTOP + MOBILE
══════════════════════════════════════════ */

/* Tab switch / minimise */
document.addEventListener('visibilitychange',function(){
  if(!isMobile){ /* mobile handles separately above */
    if(document.hidden){
      showBlur();
      sendAlert('Switched tab or minimised window');
    } else {
      hideBlur();
    }
  }
});

/* Text selection disable */
document.addEventListener('selectstart',function(e){ e.preventDefault(); return false; },true);
document.addEventListener('copy',function(e){ e.preventDefault(); sendAlert('Tried to Copy content'); return false; },true);

/* Drag disable */
document.addEventListener('dragstart',function(e){ e.preventDefault(); return false; },true);

/* CSS protection */
const style = document.createElement('style');
style.textContent=`
  *{
    -webkit-user-select:none!important;
    -moz-user-select:none!important;
    -ms-user-select:none!important;
    user-select:none!important;
    -webkit-touch-callout:none!important;
  }
  img{
    -webkit-user-drag:none!important;
    pointer-events:none!important;
  }
  @media print{
    body *{visibility:hidden!important}
    body::after{
      content:'PRINTING NOT ALLOWED — DGCA RTR SIMULATOR';
      visibility:visible!important;
      position:fixed;top:50%;left:50%;
      transform:translate(-50%,-50%);
      font-size:24px;color:red;font-weight:bold;
    }
  }
`;
document.head.appendChild(style);

/* ── DIAGONAL WATERMARK (harder to crop out) ── */
function addWatermark(){
  const s = getStudent();
  const existing = document.getElementById('rtr-wm-canvas');
  if(existing) existing.remove();

  /* Bottom watermark */
  const wm = document.createElement('div');
  wm.id='rtr-wm-canvas';
  wm.style.cssText='position:fixed;bottom:6px;left:50%;transform:translateX(-50%);font-size:9px;color:rgba(100,150,200,0.18);letter-spacing:2px;text-transform:uppercase;pointer-events:none;z-index:99990;white-space:nowrap;font-family:Arial,sans-serif;user-select:none';
  wm.textContent=`${s.name} | ${s.userId} | DGCA RTR SIMULATOR`;
  document.body.appendChild(wm);

  /* Corner watermarks — harder to crop */
  const corners=[
    'top:8px;left:8px;',
    'top:8px;right:8px;',
    'bottom:8px;left:8px;',
    'bottom:8px;right:8px;'
  ];
  corners.forEach((pos,i)=>{
    const c=document.createElement('div');
    c.style.cssText=`position:fixed;${pos}font-size:8px;color:rgba(100,150,200,0.12);letter-spacing:1px;text-transform:uppercase;pointer-events:none;z-index:99990;white-space:nowrap;font-family:Arial,sans-serif;user-select:none`;
    c.textContent=`${s.userId}`;
    document.body.appendChild(c);
  });
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',addWatermark);
}else{
  addWatermark();
}

})();
