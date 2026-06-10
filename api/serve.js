/* ================================================================
   api/serve.js  — Vercel Serverless Function
   Serves every page (login / home / paper) from the SERVER.
   No .html files are ever accessed directly by the browser.
   Ctrl+U on any page shows nothing — the page is generated here.
   ================================================================ */

/* ── PAPERS LIST — add / remove papers here ─────────────────────
   name:   card label shown on homepage
   id:     internal key used in URL  ?paper=VT-KNT
   ──────────────────────────────────────────────────────────────── */
const PAPERS = [
  { name: "VT-KNT",  id: "VT-KNT"  },
  { name: "AI-321",  id: "AI-321"  },
  { name: "VT-EJT",  id: "VT-EJT"  },
  { name: "AI-239",  id: "AI-239"  },
  { name: "VT-ITM",  id: "VT-ITM"  },
  { name: "SEJ-993", id: "SEJ-993" },
  { name: "IGO-153", id: "IGO-153" },
  { name: "QP-142", id: "QP-142" },
];

/* ── PAPER DATA ─────────────────────────────────────────────────
   All question paper data lives here on the server.
   Add each paper as a key matching the "id" above.
   ──────────────────────────────────────────────────────────────── */
const PAPER_DATA = {

  "VT-KNT": {
    title: "VT-KNT",
    acIdent: "VT-KNT", acType: "ATR 72",
    dep: "VABP (Bhopal)", dest: "VECC (Kolkata)",
    flightLevel: "FL 210", pob: "47", squawk: "4312",
    route: "A 791", runway: "27", taxiway: "D, E",
    stand: "01", alternate: "VAJB (Jabalpur)",
    metar: "VABP 091230Z WIND 300/10KT VIS 6000M NSW FEW020 SCT100 TEMP 22 DEWPT 14 QNH 1012 HPA",
    notam: "• Nagpur Arrival: 125.1",
    atcFreqs: [
      { group: "VABP (Bhopal)",       rows: [{ lbl:"Ground",  freq:"118.05"  }, { lbl:"Tower",   freq:"118.550" }] },
      { group: "VECC (Kolkata)",       rows: [{ lbl:"Control", freq:"126.40" }] },
      { group: "VAJB (Jabalpur) Altn", rows: [{ lbl:"Tower",   freq:"118.3"  }] },
    ],
    scenarios: [
      {
        qns: "SCENARIO 1a: Transmit the following phrases:\n(i) Ignore\n(ii) I repeat for clarity\n(iii) I wish to obtain...\n(iv) Squawk 2000\n(v) Heading 100 degrees",
        answer: [
          { who:"pilot",    text:"(i) Ignore  →  DISREGARD" },
          { who:"pilot",    text:"(ii) I repeat for clarity  →  I SAY AGAIN" },
          { who:"pilot",    text:"(iii) I wish to obtain  →  REQUEST" },
          { who:"pilot",    text:"(iv) Squawk 2000  →  SQUAWK TWO THOUSAND" },
          { who:"pilot",    text:"(v) Heading 100 degrees  →  HEADING ONE ZERO ZERO" },
        ]
      },
      {
        qns: "SCENARIO 1b: You are at Stand 1. Request ATC clearance, pushback and start.\n(ATIS: Information Hotel, QNH 1012)",
        answer: [
          { who:"pilot",    text:"Bhopal Ground, VT-KNT, stand One, information Hotel, QNH One Zero One Two, IFR to Kolkata, request ATC clearance and start up." },
          { who:"atc",      text:"VT-KNT, cleared to Kolkata via flight planned route, Flight Level Two One Zero, squawk Four Three One Two. Start-up approved, face East." },
          { who:"readback", text:"Cleared to Kolkata via flight planned route, Flight Level Two One Zero, squawk Four Three One Two. Start-up approved, face East. VT-KNT." },
        ]
      },
      {
        qns: "SCENARIO 2a: Request Taxi Clearance.",
        answer: [
          { who:"pilot",    text:"Bhopal Ground, VT-KNT, persons on board Four Seven, security check complete, request taxi." },
          { who:"atc",      text:"VT-KNT, taxi via Delta and Echo, hold short Runway Two Seven." },
          { who:"readback", text:"Taxi via Delta and Echo, hold short Runway Two Seven. VT-KNT." },
        ]
      },
      {
        qns: "SCENARIO 2b: Holding short Runway 27. AI-321 on finals. Request line-up and departure.",
        answer: [
          { who:"pilot",    text:"Bhopal Tower, VT-KNT at holding point Runway Two Seven. AI Three Two One on finals in sight. Request line up and wait." },
          { who:"atc",      text:"VT-KNT, behind AI Three Two One on final, line up behind and wait, Runway Two Seven." },
          { who:"readback", text:"Behind AI Three Two One on final, line up behind and wait, Runway Two Seven. VT-KNT." },
        ]
      },
      {
        qns: "SCENARIO 3: Report position over JJB VOR. Request FL230 due light turbulence.\n(Time: 1430, FL210, estimating IBUDA at 45, ARIVO next)",
        answer: [
          { who:"pilot",    text:"Nagpur Approach, VT-KNT, over Juliette Juliette Bravo VOR at One Four Three Zero, FL Two One Zero, estimating IBUDA at Four Five, ARIVO next. Request FL Two Three Zero due light turbulence." },
          { who:"atc",      text:"VT-KNT, maintain FL Two One Zero due traffic, report IBUDA." },
          { who:"readback", text:"Maintain FL Two One Zero, will report IBUDA. VT-KNT." },
        ]
      },
      {
        qns: "SCENARIO 4: 80 NM outbound JJB VOR — abnormal engine vibrations. Declare urgency. Divert to Jabalpur.\n(POB 47, Endurance 3 hrs, ETA JJB 1316)",
        answer: [
          { who:"pilot",    text:"PAN PAN. PAN PAN. PAN PAN.\nNagpur Approach, VT-KNT, position Eight Zero DME radial Zero Nine Two outbound JJB VOR, FL Two One Zero. Abnormal vibrations, diverting to Jabalpur. POB Four Seven. Endurance Three Hours. ETA Jabalpur One Three One Six." },
          { who:"atc",      text:"VT-KNT, roger PAN PAN. Descend FL One Two Zero, cleared direct Jabalpur." },
          { who:"readback", text:"Descend FL One Two Zero, cleared direct Jabalpur. VT-KNT." },
        ]
      },
    ]
  },

  /* ── Add more papers below in the same format ── */

  "AI-321": {
    title: "AI-321 / VT-NMS",
    acIdent: "VT-NMS", acType: "A320",
    dep: "VAAU (Aurangabad)", dest: "VABB (Mumbai)",
    flightLevel: "FL 180", pob: "165", squawk: "2315",
    route: "W 45", runway: "24", taxiway: "A, B",
    stand: "03", alternate: "VAJB (Jabalpur)",
    metar: "VAAU 091200Z WIND 240/08KT VIS 8000M FEW015 TEMP 28 DEWPT 18 QNH 1010 HPA",
    notam: "NIL",
    atcFreqs: [
      { group: "VAAU (Aurangabad)", rows: [{ lbl:"Ground", freq:"121.7" }, { lbl:"Tower", freq:"118.1" }] },
      { group: "VABB (Mumbai)",     rows: [{ lbl:"Approach", freq:"119.4" }] },
    ],
    scenarios: [
      {
        qns: "SCENARIO 1: At Stand 3. Request clearance and startup.\n(ATIS: Info Alpha, QNH 1010)",
        answer: [
          { who:"pilot",    text:"Aurangabad Ground, VT-NMS, stand Three, information Alpha, QNH One Zero One Zero, IFR to Mumbai, request clearance and start up." },
          { who:"atc",      text:"VT-NMS, cleared to Mumbai via W Four Five, FL One Eight Zero, squawk Two Three One Five. Start up approved." },
          { who:"readback", text:"Cleared to Mumbai via W Four Five, FL One Eight Zero, squawk Two Three One Five. Start up approved. VT-NMS." },
        ]
      },
    ]
  },

};

/* ================================================================
   TOKEN VERIFICATION — checks the session token sent by browser
   ================================================================ */
function verifyToken(token) {
  try {
    const data = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    const fourHours = 4 * 60 * 60 * 1000;
    if (Date.now() - data.t > fourHours) return null;
    return data;
  } catch {
    return null;
  }
}

/* ================================================================
   MAIN HANDLER
   ================================================================ */
export default function handler(req, res) {
  const { page, paper: paperId } = req.query;

  /* ── LOGIN PAGE ── */
  if (page === "login") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(buildLoginPage());
  }

  /* ── HOME PAGE (paper list) — requires valid token ── */
  if (page === "home") {
    const token = req.query.token || req.headers["x-rtr-token"];
    const user  = token ? verifyToken(token) : null;
    /* Token passed in URL → strip it, store in sessionStorage, redirect clean */
    if (req.query.token) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(`<!DOCTYPE html><html><head><script>
        sessionStorage.setItem('rtr_token','${token}');
        sessionStorage.setItem('rtr_name','${user?.name||""}');
        sessionStorage.setItem('rtr_userId','${user?.userId||""}');
        window.location.replace('/simulator');
      </script></head><body></body></html>`);
    }
    if (!user) {
      return res.status(302).setHeader("Location", "/").end();
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(buildHomePage(user));
  }

  /* ── PAPER PAGE — requires valid token + valid paper ID ── */
  if (page === "paper") {
    const token = req.query.token;
    const user  = token ? verifyToken(token) : null;
    if (!user) return res.status(302).setHeader("Location", "/").end();
    const data  = paperId ? PAPER_DATA[paperId] : null;
    if (!data)  return res.status(302).setHeader("Location", "/simulator").end();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(buildPaperPage(user, paperId, data));
  }

  res.status(404).send("Not found");
}

/* ================================================================
   PAGE BUILDERS — HTML generated server-side
   ================================================================ */

function buildLoginPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DGCA RTR Simulator — Login</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:'Segoe UI',Arial,sans-serif;background:#070a14;display:flex;align-items:center;justify-content:center;min-height:100vh}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 25% 40%,rgba(26,58,106,.35) 0%,transparent 55%),radial-gradient(ellipse at 75% 60%,rgba(255,107,53,.07) 0%,transparent 50%);pointer-events:none}
.card{background:#0c1120;border:1px solid #1a2a4a;border-radius:18px;padding:44px 40px 36px;width:100%;max-width:420px;position:relative;box-shadow:0 32px 80px rgba(0,0,0,.6);animation:fadeUp .4s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#1a3a6a,#4a8fff 50%,#ff6b35);border-radius:18px 18px 0 0}
.logo{text-align:center;margin-bottom:26px}
.logo-t{font-size:11px;font-weight:800;color:#4a8fff;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px}
.logo-t em{color:#ff6b35;font-style:normal}
.logo-s{font-size:10px;color:#2a4a6a;letter-spacing:1.5px;text-transform:uppercase}
.title{font-size:20px;font-weight:900;color:#c8d8f0;text-align:center;margin-bottom:6px;line-height:1.3}
.title span{color:#ff6b35}
.sub{font-size:11px;color:#3a5878;text-align:center;margin-bottom:26px;line-height:1.6}
.divider{width:44px;height:2px;background:linear-gradient(90deg,#1a3a6a,#4a8fff);border-radius:2px;margin:0 auto 26px}
.fg{margin-bottom:15px}
.fg label{display:block;font-size:9px;font-weight:700;color:#3a5878;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:7px}
.iw{position:relative}
.iw .ic{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:14px;opacity:.45;pointer-events:none}
.fg input{width:100%;padding:11px 14px 11px 38px;background:#080d1c;border:1px solid #1a2a4a;border-radius:8px;font-size:13px;color:#c8d8f0;outline:none;transition:border-color .2s,box-shadow .2s}
.fg input:focus{border-color:#4a8fff;box-shadow:0 0 0 3px rgba(74,143,255,.1)}
.fg input::placeholder{color:#1e3050;font-size:12px}
#login-btn{width:100%;padding:13px;background:linear-gradient(135deg,#1a3a6a,#2a5aaa);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:1px;text-transform:uppercase;transition:all .2s;margin-top:6px}
#login-btn:hover{filter:brightness(1.15);transform:translateY(-1px);box-shadow:0 6px 20px rgba(26,58,106,.4)}
#login-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;filter:none}
.btn-inner{display:flex;align-items:center;justify-content:center;gap:10px;height:20px}
.btn-spin{display:none;width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.loading .btn-text{display:none}
.loading .btn-spin{display:block}
#msg{display:none;border-radius:6px;padding:10px 14px;font-size:12px;text-align:center;margin-top:14px}
#msg.error{background:rgba(255,60,60,.08);border:1px solid rgba(255,60,60,.2);color:#ff7070}
#msg.ok{background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.2);color:#00cc88}
.foot{margin-top:22px;padding-top:18px;border-top:1px solid #0e1830;text-align:center;font-size:9px;color:#162030;letter-spacing:1px;text-transform:uppercase}
</style>
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
<script>emailjs.init("28GA_rndKYplQYqPZ");</script>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-t">DGCA <em>RTR(A)</em> Simulator</div>
    <div class="logo-s">Radio Telephony Practice</div>
  </div>
  <div class="title">Welcome,<br><span>Student Login</span></div>
  <div class="sub">Enter your credentials to access<br>the RTR Practice Simulator</div>
  <div class="divider"></div>
  <div class="fg">
    <label>Full Name</label>
    <div class="iw"><span class="ic">👤</span>
      <input type="text" id="n" placeholder="Enter your full name" autocomplete="off">
    </div>
  </div>
  <div class="fg">
    <label>User ID</label>
    <div class="iw"><span class="ic">🪪</span>
      <input type="text" id="u" placeholder="e.g. CRW-001" autocomplete="off" style="text-transform:uppercase">
    </div>
  </div>
  <div class="fg">
    <label>Password</label>
    <div class="iw"><span class="ic">🔒</span>
      <input type="password" id="p" placeholder="Enter your password" autocomplete="off">
    </div>
  </div>
  <button id="login-btn" onclick="go()">
    <div class="btn-inner">
      <span class="btn-text">Login →</span>
      <div class="btn-spin"></div>
    </div>
  </button>
  <div id="msg"></div>
  <div class="foot">For Training Use Only · Captain Romeo Whisky</div>
</div>
<script>
document.addEventListener('keydown', e => { if(e.key==='Enter') go(); });
async function go(){
  const name=document.getElementById('n').value.trim();
  const userId=document.getElementById('u').value.trim().toUpperCase();
  const password=document.getElementById('p').value.trim();
  setMsg('','');
  if(!name||!userId||!password){setMsg('Please fill in all fields.','error');return;}
  setLoading(true);
  try{
    const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,userId,password})});
    const d=await r.json();
    if(d.success){
      setMsg('Access granted! Loading...','ok');
      sessionStorage.setItem('rtr_token', d.token);
      sessionStorage.setItem('rtr_name',  d.name);
      sessionStorage.setItem('rtr_userId',d.userId);
      try{
        const now=new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST";
        emailjs.send("service_w1ep6lz","template_o9w21fv",{
          student_name:  d.name,
          student_phone: d.userId,
          student_email: "Password Login",
          student_id:    d.userId,
          login_time:    now
        });
      }catch(err){ console.warn("EmailJS error:",err); }
      setTimeout(()=>{ window.location.href='/simulator'; },700);
    }else{
      setLoading(false);
      setMsg('Invalid credentials. Check your Name, User ID and Password.','error');
    }
  }catch(e){
    setLoading(false);
    setMsg('Connection error. Please try again.','error');
  }
}
function setMsg(t,c){const el=document.getElementById('msg');el.textContent=t;el.className=c;el.style.display=t?'block':'none';}
function setLoading(on){const b=document.getElementById('login-btn');b.disabled=on;b.classList.toggle('loading',on);}
</script>
</body>
</html>`;
}

/* ── HOME PAGE ── */
function buildHomePage(user) {
  const cards = PAPERS.map(p => `
    <div class="card" onclick="openPaper('${p.id}')">
      <div class="card-icon">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <rect x="3" y="2" width="20" height="22" rx="3" stroke="#4a8fff" stroke-width="1.5"/>
          <path d="M7 8h12M7 12h12M7 16h8" stroke="#4a8fff" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="card-name">${p.name}</div>
      <div class="card-open">Open Paper →</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DGCA RTR Practice Simulator</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{min-height:100vh;font-family:'Segoe UI',Arial,sans-serif;background:#080c18;color:#c8d8f0}
#topbar{background:#060a18;border-bottom:2px solid #1a2a4a;display:flex;align-items:center;padding:0 24px;height:50px;position:sticky;top:0;z-index:100}
.logo{font-size:13px;font-weight:800;color:#c8d8f0;letter-spacing:2px;text-transform:uppercase}
.logo em{color:#ff6b35;font-style:normal}
.tr{margin-left:auto;display:flex;align-items:center;gap:10px}
.badge{background:#0a1530;border:1px solid #1a2a4a;border-radius:6px;padding:3px 10px;font-size:10px;font-weight:700;color:#4a8fff;letter-spacing:1px}
.uname{font-size:11px;color:#c8d8f0;font-weight:600}
#so-btn{padding:4px 10px;font-size:10px;font-weight:700;border:1px solid rgba(255,100,100,.4);background:rgba(255,50,50,.1);color:#ff8888;border-radius:3px;cursor:pointer;letter-spacing:.5px;text-transform:uppercase}
#so-btn:hover{background:rgba(255,50,50,.2)}
#hero{text-align:center;padding:52px 24px 36px;border-bottom:1px solid #1a2a4a}
.ht{font-size:clamp(18px,3vw,28px);font-weight:900;color:#d0e4ff;letter-spacing:2px;text-transform:uppercase;line-height:1.3;margin-bottom:10px}
.ht span{color:#ff6b35}
.hs{font-size:13px;color:#4a7aaa;letter-spacing:1px;font-weight:500;margin-bottom:20px}
.hd{width:60px;height:3px;background:linear-gradient(90deg,#4a8fff,#ff6b35);border-radius:2px;margin:0 auto}
#content{max-width:960px;margin:0 auto;padding:36px 24px 60px}
.sh{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.st{font-size:11px;font-weight:800;color:#4a6a8a;letter-spacing:2.5px;text-transform:uppercase}
.sl{flex:1;height:1px;background:#1a2a4a}
.pc{background:#1a3060;color:#4a8fff;font-size:10px;font-weight:800;padding:2px 9px;border-radius:10px;letter-spacing:1px}
#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.card{background:#0d1428;border:1px solid #1a2a4a;border-radius:10px;padding:28px 20px 24px;cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#4a8fff,#ff6b35);opacity:0;transition:opacity .2s}
.card:hover{background:#131e38;border-color:#4a8fff;transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
.card:hover::before{opacity:1}
.card-icon{width:52px;height:52px;background:#0a1530;border:1px solid #1a2a4a;border-radius:12px;display:flex;align-items:center;justify-content:center;transition:all .2s}
.card:hover .card-icon{background:#4a8fff}
.card-name{font-size:16px;font-weight:900;color:#c8d8f0;letter-spacing:1px;text-transform:uppercase}
.card-open{font-size:10px;font-weight:700;color:#4a8fff;letter-spacing:1px;text-transform:uppercase;opacity:0;transition:opacity .2s}
.card:hover .card-open{opacity:1}
#footer{text-align:center;padding:20px 24px;border-top:1px solid #1a2a4a;font-size:10px;color:#2a4a6a;letter-spacing:1px;text-transform:uppercase}
#wm{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);font-size:9px;color:rgba(100,150,200,.18);letter-spacing:2px;text-transform:uppercase;pointer-events:none;z-index:999;white-space:nowrap}
</style>
</head>
<body>
<div id="topbar">
  <div class="logo">DGCA <em>RTR(A)</em> Simulator</div>
  <div class="tr">
    <span class="uname" id="uname">${user.name}</span>
    <span class="badge" id="ubadge">${user.userId}</span>
    <button id="so-btn" onclick="signOut()">Sign Out</button>
  </div>
</div>
<div id="hero">
  <div class="ht">Welcome to <span>DGCA RTR</span><br>Practice Simulator</div>
  <div class="hs">Radio Telephony Practical Exam</div>
  <div class="hd"></div>
</div>
<div id="content">
  <div class="sh">
    <span class="st">Question Papers</span>
    <div class="sl"></div>
    <span class="pc">${PAPERS.length} Papers</span>
  </div>
  <div id="grid">${cards}</div>
</div>
<div id="footer">DGCA RTR(A) Practice Simulator &nbsp;|&nbsp; For Training Use Only</div>
<div id="wm">${user.name} | ${user.userId}</div>
<script>
/* guard — if no token, back to login */
const tok = sessionStorage.getItem('rtr_token');
if(!tok){ window.location.replace('/'); }

function openPaper(id){
  const tok=sessionStorage.getItem('rtr_token');
  window.location.href='/paper?paper='+id+'&token='+encodeURIComponent(tok);
}
function signOut(){
  sessionStorage.clear();
  window.location.replace('/');
}
</script>
</body>
</html>`;
}

/* ── PAPER PAGE ── */
function buildPaperPage(user, paperId, d) {
  const freqHtml = d.atcFreqs.map(g =>
    `<div class="fg">${g.group}</div>` +
    g.rows.map(r => `<div class="fr"><span class="fl">${r.lbl}</span><span class="fv">${r.freq}</span></div>`).join('')
  ).join('');

  const scenBtns = d.scenarios.map((_, i) =>
    `<div class="sn${i===0?' active':''}" onclick="loadS(${i})">${i+1}</div>`
  ).join('');

  /* Embed scenarios as JSON — minified, no readable questions in HTML source */
  const scenJson = JSON.stringify(d.scenarios);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DGCA RTR — ${d.title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#c8d4b0;color:#1a2410;height:100vh;overflow:hidden;display:flex;flex-direction:column}
#tb{background:#3a5020;border-bottom:3px solid #2a3c14;display:flex;align-items:center;padding:0 12px;height:40px;gap:6px;flex-shrink:0}
.lt{font-size:12px;font-weight:800;color:#e8f0d0;letter-spacing:2px;text-transform:uppercase}
.lt span{color:#f0d060}
.td{width:1px;height:18px;background:#5a7a38;margin:0 4px}
.pt{padding:5px 12px;font-size:10px;font-weight:700;color:#a8c880;cursor:pointer;border:1px solid transparent;border-radius:3px;letter-spacing:.5px;text-transform:uppercase;transition:all .15s}
.pt.active{color:#fff;background:#5a7a30;border-color:#8aaa50}
.tbr{margin-left:auto;display:flex;align-items:center;gap:8px}
#timer{font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:#f0e860;letter-spacing:3px;min-width:72px}
#timer.warn{color:#ffa820}
#timer.danger{color:#ff4444;animation:blink .8s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.tb2{padding:3px 9px;font-size:9px;font-weight:700;border:1px solid #8aaa50;background:#4a6828;color:#d8f0a0;border-radius:3px;cursor:pointer;letter-spacing:.5px;text-transform:uppercase}
.tb2:hover{background:#5a7a38}
#hbtn{padding:3px 9px;font-size:9px;font-weight:700;border:1px solid #aaa850;background:#4a4828;color:#f0f0a0;border-radius:3px;cursor:pointer;letter-spacing:.5px;text-transform:uppercase;text-decoration:none}
#grid{flex:1;display:grid;grid-template-columns:55% 45%;grid-template-rows:48% 52%;min-height:0}
.panel{display:flex;flex-direction:column;border:2px solid #8aaa58;overflow:hidden}
.ptitle{background:#6a8a40;padding:7px 14px;font-size:12px;font-weight:800;letter-spacing:2px;color:#fff;text-transform:uppercase;text-align:center;border-bottom:2px solid #4a6a28;flex-shrink:0;text-shadow:0 1px 2px rgba(0,0,0,.4)}
/* chart */
#p-chart{grid-column:1;grid-row:1;background:#e8eedd}
#ctabs{display:flex;gap:2px;padding:5px 8px 0;background:#d8e4c4;border-bottom:2px solid #8aaa58;flex-shrink:0}
.ctab{padding:4px 12px;font-size:10px;font-weight:700;color:#5a7a38;cursor:pointer;border:1px solid transparent;border-bottom:none;border-radius:3px 3px 0 0;transition:all .12s;background:#c8d8b0}
.ctab.active{color:#1a2c08;background:#e8eedd;border-color:#8aaa58;font-weight:800}
#chartv{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#dde8cc;font-size:11px;color:#8aaa68;letter-spacing:1px}
/* flight info */
#p-info{grid-column:2;grid-row:1;background:#eef4e4}
#fi{flex:1;display:grid;grid-template-columns:1fr 1fr;padding:8px 12px;gap:4px 16px;overflow:hidden;align-content:space-around}
.frow{display:flex;flex-direction:column;border-bottom:1px solid #c0d0a0;padding:3px 0}
.flbl{font-family:'Arial Black',Arial,sans-serif;font-size:10px;font-weight:900;color:#3a5a20;text-transform:uppercase}
.fval{font-family:'Arial Black',Arial,sans-serif;font-size:12px;font-weight:900;color:#000}
/* questions */
#p-qns{grid-column:1;grid-row:2;background:#eaf0dc}
#snav{display:flex;align-items:center;gap:5px;padding:6px 10px;background:#d8e4c4;border-bottom:2px solid #8aaa58;flex-shrink:0;flex-wrap:wrap}
.sn{width:28px;height:28px;border-radius:3px;border:1px solid #9ab870;background:#c8d8b0;color:#4a6a28;font-size:10px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s}
.sn:hover{background:#b8cc98}
.sn.active{background:#5a7a30;border-color:#3a5a18;color:#fff}
.sn.done{background:#d8f0c8;border-color:#5aaa38;color:#2a6010}
#qctr{margin-left:auto;font-size:9px;color:#6a8a48;letter-spacing:1px;font-weight:700}
#qbody{flex:1;overflow-y:auto;padding:10px 12px}
.qbadge{display:inline-block;background:#6a8a40;border:1px solid #4a6a28;color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:3px;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
.qtxt{font-size:13px;color:#0a1804;line-height:1.8;font-weight:800;background:#f4f8ec;border:1px solid #b0c890;border-left:4px solid #5a8030;border-radius:0 5px 5px 0;padding:10px 12px;margin-bottom:10px;white-space:pre-line;text-shadow:0 0 1px rgba(10,24,4,.15)}
#rvbtn{padding:6px 14px;font-size:10px;font-weight:700;border:1px solid #5a8a38;background:#6a9a40;color:#fff;border-radius:3px;cursor:pointer;letter-spacing:1px;text-transform:uppercase;transition:all .15s;margin-bottom:10px}
#ansbox{display:none}
#ansbox.vis{display:block}
.ahdr{font-size:8px;font-weight:700;color:#3a6820;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px}
.tx{padding:7px 10px;border-radius:3px;font-size:12px;font-weight:800;line-height:1.6;margin-bottom:6px;color:#0a180a}
.txw{font-size:9px;font-weight:900;letter-spacing:1px;margin-bottom:2px;text-transform:uppercase}
.tx.pilot{background:#e0ecd0;border-left:3px solid #5a8a30}.tx.pilot .txw{color:#3a6820}
.tx.atc{background:#f8eed8;border-left:3px solid #c08020}.tx.atc .txw{color:#8a5800}
.tx.readback{background:#e8f4e0;border-left:3px solid #4a7a50}.tx.readback .txw{color:#2a5a30}
#qact{display:flex;gap:6px;padding:8px 10px;border-top:2px solid #8aaa58;background:#d8e4c4;flex-shrink:0}
.ab{padding:6px 14px;font-size:9px;font-weight:700;border-radius:3px;cursor:pointer;letter-spacing:.5px;text-transform:uppercase;transition:all .12s}
.abp{border:1px solid #8aaa58;background:#c0d0a0;color:#3a5020}.abp:hover{background:#b0c090}
.abn{border:1px solid #4a6a28;background:#5a7a30;color:#fff}.abn:hover{background:#4a6828}
.abd{border:1px solid #3a7020;background:#4a8828;color:#fff;margin-left:auto}.abd:hover{background:#3a7020}
/* freq/atis */
#p-br{grid-column:2;grid-row:2;background:#eef4e4;display:grid;grid-template-columns:1fr 1fr;overflow:hidden}
.brsub{display:flex;flex-direction:column;overflow:hidden}
#brf{border-right:2px solid #8aaa58}
.bst{background:#6a8a40;padding:6px 12px;font-size:10px;font-weight:800;letter-spacing:2px;color:#fff;text-transform:uppercase;text-align:center;border-bottom:2px solid #4a6a28;flex-shrink:0}
#fscroll{flex:1;overflow-y:auto;padding:6px 10px;background:#f0f6e8}
.fg{font-size:12px;font-weight:900;letter-spacing:1.5px;color:#5a3a10;text-transform:uppercase;padding:6px 0 2px;border-top:1px solid #b8cc98;margin-top:4px}
.fg:first-child{border-top:none;margin-top:0;padding-top:2px}
.fr{display:flex;justify-content:space-between;align-items:baseline;padding:4px 0;border-bottom:1px solid #ccd8b0}
.fl{font-size:11px;font-weight:900;color:#2a4a20;text-transform:uppercase;letter-spacing:.5px}
.fv{font-size:17px;font-weight:900;color:#0a2804;font-family:'Courier New',monospace;letter-spacing:1px}
#ascroll{flex:1;overflow-y:auto;padding:6px 10px;background:#f0f6e8}
.albl{font-size:12px;font-weight:900;letter-spacing:1.5px;color:#2a5a18;text-transform:uppercase;padding:5px 0 2px;border-top:1px solid #b8cc98;margin-top:4px}
.albl:first-child{border-top:none;margin-top:0;padding-top:2px}
#metar{font-family:'Arial Black',monospace;font-size:12px;font-weight:900;color:#0a1c06;line-height:1.8;word-break:break-word}
.nlbl{font-size:10px;font-weight:800;letter-spacing:1.5px;color:#7a4a08;text-transform:uppercase;padding:5px 0 2px;border-top:1px solid #b8cc98;margin-top:4px}
#notam{font-size:12px;font-weight:900;color:#4a2200;line-height:1.8;white-space:pre-line}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#d8e4c4}::-webkit-scrollbar-thumb{background:#8aaa58;border-radius:3px}
#wm{position:fixed;bottom:8px;left:50%;transform:translateX(-50%);font-size:9px;color:rgba(40,80,20,.2);letter-spacing:2px;text-transform:uppercase;pointer-events:none;z-index:9999;white-space:nowrap;font-family:Arial,sans-serif}
</style>
</head>
<body>
<div id="tb">
  <div class="lt">DGCA <span>RTR(A)</span> Simulator</div>
  <div class="td"></div>
  <div class="pt active">${d.title}</div>
  <div class="tbr">
    <span id="timer">30:00</span>
    <button class="tb2" onclick="startT()">▶ START</button>
    <button class="tb2" onclick="pauseT()">⏸ PAUSE</button>
    <button class="tb2" onclick="resetT()">↺ RESET</button>
    <div class="td"></div>
    <button id="hbtn" onclick="goHome()">← HOME</button>
  </div>
</div>
<div id="grid">
  <div class="panel" id="p-chart">
    <div class="ptitle">Charts &amp; Maps</div>
    <div id="ctabs"></div>
    <div id="chartv">PLACE CHART IMAGES IN SAME FOLDER</div>
  </div>
  <div class="panel" id="p-info">
    <div class="ptitle">Flight Info</div>
    <div id="fi">
      <div class="frow"><span class="flbl">A/C Ident</span>  <span class="fval">${d.acIdent}</span></div>
      <div class="frow"><span class="flbl">DEP</span>         <span class="fval">${d.dep}</span></div>
      <div class="frow"><span class="flbl">ATS Route</span>   <span class="fval">${d.route}</span></div>
      <div class="frow"><span class="flbl">RWY in Use</span>  <span class="fval">${d.runway}</span></div>
      <div class="frow"><span class="flbl">Flight Level</span><span class="fval">${d.flightLevel}</span></div>
      <div class="frow"><span class="flbl">POB</span>         <span class="fval">${d.pob}</span></div>
      <div class="frow"><span class="flbl">Type of A/C</span> <span class="fval">${d.acType}</span></div>
      <div class="frow"><span class="flbl">DEST</span>        <span class="fval">${d.dest}</span></div>
      <div class="frow"><span class="flbl">Stand No</span>    <span class="fval">${d.stand}</span></div>
      <div class="frow"><span class="flbl">Taxiway</span>     <span class="fval">${d.taxiway}</span></div>
      <div class="frow"><span class="flbl">Alternate</span>   <span class="fval">${d.alternate}</span></div>
      <div class="frow"><span class="flbl">Squawk</span>      <span class="fval">${d.squawk}</span></div>
    </div>
  </div>
  <div class="panel" id="p-qns">
    <div class="ptitle">Questions <span id="qctr" style="font-size:9px;font-weight:400;letter-spacing:1px;margin-left:12px"></span></div>
    <div id="snav">${scenBtns}</div>
    <div id="qbody">
      <div class="qbadge" id="qbadge">Scenario 1</div>
      <div class="qtxt" id="qtxt">Loading...</div>
      <button id="rvbtn" onclick="revealAns()">▼ Show Model Answer</button>
      <div id="ansbox"><div class="ahdr">Model Answer</div><div id="ansc"></div></div>
    </div>
    <div id="qact">
      <button class="ab abp" onclick="prevS()">◀ Prev</button>
      <button class="ab abn" onclick="nextS()">Next ▶</button>
      <button class="ab abd" onclick="markDone()">✓ Mark Done</button>
    </div>
  </div>
  <div class="panel" id="p-br">
    <div class="brsub" id="brf">
      <div class="bst">Frequencies</div>
      <div id="fscroll">${freqHtml}</div>
    </div>
    <div class="brsub">
      <div class="bst">ATIS / METAR</div>
      <div id="ascroll">
        <div class="albl">METAR</div>
        <div id="metar">${d.metar}</div>
        <div class="nlbl">Other Info</div>
        <div id="notam">${d.notam}</div>
      </div>
    </div>
  </div>
</div>
<div id="wm">${user.name} | ${user.userId}</div>
<script>
/* ── Guard: must have valid token ── */
const _tok = sessionStorage.getItem('rtr_token');
if(!_tok){ window.location.replace('/'); }

/* ── Scenario data embedded ── */
const SCENS = ${scenJson};
let cs = 0;
const done = new Set();

function loadS(i){
  cs=i;
  document.querySelectorAll('.sn').forEach((b,j)=>b.classList.toggle('active',j===i));
  document.getElementById('qctr').textContent=(i+1)+' / '+SCENS.length;
  document.getElementById('qbadge').textContent='Scenario '+(i+1);
  document.getElementById('qtxt').textContent=SCENS[i].qns;
  const ab=document.getElementById('ansbox');
  ab.classList.remove('vis');
  document.getElementById('ansc').innerHTML='';
  document.getElementById('rvbtn').textContent='▼ Show Model Answer';
}
function revealAns(){
  const ab=document.getElementById('ansbox');
  if(ab.classList.contains('vis')){
    ab.classList.remove('vis');
    document.getElementById('rvbtn').textContent='▼ Show Model Answer';
    return;
  }
  const map={pilot:['pilot','✈ Pilot'],atc:['atc','📻 ATC'],readback:['readback','↺ Readback']};
  document.getElementById('ansc').innerHTML=SCENS[cs].answer.map(t=>{
    const[cls,lbl]=map[t.who]||['pilot','Pilot'];
    return '<div class="tx '+cls+'"><div class="txw">'+lbl+'</div>'+t.text.replace(/\\n/g,'<br>')+'</div>';
  }).join('');
  ab.classList.add('vis');
  document.getElementById('rvbtn').textContent='▲ Hide Answer';
  done.add(cs);
  document.querySelectorAll('.sn').forEach((b,j)=>{ if(done.has(j)) b.classList.add('done'); });
}
function markDone(){ done.add(cs); document.querySelectorAll('.sn').forEach((b,j)=>{ if(done.has(j)) b.classList.add('done'); }); nextS(); }
function prevS(){ if(cs>0) loadS(cs-1); }
function nextS(){ if(cs<SCENS.length-1) loadS(cs+1); }
function goHome(){
  const t=sessionStorage.getItem('rtr_token');
  window.location.href='/simulator';
}

/* ── Timer ── */
let sec=1800,on=false,iv=null;
function updT(){
  const m=Math.floor(sec/60),s=sec%60;
  const el=document.getElementById('timer');
  el.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  el.className=sec<=300?'danger':sec<=600?'warn':'';
}
function startT(){ if(on)return; on=true; iv=setInterval(()=>{ if(sec>0){sec--;updT();}else{clearInterval(iv);on=false;} },1000); }
function pauseT(){ clearInterval(iv); on=false; }
function resetT(){ pauseT(); sec=1800; updT(); }

/* Chart tabs — images live in /${paperId}/ folder (still served as static) */
const charts=[
  {label:'Chart 1',src:'/${paperId}/CHART 1.jpg'},
  {label:'Chart 2',src:'/${paperId}/CHART2.jpg'},
  {label:'Chart 3',src:'/${paperId}/CHART3.jpg'},
];
let curChart=0;
function buildTabs(){
  document.getElementById('ctabs').innerHTML=charts.map((c,i)=>
    '<div class="ctab'+(i===0?' active':'')+'" onclick="switchC('+i+')">'+c.label+'</div>'
  ).join('');
  showC(0);
}
function switchC(i){ curChart=i; document.querySelectorAll('.ctab').forEach((t,j)=>t.classList.toggle('active',j===i)); showC(i); }
function showC(i){
  document.getElementById('chartv').innerHTML=
    '<img src="'+charts[i].src+'" style="max-width:100%;max-height:100%;object-fit:contain" '+
    'onerror="this.outerHTML=\'<div style=\\'color:#8aaa68;font-size:10px;letter-spacing:1px\\'>IMAGE NOT FOUND</div>\'">';
}

loadS(0);
buildTabs();
</script>
</body>
</html>`;
}
