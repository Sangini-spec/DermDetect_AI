# DermDetect AI – Skin Lesion Analysis & Comparison Platform  

## Runs on: 
https://dermdetect-ai-918130002834.us-west1.run.app

DermDetect AI is an AI-powered dermatology assistant built using **React**, **Flask**, **TensorFlow**, and **Google Cloud Run**.  
It enables clinicians to analyze skin lesion images, compare progression across visits, and generate medical-style reports with heatmaps.

Built during the **TensorFlow User Group (TFUG) Prayagraj Hackathon** using:
- **Gemini AI / AI Studio**
- **Google Cloud**
- **Flask Backend**
- **React Frontend**
- **TensorFlow Models**

---

## 🩺 Overview

DermDetect AI provides:
- Skin lesion classification (AI-powered)
- Lesion comparison (Before vs After)
- Grad-CAM heatmaps for interpretability
- Patient management dashboard
- Image history & scan counts
- Downloadable analysis reports (PDF)
- Secure authentication (JWT)
- Clean medical-grade UI

---

## ✨ Features

### 🔍 Skin Lesion Classification
- Built on TensorFlow (EfficientNet/MobileNet)
- Predicts class + confidence
- Generates Grad-CAM heatmaps
- Returns structured clinical-style results

### 🆚 Lesion Comparison Engine
- Compare two images of the same patient
- Detect improvement, regression, or stability
- Summarizes findings in medical terminology

### 🧠 Multi-Agent AI Workflow
- **Preprocessing Agent** – resizing, normalization  
- **Classifier Agent** – lesion prediction  
- **Heatmap Agent** – Grad-CAM generator  
- **Comparison Agent** – interprets progression  
- **Report Agent** – composes doctor-style summaries  

### 🧑‍⚕️ Patient Dashboard
- Add/manage patients  
- View scan counts  
- Risk classification badges  
- Search + filters + sorting  
- Recent activity feed  

### 🩻 Patient Details Page
- Upload new lesion scan  
- View full scan history  
- Select two images to compare  
- Display heatmaps + diagnoses  
- Full-screen comparison UI  

### 📄 PDF Export
- AI report includes:
  - diagnosis  
  - confidence  
  - heatmap  
  - comparison summary  
  - progression insights  

### 🔐 Secure Auth
- JWT login + protected routes  
- Persistent session storage  

### ☁️ Cloud Deployment
- Flask backend deployed to **Google Cloud Run**
- Frontend compatible with static hosting (Firebase Hosting, Vercel, etc.)
- SQLite used for zero-cost backend database  

---

## 🏗️ Tech Stack

### Frontend
- React + Vite + TypeScript  
- TailwindCSS  
- Axios  
- Recharts  

### Backend
- Python Flask  
- SQLAlchemy (SQLite)  
- TensorFlow / TFLite  
- OpenCV / PIL  
- JWT Authentication  

### Cloud
- Google Cloud Run  
  

### AI Modules
- Classification   
- Comparison  
- Report Generation  

---


 Run the app:
   `npm run dev`
