# DermDetect AI 🩺✨

DermDetect AI is an elegant, highly polished application designed for dermatological monitoring and skin condition research. Powered by React, Vite, Tailwind CSS, and Google Gemini AI, it provides clinicians, researchers, and individuals with a structured digital workspace to log patient files, track individual skin lesions, analyze them using artificial intelligence, and compare active progression across temporal sequences.

---

## 🚀 Key Features

- **🛡️ Secure Provider Auth & Patient Logging**: Access-restricted entry screen guarding structured local databases where users can save, search, and update detailed clinical records.
- **🔬 Advanced AI Lesion Analysis**: Utilizes Google's state-of-the-art `gemini-2.5-flash` model via the modern `@google/genai` SDK to instantly assess skin lesions, outputting expected condition names, analytical confidence ratings, simple summaries, and helpful doctor-facilitated checklists.
- **📈 Temporal Progression Comparator**: Compares two sequential images of the same lesion or skin area taken over time. The model detects granular changes in parameters like sizing, coloration, uniformity, or borders, drafting an automated improvement/stabilization review.
- **👩‍⚕️ Strict Safety Protocols & Disclaimers**: Incorporates clinical safety constraints. The AI is specifically barred from prescribing medical treatments, instead focusing on lifestyle tips, symptoms to watch (warning signs), and structured consultation outlines to facilitate patient-specialist conversations.
- **🚢 Deploy-Ready Configuration**: Bundled with a optimized, free-tier-friendly `render.yaml` specification designed to deploy effortlessly to modern hosting services like Render or Netlify, complete with fully configured rewrite routing and SPA support.

---

## 🛠️ Technology Stack

- **Framework**: [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- **Bundler & Dev Server**: [Vite](https://vite.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) (Inter UI typography paired with modern emerald, indigo, and rose colorways)
- **AI Core Integration**: [@google/genai SDK](https://www.npmjs.com/package/@google/genai) (`gemini-2.5-flash`)
- **Persistence**: Hybrid in-memory state with responsive `localStorage` data hydration

---

## ⚙️ Local Development & Setup

### 1. Requirements
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) and npm installed.

### 2. Add API Credentials
DermDetect AI uses Google Gemini. Obtain a Gemini API Key from [Google AI Studio](https://aistudio.google.com/), duplicate `.env.example` to `.env.local`, and populate the key:

```bash
# Duplicate example env
cp .env.example .env.local
```

Open `.env.local` and configure your secret:
```env
GEMINI_API_KEY=AIzaSy...your_gemini_key_here
```

### 3. Installation & Boot
Install packages and launch the hot-reloading development server:

```bash
npm install
npm run dev
```

Your app will be accessible at [http://localhost:3000](http://localhost:3000).

---

## 🌐 Outer Environment Deployment (e.g., Render)

The repository is pre-configured with a Render blueprint configuration file (`render.yaml`). To deploy this as a high-performance, fast-loading **Static Site** on Render's Free tier:

1. Push your repository to GitHub or GitLab.
2. In your Render Dashboard, click **New +** and select **Blueprint**.
3. Point to this repository; Render will instantly read `render.yaml` and configure:
   - **Service Name**: `dermdetect-ai`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Rewrites Matrix**: `/* -> /index.html` (for seamless React single-page routing)
4. Add the Environment Variable **`GEMINI_API_KEY`** in the Render service's settings so the application can communicate with Google Gemini.

---

## 📝 Disclaimer

*DermDetect AI is developed for informational and research purposes only. It is not an FDA-approved medical diagnostic tool, nor should it substitute for expert advice, clinical physical exams, or professional treatment programs written by licensed dermatologists.*
