/* ================================================================
   api/login.js  — Vercel Serverless Function
   POST /api/login  →  validates credentials, sends email, returns token
   Students list lives HERE — never visible to browser
   ================================================================ */

/* ── STUDENTS LIST — add / remove students here ──────────────
   Format: { name, userId, password }
   userId suggestion: CRW-001, CRW-002 ...
   Give each student a unique password.
   ──────────────────────────────────────────────────────────── */
const STUDENTS = [
  { name: "Ruthresh",   userId: "CRW-000", password: "admin123"  },
  { name: "Prajyot",      userId: "CRW-001", password: "rtr2024"   },
  { name: "Priya",  userId: "CRW-001", password: "Priya123"   },
  { name: "Kunal",  userId: "CRW-001", password: "Kunal123"   },
  /* ── add more students below ──
  { name: "Full Name",   userId: "CRW-003", password: "pass123"   },
  ─────────────────────────────── */
];

/* ── EmailJS config ──────────────────────────────────────────── */
const EJS_SERVICE  = "service_w1ep6lz";
const EJS_TEMPLATE = "template_o9w21fv";
const EJS_KEY      = "28GA_rndKYplQYqPZ";

export default async function handler(req, res) {
  /* CORS */
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  const { name, userId, password } = req.body || {};
  if (!name || !userId || !password)
    return res.status(400).json({ success: false, error: "Missing fields" });

  /* Match student — server side, never exposed */
  const student = STUDENTS.find(s =>
    s.name.trim().toLowerCase()   === name.trim().toLowerCase() &&
    s.userId.trim().toUpperCase() === userId.trim().toUpperCase() &&
    s.password.trim()             === password.trim()
  );

  if (!student)
    return res.status(200).json({ success: false, error: "Invalid credentials" });

  /* ✅ Valid — send email alert */
  try {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:      EJS_SERVICE,
        template_id:     EJS_TEMPLATE,
        user_id:         EJS_KEY,
        template_params: {
          student_name:  student.name,
          student_phone: student.userId,
          student_email: "Password Login",
          student_id:    student.userId,
          login_time:    now
        }
      })
    });
  } catch (e) {
    console.warn("Email error:", e); /* don't block login if email fails */
  }

  /* Return signed token — base64 encoded payload */
  const payload = { name: student.name, userId: student.userId, t: Date.now() };
  const token   = Buffer.from(JSON.stringify(payload)).toString("base64");

  return res.status(200).json({ success: true, token, name: student.name, userId: student.userId });
}
