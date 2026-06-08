/* ============================================================
   api/login.js — Vercel Serverless Function
   This runs on SERVER SIDE — never visible to browser
   Students list lives here — completely hidden
   ============================================================ */

/* ── STUDENTS LIST — edit here to add/remove students ──
   No one can see this file from the browser ever.
   Format: { name, userId, password }
   ────────────────────────────────────────────────── */
const STUDENTS = [
  { name:"Ruthresh",   userId:"CRW-000", password:"admin123"  },
  { name:"Prajyot",      userId:"CRW-001", password:"rtr2024"   },
  { name:"Student Two",  userId:"CRW-002", password:"pilot99"   }
  /* add more students below */
];

/* ── EmailJS config (server side — also hidden) ── */
const EJS_SERVICE  = "service_w1ep6lz";
const EJS_TEMPLATE = "ho7fdyj";
const EJS_KEY      = "28GA_rndKYplQYqPZ";

export default async function handler(req, res) {
  /* Only allow POST */
  if(req.method !== 'POST'){
    return res.status(405).json({ error:'Method not allowed' });
  }

  /* CORS headers */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Content-Type', 'application/json');

  const { name, userId, password } = req.body || {};

  /* Validate input */
  if(!name || !userId || !password){
    return res.status(400).json({ success:false, error:'Missing fields' });
  }

  /* Find matching student — server side check */
  const student = STUDENTS.find(s =>
    s.name.trim().toLowerCase()   === name.trim().toLowerCase() &&
    s.userId.trim().toUpperCase() === userId.trim().toUpperCase() &&
    s.password.trim()             === password.trim()
  );

  if(!student){
    /* Wrong credentials — don't reveal which field is wrong */
    return res.status(200).json({ success:false, error:'Invalid credentials' });
  }

  /* ✅ Correct — send email alert */
  try {
    const now = new Date().toLocaleString('en-IN',{ timeZone:'Asia/Kolkata' }) + ' IST';
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        service_id:  EJS_SERVICE,
        template_id: EJS_TEMPLATE,
        user_id:     EJS_KEY,
        template_params: {
          student_name:  student.name,
          student_phone: student.userId,
          student_email: 'Password Login',
          student_id:    student.userId,
          login_time:    now
        }
      })
    });
  } catch(e) {
    /* Email failure doesn't block login */
    console.warn('Email error:', e);
  }

  /* Return success token */
  const token = Buffer.from(
    JSON.stringify({ name:student.name, userId:student.userId, t:Date.now() })
  ).toString('base64');

  return res.status(200).json({
    success: true,
    token,
    name:   student.name,
    userId: student.userId
  });
}
