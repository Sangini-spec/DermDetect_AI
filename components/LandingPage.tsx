import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Activity, 
  UserSquare2, 
  UploadCloud, 
  FileCheck2, 
  History, 
  Stethoscope, 
  Lock,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Globe,
  TrendingUp
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

// Parent stagger motion specifications
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

// Child item motion specifications
const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, darkMode, onToggleDarkMode }) => {
  return (
    <div className="bg-[#f7f9fc] dark:bg-[#070a13] min-h-screen text-text-primary dark:text-slate-100 flex flex-col justify-between transition-colors duration-300 pointer-events-auto">
      
      {/* 🚀 Navigation Bar */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-surface dark:bg-[#0b0f19] border-b border-border/80 dark:border-slate-800/80 sticky top-0 z-40 px-4 py-4 md:px-8 shadow-sm backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-light dark:bg-blue-950 p-2.5 rounded-xl shadow-inner text-primary transition-colors">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary dark:text-slate-100 font-display leading-tight">
                DermDetect <span className="text-primary">AI</span>
              </h1>
              <p className="text-[10px] text-text-secondary dark:text-slate-400 font-mono tracking-wider uppercase font-bold">Clinical Companion</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-text-secondary dark:text-slate-300">
            <a href="#features" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-primary dark:hover:text-blue-400 transition-colors">How It Works</a>
            <a href="#security" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Security Details</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Toggle Dark Mode Button */}
            <button
              onClick={onToggleDarkMode}
              className="p-2.5 rounded-lg border border-border dark:border-slate-700 text-text-secondary dark:text-slate-300 bg-surface dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 focus:outline-none"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
            </button>

            <button 
              onClick={onLoginClick}
              className="inline-flex items-center px-4.5 py-2 rounded-xl text-sm font-bold border border-primary/20 hover:border-primary text-primary hover:bg-primary-light dark:hover:bg-slate-800 transition-all duration-300 focus:outline-none"
            >
              Access Portal
            </button>
          </div>
        </div>
      </motion.header>

      {/* 🌟 Hero Section (Dynamic Motion Animations) */}
      <section className="relative px-4 py-20 md:py-32 overflow-hidden bg-gradient-to-b from-primary-light/40 dark:from-blue-950/25 to-transparent">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center relative z-10 space-y-8"
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-border/80 dark:border-slate-800 shadow-sm"
          >
            <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-text-secondary dark:text-slate-300">Advanced Neural Vision Progress Engine</span>
          </motion.div>

          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-7xl font-extrabold tracking-tight text-text-primary dark:text-white font-display leading-[1.05]"
          >
            Intelligent Skin Lesion Tracking, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">AI-Powered</span> Clinical Insights.
          </motion.h2>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-text-secondary dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            DermDetect AI provides medical practitioners and research-stage clinics a secure sandbox to map histories, track lesion metrics over time, and safely query advanced Google Gemini multimodal vision layers.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={onLoginClick}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold shadow-lg shadow-primary/25 text-white bg-primary hover:bg-primary-hover transition-all duration-300 group hover:-translate-y-0.5"
            >
              Enter Clinic Workspace
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold border border-border dark:border-slate-700 bg-surface dark:bg-slate-850 hover:bg-background dark:hover:bg-slate-800 transition-all text-text-secondary dark:text-slate-300 hover:text-text-primary dark:hover:text-white"
            >
              Explore Capabilities
            </a>
          </motion.div>
        </motion.div>

        {/* Backdrop Glow Effects */}
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/8 dark:bg-blue-500/10 rounded-full blur-[130px] pointer-events-none" />
      </section>

      {/* 🧬 Feature Bento Grid Section (Framer Motion Staggers) */}
      <section id="features" className="px-4 py-20 max-w-7xl mx-auto w-full border-t border-border/40 dark:border-slate-800/40">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary-light dark:bg-slate-800 text-xs font-bold text-primary tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5" /> Capabilities
          </div>
          <h3 className="text-3xl md:text-4.5xl font-extrabold tracking-tight text-text-primary dark:text-slate-100 font-display">
            Clinical Diagnostic Support Modules
          </h3>
          <p className="text-text-secondary dark:text-slate-400 max-w-xl mx-auto leading-relaxed text-sm md:text-base">
            Engineered to streamline tracking, visual delta comparisons, and high-precision clinician notations.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {/* Card 1: AI Diagnosis Helper */}
          <motion.div 
            variants={itemVariants}
            className="group bg-surface dark:bg-slate-900 p-8 rounded-2xl border border-border dark:border-slate-800 shadow-md transition-all duration-350 hover:shadow-xl dark:hover:shadow-slate-950/30 hover:border-primary/20 dark:hover:border-primary/40 hover:-translate-y-1"
          >
            <div className="bg-primary-light dark:bg-blue-950/60 p-3.5 rounded-xl w-fit text-primary mb-6 shadow-sm transition-colors group-hover:bg-primary group-hover:text-white">
              <Activity className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-3 font-display">AI Condition Analysis</h4>
            <p className="text-text-secondary dark:text-slate-300 text-sm leading-relaxed">
              Verify suspected lesion images against deep vision networks using backend endpoints. Retrieve condition descriptors, calculated confidence metrics, and doctor safety protocols instantly.
            </p>
          </motion.div>

          {/* Card 2: Temporal Compare */}
          <motion.div 
            variants={itemVariants}
            className="group bg-surface dark:bg-slate-900 p-8 rounded-2xl border border-border dark:border-slate-800 shadow-md transition-all duration-350 hover:shadow-xl dark:hover:shadow-slate-950/30 hover:border-primary/20 dark:hover:border-primary/40 hover:-translate-y-1"
          >
            <div className="bg-emerald-50 dark:bg-emerald-950/55 p-3.5 rounded-xl w-fit text-emerald-500 mb-6 shadow-sm transition-colors group-hover:bg-emerald-500 group-hover:text-white">
              <History className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-3 font-display">Temporal Comparison</h4>
            <p className="text-text-secondary dark:text-slate-300 text-sm leading-relaxed">
              Track progression rates with precision. Select dual images captured weeks or months apart to prompt comparative evaluation of change vectors—detailing scale, borders, and color metrics.
            </p>
          </motion.div>

          {/* Card 3: Secure Registry */}
          <motion.div 
            variants={itemVariants}
            className="group bg-surface dark:bg-slate-900 p-8 rounded-2xl border border-border dark:border-slate-800 shadow-md transition-all duration-350 hover:shadow-xl dark:hover:shadow-slate-950/30 hover:border-primary/20 dark:hover:border-primary/40 hover:-translate-y-1"
          >
            <div className="bg-amber-50 dark:bg-amber-950/50 p-3.5 rounded-xl w-fit text-amber-500 mb-6 shadow-sm transition-colors group-hover:bg-amber-500 group-hover:text-white">
              <UserSquare2 className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-3 font-display">Digital Patient Registry</h4>
            <p className="text-text-secondary dark:text-slate-300 text-sm leading-relaxed">
              Consolidate clinic files under an elegant interface. Record dates of birth, specific blood profiles, and underlying chronic sensitivities along with unified medical file archives.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 🧭 Workflow Guide (Custom timeline design & stagger transitions) */}
      <section id="workflow" className="bg-surface dark:bg-[#0b0f19] py-20 border-y border-border/80 dark:border-slate-800 px-4 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
              <Zap className="h-3.5 w-3.5" /> Integration Flow
            </div>
            <h3 className="text-3xl md:text-4.5xl font-extrabold tracking-tight text-text-primary dark:text-slate-100 font-display">
              Streamlined Medical Workflow
            </h3>
            <p className="text-text-secondary dark:text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              Move effortlessly from indexing patient files to triggering full spatial progression evaluations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="space-y-4 relative"
            >
              <div className="text-7xl font-extrabold text-[#EAF2FA] dark:text-slate-800/30 select-none absolute top-4 left-0 font-display">01</div>
              <div className="relative pt-12">
                <div className="bg-primary/10 text-primary h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg mb-4">
                  <UserSquare2 className="h-5 w-5" />
                </div>
                <h5 className="font-bold text-text-primary dark:text-slate-100 text-lg font-display">Index Profile</h5>
                <p className="text-text-secondary dark:text-slate-350 text-sm leading-relaxed mt-2">
                  Construct patient demography profiles including clinical notations and past therapeutic histories.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-4 relative"
            >
              <div className="text-7xl font-extrabold text-[#EAF2FA] dark:text-slate-800/30 select-none absolute top-4 left-0 font-display">02</div>
              <div className="relative pt-12">
                <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg mb-4">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <h5 className="font-bold text-text-primary dark:text-slate-100 text-lg font-display">Upload Captures</h5>
                <p className="text-text-secondary dark:text-slate-350 text-sm leading-relaxed mt-2">
                  Import close-up macroscopic dermoscopy photographs. Files process securely inside browser memories.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-4 relative"
            >
              <div className="text-7xl font-extrabold text-[#EAF2FA] dark:text-slate-800/30 select-none absolute top-4 left-0 font-display">03</div>
              <div className="relative pt-12">
                <div className="bg-amber-50 dark:bg-amber-950/50 text-amber-500 h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg mb-4">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <h5 className="font-bold text-text-primary dark:text-slate-100 text-lg font-display">Trigger API Analysis</h5>
                <p className="text-text-secondary dark:text-slate-350 text-sm leading-relaxed mt-2">
                  Query the secure node proxy backend to fetch multimodal diagnostic breakdowns from the Google Gemini vision API.
                </p>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-4 relative"
            >
              <div className="text-7xl font-extrabold text-[#EAF2FA] dark:text-slate-800/30 select-none absolute top-4 left-0 font-display">04</div>
              <div className="relative pt-12">
                <div className="bg-rose-50 dark:bg-rose-950/50 text-rose-500 h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg mb-4">
                  <History className="h-5 w-5" />
                </div>
                <h5 className="font-bold text-text-primary dark:text-slate-100 text-lg font-display">Evaluate Growth Delta</h5>
                <p className="text-text-secondary dark:text-slate-350 text-sm leading-relaxed mt-2">
                  Select two scans to analyze changes in borders, size, color shifts, and evolution coefficients.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 🔒 Security and Privacy (Aesthetic card) */}
      <section id="security" className="px-4 py-16 md:py-24 max-w-5xl mx-auto w-full">
        <motion.div 
          initial={{ scale: 0.96, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-primary to-blue-600 dark:from-slate-900 dark:to-blue-950 p-8 md:p-14 rounded-3xl text-white shadow-xl relative overflow-hidden border border-primary/20 dark:border-slate-800"
        >
          <div className="absolute right-0 bottom-0 translate-x-14 translate-y-14 text-white/5 dark:text-slate-800/20 pointer-events-none">
            <Lock className="h-96 w-96 font-extrabold" />
          </div>
          
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="bg-white/10 dark:bg-blue-950/40 p-3.5 rounded-2xl w-fit">
              <Lock className="h-6 w-6 text-white dark:text-blue-400" />
            </div>
            
            <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight font-display">
              Clinical Security Model
            </h3>
            
            <p className="text-white/85 dark:text-slate-300 text-base leading-relaxed">
              DermDetect AI separates analytical computation from browser endpoints to preserve privacy and safety constraints:
            </p>
            
            <ul className="space-y-4 text-sm text-white/90 dark:text-slate-200">
              <li className="flex items-start gap-3">
                <span className="text-emerald-300 dark:text-emerald-400 font-bold text-lg">✔</span>
                <span><strong>No Client Keys</strong>: Unlike standard client prototypes, API tokens reside solely on custom secure container runtimes, making key exposure impossible.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-300 dark:text-emerald-400 font-bold text-lg">✔</span>
                <span><strong>Encrypted Intermediary Transports</strong>: Visual payloads pass through localized proxy servers via end-to-end TLS tunnels.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-300 dark:text-emerald-400 font-bold text-lg">✔</span>
                <span><strong>Browser Demography Vault</strong>: Data is indexed into clinical local vaults, ensuring complete administrator session control.</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </section>

      {/* ⚠️ Advisory Disclaimer Box */}
      <section className="px-4 py-8 bg-amber-50/70 border border-warning/15 dark:bg-[#1a1c1d] dark:border-amber-950/60 max-w-7xl mx-auto w-full rounded-2xl mb-16 flex flex-col md:flex-row items-center gap-5">
        <div className="bg-warning-light dark:bg-amber-950/40 p-3.5 rounded-xl text-warning dark:text-amber-500">
          <ShieldAlert className="h-6 w-6 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div className="text-sm text-warning-text dark:text-amber-300 leading-relaxed font-semibold">
          <strong>Clinical Advisory:</strong> DermDetect AI products, assessments, and comparative progression coefficients serve clinical research and tracking objectives only. These assessments must not serve as verified medical diagnoses. DermDetect AI never bypasses regular dermatological evaluations or professional biopsy protocols.
        </div>
      </section>

      {/* 📁 Footer */}
      <footer className="bg-[#0b0f19] dark:bg-[#03060d] text-white pt-20 pb-10 px-4 md:px-8 border-t border-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <Stethoscope className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xl font-bold tracking-tight font-display">DermDetect AI</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                Empowering medical clinics with structured progress logs, progression comparison metrics, and secure AI analytical pipelines.
              </p>
            </div>
            <div>
              <h6 className="font-bold text-xs text-white/95 mb-5 tracking-widest uppercase">Platform features</h6>
              <ul className="space-y-3 text-xs text-white/45">
                <li><a href="#features" className="hover:text-primary transition-colors">AI Lesion Audit</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Temporal Delta Tracking</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Digital Health Registry</a></li>
                <li><a href="#security" className="hover:text-primary transition-colors">Local Sandbox Encapsulation</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-bold text-xs text-white/95 mb-5 tracking-widest uppercase">Professional Resources</h6>
              <ul className="space-y-3 text-xs text-white/45">
                <li><a href="https://www.aad.org" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">American Academy of Dermatology</a></li>
                <li><a href="https://www.skincancer.org" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Skin Cancer Foundation</a></li>
                <li><a href="https://www.cochrane.org" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Cochrane Skin Archives</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-bold text-xs text-white/95 mb-5 tracking-widest uppercase">EHR Compliance</h6>
              <p className="text-xs text-white/40 leading-relaxed">
                Matches structural formats of standard electronic health records. Payload transfers apply secure end-to-end encryption. All medical logs remain inside client administrator sandboxes.
              </p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
            <p>© {new Date().getFullYear()} DermDetect AI Inc. All rights reserved. Clinical Research Hub.</p>
            <div className="flex gap-6">
              <button onClick={onLoginClick} className="hover:text-white transition-colors">Access Portal</button>
              <button onClick={onLoginClick} className="hover:text-white transition-colors">License Registration</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
