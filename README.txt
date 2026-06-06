==============================================
  DGCA RTR PRACTICE SIMULATOR
  Setup & Deployment Guide
==============================================

FOLDER STRUCTURE:
─────────────────
Qns paper/
├── index.html          ← Homepage (don't edit)
├── papers.js           ← ADD NEW PAPERS HERE
├── README.txt          ← This file
├── VT-KNT/
│   ├── VT-KNT.html
│   ├── CHART1.jpg
│   └── CHART2.jpg
├── AI-321/
│   ├── AI-321.html
│   └── CHART1.jpg
└── (more folders...)

HOW TO ADD A NEW PAPER:
────────────────────────
1. Create a new folder e.g. "AI-321" inside "Qns paper/"
2. Copy VT-KNT-template.html into that folder, rename it AI-321.html
3. Edit AI-321.html — update the papers[] data inside <script>
4. Place chart images in the same folder
5. Open papers.js and add ONE line:
   { name: "AI-321", folder: "AI-321", file: "AI-321.html" },
6. Done! It appears on the homepage automatically.

HOW TO HOST ON VERCEL (FREE):
──────────────────────────────
1. Go to https://vercel.com and sign up (free)
2. Install Vercel CLI: open terminal, type:
   npm install -g vercel
3. Navigate to your "Qns paper" folder in terminal:
   cd "C:\Users\YourName\Desktop\Qns paper"
4. Type: vercel
5. Follow the prompts — choose "No" for all framework questions
6. Done! You get a URL like: https://your-project.vercel.app
7. Share that URL with your students

TO UPDATE / REDEPLOY:
──────────────────────
After editing any file, just run: vercel --prod
from the "Qns paper" folder again.

==============================================
