# Aviator 2-Attempt Landing Page with 500% Welcome Bonus

A high-converting, full-screen Aviator crash game landing page with custom 2-attempt logic, automated video-style onboarding tour, procedural Web Audio synthesizer, and a persistent backend database.

---

## 🚀 Instant Deployment to Vercel

This repository is already configured with [`vercel.json`](./vercel.json) and [`api/index.js`](./api/index.js) for zero-config deployment.

### Option 1: Deploy via Vercel CLI (Recommended)
1. Open your terminal in this directory:
   ```bash
   npx vercel
   ```
2. Follow the quick interactive prompts (accept defaults).
3. To deploy to production:
   ```bash
   npx vercel --prod
   ```

### Option 2: Deploy via GitHub + Vercel Dashboard
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Aviator landing page"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your GitHub repository and click **Deploy**.

---

## 💻 Local Development

Run the full-stack server locally:
```bash
npm install
npm start
```
Open **http://localhost:3000** in your browser.
