/* ================================================================
   api/login.js  — Vercel Serverless Function
   POST /api/login  →  validates credentials, sends email, returns token
   ================================================================ */

const STUDENTS = [
  { name: "Ruthresh", userId: "CRW-000", password: "admin123" },
  { name: "Prajyot",  userId: "CRW-001", password: "rtr2024"  },
  { name: "Priya",    userId: "CRW-002", password: "Priya123" },
  { name: "Kunal",    userId: "CRW-003", password: "Kunal123" },
  { name: "Ammu",    userId: "CRW-004", password: "Ammu123" },
  { name: "Abishek",    userId: "CRW-005", password: "Abishek123" },
  /* ── add more students below ──
  { name: "Full Name", userId: "CRW-004", password: "pass123" },
  ─────────────────────────────── */
];

/* ── EmailJS config ─────────────────────────────────────────── */
const EJS_SERVICE  = "service_w1ep6lz";
const EJS_TEMPLATE = "template_o9w21fv";           // ← from your URL bar
const EJS_KEY      = "28GA_rndKYplQYqPZ";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  const { name, userId, password } = req.body || {};
  if (!name || !userId || !password)
    return res.status(400).json({ success: false, error: "Missing fields" });

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
    const ejsRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:      EJS_SERVICE,
        template_id:     EJS_TEMPLATE,
        user_id:         EJS_KEY,
        template_params: {
          student_name:  student.name,
          student_phone: student.userId,   // Phone column → shows Student ID
          student_email: "Password Login", // Email column → fixed label
          student_id:    student.userId,
          login_time:    now
        }
      })
    });
    const ejsText = await ejsRes.text();
    console.log("EmailJS status:", ejsRes.status, "response:", ejsText); // ← check Vercel logs
  } catch (e) {
    console.warn("Email error:", e.message);
  }

  const payload = { name: student.name, userId: student.userId, t: Date.now() };
  const token   = Buffer.from(JSON.stringify(payload)).toString("base64");
  return res.status(200).json({ success: true, token, name: student.name, userId: student.userId });
}
