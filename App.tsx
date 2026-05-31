

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Sun, Moon, Clock, Brain } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { Spinner } from './components/Spinner';
import { LandingPage } from './components/LandingPage';
import { analyzeSkinCondition, compareLesions } from './services/geminiService';
import type { AnalysisResult, Patient, LesionImage, ComparisonResult, User, PatientMessage } from './types';
import { exportPatientPDF } from './utils/pdfExport';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { PatientPortal } from './components/PatientPortal';

// --- DATA PERSISTENCE HELPERS ---
const saveState = (key: string, state: unknown) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(key, serializedState);
    } catch (e) {
        console.warn(`Error saving state for key "${key}":`, e);
    }
};

const loadState = <T,>(key: string, defaultState: T): T => {
    try {
        const serializedState = localStorage.getItem(key);
        if (serializedState === null) {
            return defaultState;
        }
        const state = JSON.parse(serializedState);
        // Dates need to be re-hydrated from strings
        if (key === 'patients' && Array.isArray(state)) {
            state.forEach(p => {
                if (p.lesionImages && Array.isArray(p.lesionImages)) {
                    p.lesionImages.forEach((img: any) => {
                        img.timestamp = new Date(img.timestamp);
                    });
                }
            });
        }
        return state;
    } catch (e) {
        console.warn(`Error loading state for key "${key}":`, e);
        return defaultState;
    }
};

// --- MOCK DATA ---
const initialPatients: Patient[] = [
    {
        id: 'p1',
        name: 'John Doe',
        dob: '1985-05-23',
        lesionImages: [],
        patientId: 'JD-001',
        gender: 'Male',
        bloodType: 'O+',
        existingConditions: 'None reported',
        email: 'john@patient.com',
        messages: [],
        symptomLogs: [],
        careTasks: []
    },
    {
        id: 'p2',
        name: 'Jane Smith',
        dob: '1992-11-14',
        lesionImages: [],
        email: 'jane@patient.com',
        messages: [],
        symptomLogs: [],
        careTasks: []
    }
];

// --- UTILITY FUNCTIONS ---
const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};


// --- ICONS ---
const AddUserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const CompareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const PatientIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

// --- HELPER COMPONENTS ---

const AuthView: React.FC<{
    onLogin: (email: string, password: string) => Promise<string | null>;
    onSignUp: (name: string, email: string, password: string, role: 'practitioner' | 'patient', dob?: string) => Promise<string | null>;
}> = ({ onLogin, onSignUp }) => {
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'practitioner' | 'patient'>('practitioner');
    const [dob, setDob] = useState('');
    const formRef = useRef<HTMLFormElement>(null);

    const isLogin = authMode === 'login';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        setError(null);
        setIsLoading(true);

        const formData = new FormData(formRef.current!);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        let errorMessage: string | null = null;

        if (isLogin) {
            errorMessage = await onLogin(email, password);
        } else {
            const name = formData.get('name') as string;
            const confirmPassword = formData.get('confirm-password') as string;

            if (password !== confirmPassword) {
                errorMessage = "Passwords do not match.";
            } else if (!name) {
                errorMessage = "Full name is required.";
            } else if (selectedRole === 'patient' && !dob) {
                errorMessage = "Date of birth is required for patient profile creation.";
            } else {
                errorMessage = await onSignUp(name, email, password, selectedRole, dob);
            }
        }

        if (errorMessage) {
            setError(errorMessage);
        }
        setIsLoading(false);
    };

    const toggleMode = () => {
        setError(null);
        setAuthMode(isLogin ? 'signup' : 'login');
    };
    
    const inputClasses = "relative block w-full px-4 py-3 border border-border dark:border-slate-700 bg-white/80 dark:bg-slate-800 placeholder-text-secondary dark:placeholder-slate-400 text-text-primary dark:text-slate-100 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm rounded-lg transition-colors";

    return (
        <div className="flex items-center justify-center min-h-full bg-background dark:bg-[#0b0f19] p-4 transition-colors">
            <div className="w-full max-w-md space-y-8 animate-fade-in">
                <div className="text-center">
                     <div className="mx-auto h-16 w-16 bg-primary-light dark:bg-blue-955 rounded-full flex items-center justify-center shadow-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.789-2.75 9.565M12 11c0-3.517 1.009-6.789 2.75-9.565M12 11H3.313m8.687 0H20.687" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary dark:text-slate-100 font-display transition-colors">{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
                    <p className="mt-2 text-center text-sm text-text-secondary dark:text-slate-400 transition-colors">to access the DermDetect AI Portal</p>
                </div>
                <form ref={formRef} className="mt-8 space-y-5 bg-surface dark:bg-[#0f172a] p-8 rounded-2xl shadow-2xl border border-border/80 dark:border-slate-850 transition-colors" onSubmit={handleSubmit}>
                    
                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider font-mono">Select Onboarding Role</label>
                            <div className="grid grid-cols-2 gap-3 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole('practitioner')}
                                    className={`py-2.5 px-3 border rounded-xl font-bold text-xs capitalize transition-all duration-200
                                        ${selectedRole === 'practitioner' 
                                            ? 'bg-primary border-primary text-white shadow-sm shadow-primary/20' 
                                            : 'border-border dark:border-slate-700 bg-transparent text-text-secondary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    Medical Practitioner
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole('patient')}
                                    className={`py-2.5 px-3 border rounded-xl font-bold text-xs capitalize transition-all duration-200
                                        ${selectedRole === 'patient' 
                                            ? 'bg-primary border-primary text-white shadow-sm shadow-primary/20' 
                                            : 'border-border dark:border-slate-700 bg-transparent text-text-secondary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    Clinical Patient
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {!isLogin && <input id="full-name" name="name" type="text" autoComplete="name" required className={inputClasses} placeholder="Full Name (e.g. John Doe)" />}
                        <input id="email-address" name="email" type="email" autoComplete="email" required className={inputClasses} placeholder="Email address" />
                        
                        {!isLogin && selectedRole === 'patient' && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider font-mono">Date of Birth</label>
                                <input 
                                    type="date"
                                    required
                                    className={inputClasses}
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                />
                            </div>
                        )}

                        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClasses} placeholder="Password" />
                        {!isLogin && <input id="confirm-password" name="confirm-password" type="password" required className={inputClasses} placeholder="Confirm Password" />}
                    </div>

                    {error && <p className="text-danger-text text-sm text-center bg-danger-light dark:bg-rose-950/40 p-3 rounded-lg border dark:border-rose-900">{error}</p>}
                    
                    <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-300 shadow-md hover:shadow-lg disabled:bg-sky-450 dark:disabled:bg-slate-755 disabled:cursor-not-allowed">
                        {isLoading ? <Spinner /> : (isLogin ? 'Sign in' : 'Create Account')}
                    </button>
                    
                    <p className="text-center text-sm text-text-secondary dark:text-slate-400">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button type="button" onClick={toggleMode} className="font-semibold text-primary hover:text-primary-hover hover:underline transition-all focus:outline-none">
                           {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

const AddPatientModal: React.FC<{ onSave: (data: Omit<Patient, 'id' | 'lesionImages'>) => void, onClose: () => void }> = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        patientId: '',
        gender: 'Prefer not to say',
        bloodType: '',
        existingConditions: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (formData.name && formData.dob) {
            onSave(formData as Omit<Patient, 'id' | 'lesionImages'>);
        }
    };
    
    const inputClass = "w-full px-4 py-2 border border-border dark:border-slate-700 bg-surface dark:bg-slate-800 text-text-primary dark:text-slate-100 rounded-lg focus:ring-primary focus:border-primary placeholder-text-secondary dark:placeholder-slate-400";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-surface dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-lg m-4 animate-slide-up max-h-[90vh] overflow-y-auto border border-border/80 dark:border-slate-800">
                <h2 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-6">Add New Patient</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1 block">Full Name *</label>
                            <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1 block">Date of Birth *</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1 block">Patient ID</label>
                            <input type="text" name="patientId" placeholder="e.g., AB-12345" value={formData.patientId} onChange={handleChange} className={inputClass} />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1 block">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                                <option className="bg-surface dark:bg-slate-800">Prefer not to say</option>
                                <option className="bg-surface dark:bg-slate-800">Male</option>
                                <option className="bg-surface dark:bg-slate-800">Female</option>
                                <option className="bg-surface dark:bg-slate-800">Other</option>
                            </select>
                        </div>
                        <div>
                             <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1 block">Blood Type</label>
                             <input type="text" name="bloodType" placeholder="e.g., O+" value={formData.bloodType} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                    <div>
                         <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1 block">Existing Conditions / Notes</label>
                         <textarea name="existingConditions" value={formData.existingConditions} onChange={handleChange} rows={3} className={inputClass} placeholder="e.g., Allergic to penicillin"></textarea>
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-secondary dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary-hover disabled:bg-blue-300 dark:disabled:bg-slate-700 transition-colors" disabled={!formData.name || !formData.dob}>Save Patient</button>
                </div>
            </div>
        </div>
    );
};

const PatientCard: React.FC<{ patient: Patient, onSelect: () => void }> = ({ patient, onSelect }) => (
    <div onClick={onSelect} className="bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-md hover:shadow-xl dark:shadow-slate-950/20 transition-all duration-300 cursor-pointer group border border-transparent dark:border-slate-700/50 hover:border-primary/30 dark:hover:border-primary/40">
        <div className="flex items-center gap-4">
            <div className="bg-primary-light dark:bg-blue-950/60 p-3 rounded-full transition-colors"><PatientIcon /></div>
            <div>
                <p className="text-xl font-bold text-text-primary dark:text-slate-100">{patient.name}</p>
                <p className="text-sm text-text-secondary dark:text-slate-400">DOB: {patient.dob}</p>
            </div>
            <div className="ml-auto text-right">
                 <p className="text-4xl font-extrabold text-primary transition-colors">{patient.lesionImages.length}</p>
                 <p className="text-xs text-text-secondary dark:text-slate-400 font-medium tracking-wider uppercase">Scans</p>
            </div>
        </div>
    </div>
);

const DashboardView: React.FC<{ patients: Patient[], onSelectPatient: (id: string) => void, onAddPatient: (data: Omit<Patient, 'id' | 'lesionImages'>) => void }> = ({ patients, onSelectPatient, onAddPatient }) => {
    const [showModal, setShowModal] = useState(false);
    const handleSavePatient = (data: Omit<Patient, 'id' | 'lesionImages'>) => {
        onAddPatient(data);
        setShowModal(false);
    };

    return (
        <div className="animate-fade-in">
            {showModal && <AddPatientModal onSave={handleSavePatient} onClose={() => setShowModal(false)} />}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-text-primary dark:text-slate-100 tracking-tight">Patient Dashboard</h1>
                    <p className="text-text-secondary dark:text-slate-400 mt-1">Manage and track all your patient clinical files.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-primary hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-primary/20">
                    <AddUserIcon /> Add New Patient
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {patients.map(p => <PatientCard key={p.id} patient={p} onSelect={() => onSelectPatient(p.id)} />)}
            </div>
        </div>
    );
};

const ComparisonResultCard: React.FC<{ result: ComparisonResult }> = ({ result }) => (
    <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8 mt-6 animate-fade-in border border-border/60 dark:border-slate-700/60">
        <h3 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-6">Comparison Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold text-text-secondary dark:text-slate-400 text-sm uppercase tracking-wider">Updated Assessment</h4>
                <p className="text-xl font-semibold text-primary mt-1">{result.updatedConditionAssessment}</p>
            </div>
            <div>
                <h4 className="font-semibold text-text-secondary dark:text-slate-400 text-sm uppercase tracking-wider">Suspected Condition</h4>
                <p className="text-xl font-semibold text-primary mt-1">{result.postComparisonCondition}</p>
            </div>
        </div>
        <div className="mt-6 border-t border-border dark:border-slate-700 pt-6 space-y-4">
            <div>
                <h4 className="font-semibold text-text-primary dark:text-slate-100">Change Summary</h4>
                <p className="text-text-secondary dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg mt-1">{result.changeSummary}</p>
            </div>
            <div>
                <h4 className="font-semibold text-text-primary dark:text-slate-100">Key Observations</h4>
                 <ul className="space-y-2 mt-2">
                    {result.keyObservations.map((obs, index) => (
                        <li key={index} className="flex items-start">
                            <CheckCircleIcon />
                            <span className="ml-3 text-text-secondary dark:text-slate-300 leading-relaxed">{obs}</span>
                        </li>
                    ))}
                </ul>
            </div>
             <div>
                <h4 className="font-semibold text-text-primary dark:text-slate-100">Recommendation</h4>
                <p className="text-text-secondary dark:text-slate-300 mt-1">{result.recommendation}</p>
            </div>
        </div>
    </div>
);

const AnnotationPreview: React.FC<{ image: LesionImage }> = ({ image }) => {
  return (
    <div className="relative select-none w-full max-h-[420px] aspect-square bg-[#fafbfd] dark:bg-slate-950/80 rounded-xl overflow-hidden border border-border/80 dark:border-slate-800 flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <img src={image.imageDataUrl} alt="Annotated lesion" className="max-w-full max-h-full object-contain" />
        
        {/* Render Bounding Box */}
        {image.boundingBox && (
          <div 
            className="absolute border-2 border-indigo-505 bg-indigo-500/10 shadow-md z-10 rounded-md"
            style={{
              left: `${image.boundingBox.x1}%`,
              top: `${image.boundingBox.y1}%`,
              width: `${image.boundingBox.x2 - image.boundingBox.x1}%`,
              height: `${image.boundingBox.y2 - image.boundingBox.y1}%`,
            }}
          >
            <span className="absolute -top-5 left-0 bg-indigo-650 text-white text-[8px] font-bold px-1 py-0.5 rounded shadow">
              ROI Target Area
            </span>
          </div>
        )}

        {/* Render Pinpoints */}
        {image.pins && image.pins.map((pin, index) => (
          <div
            key={pin.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            <div className="bg-rose-500 text-white p-1 rounded-full border border-white flex items-center justify-center h-5 w-5 text-[9px] font-bold shadow-md cursor-help animate-pulse">
              {index + 1}
            </div>
            {/* Tooltip on Hover */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-slate-900 border border-slate-750 text-white rounded px-2 py-0.5 text-[10px] whitespace-nowrap shadow-xl z-30 font-semibold">
              {pin.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalysisDetailModal: React.FC<{ 
  image: LesionImage, 
  onClose: () => void,
  role?: 'practitioner' | 'patient',
  patient?: Patient,
  onUpdatePatient?: (updated: Patient) => void
}> = ({ image, onClose, role = 'practitioner', patient, onUpdatePatient }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [, setTriggerUpdate] = useState(0);

    const handleRunAIScan = async () => {
        setIsScanning(true);
        setScanError(null);
        try {
            // Run clinician-only AI analysis
            const result = await analyzeSkinCondition(
                image.imageDataUrl,
                image.boundingBox,
                image.pins,
                image.practitionerNotes
            );

            // Populate the result immediately on the image model
            image.analysisResult = result;

            if (patient && onUpdatePatient) {
                const updatedImages = patient.lesionImages.map(img => img.id === image.id ? { ...image, analysisResult: result } : img);
                onUpdatePatient({
                    ...patient,
                    lesionImages: updatedImages
                });
            }
            // Trigger local re-render to update the view instantly
            setTriggerUpdate(prev => prev + 1);
        } catch (err: any) {
            setScanError(err.message || 'Dermoscopic scan evaluation failed. Please verify API configurations.');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-background dark:bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up border border-border/65 dark:border-slate-800" role="dialog" aria-modal="true">
                <div className="p-4 flex justify-between items-center border-b border-border dark:border-slate-800 sticky top-0 bg-background/80 dark:bg-[#0f172a]/80 backdrop-blur-sm z-10">
                    <h2 className="text-xl font-bold text-text-primary dark:text-slate-100 font-display">Analysis Details</h2>
                    <button onClick={onClose} className="text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-white transition-colors focus:outline-none"><XIcon /></button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col">
                        <AnnotationPreview image={image} />
                        <p className="text-center text-xs text-text-secondary dark:text-slate-400 mt-2.5 font-mono">
                          Scan date: {image.timestamp.toLocaleString()}
                        </p>
                        
                        {image.pins && image.pins.length > 0 && (
                          <div className="w-full mt-4 p-3.5 bg-[#fbfcfe] dark:bg-slate-950/60 rounded-xl border border-border/50 dark:border-slate-800 text-left">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-2">Target Point Annotations:</h4>
                            <ul className="space-y-2 text-xs text-text-primary dark:text-slate-300">
                              {image.pins.map((pin, i) => (
                                <li key={pin.id} className="flex gap-2 items-center">
                                  <span className="bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] h-4 w-4 font-bold">{i + 1}</span>
                                  <span>{pin.label} <span className="text-[10px] text-slate-400 font-mono">({pin.x.toFixed(0)}%, {pin.y.toFixed(0)}%)</span></span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {image.patientNotes && (
                          <div className="w-full mt-3 p-3.5 bg-amber-500/5 dark:bg-amber-400/5 rounded-xl border border-amber-500/10 text-left animate-fade-in">
                            <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono mb-1">Patient Comments:</h4>
                            <p className="text-xs text-text-primary dark:text-slate-200 mt-1 italic">&ldquo;{image.patientNotes}&rdquo;</p>
                          </div>
                        )}

                        {image.practitionerNotes && (
                          <div className="w-full mt-3 p-3.5 bg-indigo-50/50 dark:bg-indigo-950/15 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 text-left">
                            <h4 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider font-mono mb-1">Clinic Annotation Notes:</h4>
                            <p className="text-xs text-indigo-950 dark:text-indigo-200 mt-1 italic">&ldquo;{image.practitionerNotes}&rdquo;</p>
                          </div>
                        )}
                    </div>
                    <div>
                        {image.analysisResult ? (
                          <ResultCard result={image.analysisResult} />
                        ) : (
                          <div className="bg-[#fafbfc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-6">
                            <div className="mx-auto h-14 w-14 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                              <Brain className="h-7 w-7 animate-pulse" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-extrabold text-lg text-text-primary dark:text-white">AI Diagnostic Scan Pending</h3>
                              <p className="text-sm text-text-secondary dark:text-slate-400">
                                This lesion image was uploaded directly by the patient and has not yet been processed.
                              </p>
                              {role === 'practitioner' ? (
                                <p className="text-xs text-text-secondary dark:text-slate-400/80 leading-relaxed max-w-sm mx-auto">
                                  As a clinical practitioner, you can trigger a high-precision AI dermoscopic tissue evaluation for clinical reference.
                                </p>
                              ) : (
                                <p className="text-xs text-text-secondary dark:text-slate-400/80 leading-relaxed max-w-sm mx-auto">
                                  Your doctor will review this image and activate the specialized AI clinical analysis suite during your consultation.
                                </p>
                              )}
                            </div>
                            
                            {role === 'practitioner' && (
                              <div className="pt-2">
                                <button
                                  onClick={handleRunAIScan}
                                  disabled={isScanning}
                                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-white bg-indigo-650 hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  {isScanning ? (
                                    <>
                                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                      Evaluating vectors...
                                    </>
                                  ) : (
                                    <>
                                      <Brain className="h-4 w-4" />
                                      Start Clinical AI Scan
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {scanError && (
                              <div className="p-4 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-center">
                                {scanError}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const getConfidenceClasses = (confidence: string): { bg: string, text: string, border: string } => {
    switch(confidence?.toLowerCase()) {
        case 'high':
            return { bg: 'bg-success-light', text: 'text-success-text', border: 'border-success' };
        case 'medium':
            return { bg: 'bg-warning-light', text: 'text-warning-text', border: 'border-warning' };
        case 'low':
            return { bg: 'bg-danger-light', text: 'text-danger-text', border: 'border-danger' };
        default:
            return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
    }
}

const PatientDetailView: React.FC<{ patient: Patient, onBack: () => void, onUpdatePatient: (p: Patient) => void, onViewImageDetails: (img: LesionImage) => void }> = ({ patient, onBack, onUpdatePatient, onViewImageDetails }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const [compareId1, setCompareId1] = useState<string|null>(null);
    const [compareId2, setCompareId2] = useState<string|null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonResult, setComparisonResult] = useState<ComparisonResult|null>(null);

    // Interactive canvas image states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isAnnotating, setIsAnnotating] = useState(false);

    // Chat reply state 
    const [replyText, setReplyText] = useState('');

    const handleImageSelect = async (file: File) => {
        setSelectedFile(file);
        const dataUrl = await fileToDataUrl(file);
        setFilePreview(dataUrl);
        setIsAnnotating(true);
        setError(null);
    };

    const handleAnnotatedConfirm = async (annoData: any) => {
        if (!selectedFile) return;
        setIsUploading(true);
        setError(null);
        try {
            const analysisResult = await analyzeSkinCondition(
                selectedFile,
                annoData.boundingBox,
                annoData.pins,
                annoData.practitionerNotes
            );
            const dataUrl = filePreview || (await fileToDataUrl(selectedFile));
            const newLesionImage: LesionImage = {
                id: `img_${Date.now()}`,
                file: selectedFile,
                imageDataUrl: dataUrl,
                timestamp: new Date(),
                analysisResult,
                boundingBox: annoData.boundingBox,
                pins: annoData.pins,
                practitionerNotes: annoData.practitionerNotes
            };
            const updatedPatient = { ...patient, lesionImages: [newLesionImage, ...patient.lesionImages]};
            onUpdatePatient(updatedPatient);
            setIsAnnotating(false);
            setSelectedFile(null);
            setFilePreview(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendReply = () => {
        if (!replyText.trim()) return;
        const newMsg: PatientMessage = {
            id: `m_${Date.now()}`,
            sender: 'doctor',
            text: replyText.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedPatient = {
            ...patient,
            messages: [...(patient.messages || []), newMsg]
        };
        onUpdatePatient(updatedPatient);
        setReplyText('');
    };

    const handleCompare = async () => {
        if (!compareId1 || !compareId2) return;
        const image1 = patient.lesionImages.find(img => img.id === compareId1);
        const image2 = patient.lesionImages.find(img => img.id === compareId2);
        if (!image1 || !image2) return;
        
        setIsComparing(true);
        setComparisonResult(null);
        setError(null);
        try {
            const file1 = image1.file || (await dataUrlToFile(image1.imageDataUrl, `img1_${image1.id}`));
            const file2 = image2.file || (await dataUrlToFile(image2.imageDataUrl, `img2_${image2.id}`));

            const result = await compareLesions(file1, file2);
            setComparisonResult(result);
        } catch(err) {
             setError(err instanceof Error ? err.message : 'An unknown error occurred during comparison.');
        } finally {
            setIsComparing(false);
        }
    };
    
    const compareImg1 = useMemo(() => patient.lesionImages.find(i => i.id === compareId1), [compareId1, patient.lesionImages]);
    const compareImg2 = useMemo(() => patient.lesionImages.find(i => i.id === compareId2), [compareId2, patient.lesionImages]);
    
    const DetailItem: React.FC<{label: string, value?: string}> = ({label, value}) => value ? <div className="text-sm"><span className="font-medium text-text-secondary dark:text-slate-400">{label}:</span> <span className="text-text-primary dark:text-slate-200">{value}</span></div> : null;
    const selectClasses = "w-full px-4 py-3 border border-border dark:border-slate-705 bg-background dark:bg-slate-900 text-text-primary dark:text-slate-100 rounded-lg focus:ring-primary focus:border-primary transition-colors";

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="inline-flex items-center mb-6 text-primary hover:text-primary-hover font-medium">
                <BackIcon /> Back to Dashboard
            </button>
            
            <div className="space-y-8">
                {/* Patient Details */}
                <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-border/40 dark:border-slate-700/40">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-border/60 dark:border-slate-700/65">
                        <h2 className="text-xl font-bold text-text-primary dark:text-slate-100">Patient Profile Details</h2>
                        <button 
                            onClick={() => exportPatientPDF(patient)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
                        >
                            <DownloadIcon /> Export Clinical Report PDF
                        </button>
                    </div>
                    <h1 className="text-3xl font-extrabold text-text-primary dark:text-slate-100 tracking-tight">{patient.name}</h1>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-text-primary dark:text-slate-300">
                        <DetailItem label="DOB" value={patient.dob} />
                        <DetailItem label="Patient ID" value={patient.patientId} />
                        <DetailItem label="Gender" value={patient.gender} />
                        <DetailItem label="Blood Type" value={patient.bloodType} />
                    </div>
                    {patient.existingConditions && <p className="text-sm mt-4 text-text-secondary dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-md border dark:border-slate-750/30"><span className="font-semibold text-text-primary dark:text-white">Active clinical sensitivities:</span> {patient.existingConditions}</p>}
                </div>

                {/* DOUBLE COLUMN GRID LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN SYSTEM: ARCHIVES & ATOMICS (Spans 7) */}
                    <div className="lg:col-span-7 space-y-8">
                        
                        {/* Upload New Image */}
                        <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-border/40 dark:border-slate-700/40 animate-fade-in">
                            <h2 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-4 font-display">Upload & Annotate Macro-Photo</h2>

                            {isAnnotating && filePreview ? (
                                <div className="animate-slide-up">
                                    <InteractiveCanvas 
                                        imageSrc={filePreview} 
                                        onConfirm={handleAnnotatedConfirm} 
                                        onCancel={() => {
                                            setSelectedFile(null);
                                            setFilePreview(null);
                                            setIsAnnotating(false);
                                        }}
                                        isProcessing={isUploading}
                                    />
                                    {isUploading && (
                                        <div className="text-center py-4 space-y-2">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                            <p className="text-sm text-indigo-500 animate-pulse font-mono uppercase tracking-wider font-semibold">Running precision micro-analysis...</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <ImageUploader onImageUpload={handleImageSelect} imageDataUrl={null} />
                            )}
                        </div>
                        
                        {error && <div className="text-center text-danger-text dark:text-rose-450 bg-danger-light dark:bg-rose-950/40 p-3 rounded-lg border dark:border-rose-900 font-semibold text-xs"><p>{error}</p></div>}
                        
                        {/* Image History */}
                        <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-border/40 dark:border-slate-700/40">
                            <h2 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-4 font-display">Capture History Logs ({patient.lesionImages.length})</h2>
                            <div className="max-h-[30rem] overflow-y-auto space-y-4 pr-3 -mr-3">
                                {patient.lesionImages.length === 0 && <p className="text-text-secondary dark:text-slate-400 text-center py-8">No visual progression files logged for this archive.</p>}
                                {patient.lesionImages.map(img => {
                                    const confidenceClasses = getConfidenceClasses(img.analysisResult?.confidence || '');
                                    return (
                                        <div key={img.id} onClick={() => onViewImageDetails(img)} className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#eaf0f6]/40 dark:hover:bg-slate-700/40 border border-border dark:border-slate-700/60 cursor-pointer transition-all duration-200 animate-fade-in">
                                            <img src={img.imageDataUrl} className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-slate-100 dark:bg-slate-900 border dark:border-slate-700" alt="Lesion thumbnail"/>
                                            <div className="flex-grow overflow-hidden">
                                                <p className="font-bold text-text-primary dark:text-slate-100 truncate">{img.analysisResult?.conditionName || 'Analysis Pending'}</p>
                                                <p className="text-xs text-text-secondary dark:text-slate-450">{img.timestamp.toLocaleString()}</p>
                                            </div>
                                            {img.analysisResult && (
                                                <span className={`px-3 py-1 text-[10px] uppercase tracking-wide font-extrabold rounded-full whitespace-nowrap ${confidenceClasses.bg} ${confidenceClasses.text}`}>
                                                    {img.analysisResult.confidence}
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Compare Lesions */}
                        {patient.lesionImages.length >= 2 && (
                             <div className="bg-surface dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-border/40 dark:border-slate-700/40">
                                <h2 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-6 font-display">Compare Lesion Progression rates</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                    <select onChange={e => setCompareId1(e.target.value)} value={compareId1 || ''} className={`${selectClasses} ${!compareId1 ? 'text-text-secondary dark:text-slate-400' : 'text-text-primary dark:text-slate-100'}`}>
                                        <option value="" disabled className="bg-surface dark:bg-slate-800">Select Image 1 (Before)</option>
                                        {patient.lesionImages.map(img => <option key={img.id} value={img.id} className="bg-surface dark:bg-slate-800">{img.timestamp.toLocaleString()} ({img.analysisResult?.conditionName || 'Pending'})</option>)}
                                    </select>
                                    <select onChange={e => setCompareId2(e.target.value)} value={compareId2 || ''} className={`${selectClasses} ${!compareId2 ? 'text-text-secondary dark:text-slate-400' : 'text-text-primary dark:text-slate-100'}`}>
                                        <option value="" disabled className="bg-surface dark:bg-slate-800">Select Image 2 (After)</option>
                                        {patient.lesionImages.map(img => <option key={img.id} value={img.id} className="bg-surface dark:bg-slate-800">{img.timestamp.toLocaleString()} ({img.analysisResult?.conditionName || 'Pending'})</option>)}
                                    </select>
                                    <button onClick={handleCompare} disabled={!compareId1 || !compareId2 || isComparing || compareId1 === compareId2} className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent font-semibold rounded-lg shadow-sm text-white bg-primary hover:bg-primary-hover disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors focus:outline-none">
                                         {isComparing ? <Spinner/> : <><CompareIcon /> Compare Progression</>}
                                     </button>
                                </div>
                                 {compareId1 && compareId2 && compareId1 === compareId2 && <p className="text-danger-text dark:text-rose-450 text-sm mt-2 text-center font-medium">Please select separate captures to trigger differential checks.</p>}
                                 {isComparing && <p className="text-center mt-4 text-text-secondary dark:text-slate-300 animate-pulse">Running advanced progression assessment queries...</p>}
                                 {comparisonResult && (
                                    <div className="mt-8 transition-all">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <p className="font-semibold text-text-secondary dark:text-slate-400 mb-2">Image 1 (Before)</p>
                                                <img src={compareImg1?.imageDataUrl} className="w-full rounded-lg shadow-md border dark:border-slate-700" alt="Comparison image 1" />
                                                <p className="text-sm text-text-secondary dark:text-slate-400 mt-2">{compareImg1?.timestamp.toLocaleString()}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-semibold text-text-secondary dark:text-slate-400 mb-2">Image 2 (After)</p>
                                                <img src={compareImg2?.imageDataUrl} className="w-full rounded-lg shadow-md border dark:border-slate-700" alt="Comparison image 2" />
                                                <p className="text-sm text-text-secondary dark:text-slate-400 mt-2">{compareImg2?.timestamp.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <ComparisonResultCard result={comparisonResult} />
                                    </div>
                                 )}
                             </div>
                        )}

                    </div>

                    {/* RIGHT COLUMN SYSTEM: CLINICAL SYMPTOMS & CHAT (Spans 5) */}
                    <div className="lg:col-span-5 space-y-8">
                        
                        {/* Symptom logs chronology */}
                        <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-border/40 dark:border-slate-700/40">
                            <h2 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-1 font-display">Symptom Timeline Tracker</h2>
                            <p className="text-xs text-text-secondary dark:text-slate-400 mb-5">Historical progress logs submitted by patient from their home checks.</p>
                            
                            {(!patient.symptomLogs || patient.symptomLogs.length === 0) ? (
                                <p className="text-center text-xs text-text-secondary dark:text-slate-455 py-12 italic">No symptom checkpoints recorded by patient yet.</p>
                            ) : (
                                <div className="relative border-l border-border dark:border-slate-700 pl-4 space-y-4 ml-1.5 max-h-72 overflow-y-auto pr-1">
                                    {patient.symptomLogs.map((log) => (
                                        <div key={log.id} className="relative bg-[#fcfdfe] dark:bg-slate-900/40 border border-border/40 dark:border-slate-750/30 p-3 rounded-lg text-xs leading-relaxed shadow-sm">
                                            <div className="absolute -left-[21.5px] top-4 bg-primary rounded-full h-2.5 w-2.5 border-2 border-white dark:border-slate-800" />
                                            <div className="flex justify-between items-center pb-1.5 border-b border-border/60 dark:border-slate-800/80 mb-2 font-mono text-[10px]">
                                                <span className="font-bold text-text-primary dark:text-white uppercase">{log.timestamp}</span>
                                                <div className="flex gap-1.5 font-sans">
                                                    {log.itching && <span className="bg-amber-100 dark:bg-amber-955 text-amber-700 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">Itch</span>}
                                                    {log.bleeding && <span className="bg-rose-100 dark:bg-red-955 text-rose-700 dark:text-rose-455 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase">Bleed</span>}
                                                    {log.colorChange && <span className="bg-indigo-100 dark:bg-indigo-955 text-indigo-700 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">Color</span>}
                                                </div>
                                            </div>
                                            {log.notes ? (
                                                <p className="italic text-text-secondary dark:text-slate-350 font-medium">&ldquo;{log.notes}&rdquo;</p>
                                            ) : (
                                                <p className="text-slate-400">Everything reported stable.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Direct Clinical Communication Messenger */}
                        <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-border/40 dark:border-slate-700/40">
                            <h2 className="text-xl font-bold text-text-primary dark:text-slate-100 mb-1 font-display">Patient Message Desk</h2>
                            <p className="text-xs text-text-secondary dark:text-slate-400 mb-4">Coordinate and send direct responses to patient query logs.</p>
                            
                            <div className="border border-border/80 dark:border-slate-700/50 rounded-xl p-3 bg-[#fafcfd] dark:bg-slate-900/50 h-64 overflow-y-auto space-y-3">
                                {(!patient.messages || patient.messages.length === 0) ? (
                                    <p className="text-center text-xs text-text-secondary dark:text-slate-455 py-20 italic">No communication history logged.</p>
                                ) : (
                                    patient.messages.map((m) => {
                                        const isDoctor = m.sender === 'doctor';
                                        return (
                                            <div 
                                                key={m.id} 
                                                className={`flex flex-col max-w-[80%] ${isDoctor ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                                            >
                                                <div 
                                                    className={`p-3 rounded-xl text-xs leading-relaxed shadow-sm
                                                        ${isDoctor 
                                                            ? 'bg-primary text-white rounded-br-none' 
                                                            : 'bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-bl-none'}`}
                                                >
                                                    {m.text}
                                                </div>
                                                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-mono">
                                                    {isDoctor ? 'You (Doctor)' : 'Patient'} • {m.timestamp}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex gap-2 mt-3 bg-white dark:bg-slate-800">
                                <input
                                    type="text"
                                    placeholder="Type practitioner response..."
                                    className="flex-grow bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 text-xs text-text-primary dark:text-slate-100 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(); }}
                                />
                                <button
                                    onClick={handleSendReply}
                                    disabled={!replyText.trim()}
                                    className="bg-primary hover:bg-primary-hover active:bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-50 transition-all focus:outline-none"
                                >
                                    Send
                                </button>
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadState<User | null>('currentUser', null));
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!loadState<User | null>('currentUser', null));
  const [showAuthForm, setShowAuthForm] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>(() => loadState<User[]>('users', []));
  const [view, setView] = useState<'dashboard' | 'patientDetail'>('dashboard');
  const [patients, setPatients] = useState<Patient[]>(() => loadState<Patient[]>('patients', initialPatients));
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<LesionImage | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // --- ENSURE DEFAULT USER EXISTS ---
  useEffect(() => {
    const defaultUserEmail = 'doctor@clinic.com';
    const defaultPatientEmail = 'john@patient.com';
    
    setUsers(prevUsers => {
      let updated = [...prevUsers];
      const userExists = updated.some(user => user.email === defaultUserEmail);
      if (!userExists) {
        updated.push({
          id: 'user_default_doctor',
          name: 'Dr. Clinic',
          email: defaultUserEmail,
          password: '12345',
          role: 'practitioner',
        });
      }
      
      const patientExists = updated.some(user => user.email === defaultPatientEmail);
      if (!patientExists) {
        updated.push({
          id: 'user_default_patient',
          name: 'John Doe',
          email: defaultPatientEmail,
          password: '12345',
          role: 'patient',
        });
      }
      return updated;
    });
  }, []); // Run only once on mount to seed the default user

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
      saveState('users', users);
  }, [users]);

  useEffect(() => {
      saveState('currentUser', currentUser);
  }, [currentUser]);
  
  useEffect(() => {
      // Create a serializable version of patients by removing the 'file' property, which cannot be stringified
      const serializablePatients = patients.map(p => ({
          ...p,
          lesionImages: p.lesionImages.map(({ file, ...rest }) => rest)
      }));
      saveState('patients', serializablePatients);
  }, [patients]);
  
  useEffect(() => {
      if (isLoggedIn) {
          localStorage.setItem('isLoggedIn', 'true');
      } else {
          localStorage.removeItem('isLoggedIn');
      }
  }, [isLoggedIn]);

  // --- AUTH HANDLERS ---
  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    await new Promise(res => setTimeout(res, 500)); // Simulate network delay
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        return null;
    }
    return "Invalid credentials. Please try again.";
  };
  
  const handleSignUp = async (name: string, email: string, password: string, role: 'practitioner' | 'patient', dob?: string): Promise<string | null> => {
      await new Promise(res => setTimeout(res, 500)); // Simulate network delay
      const userExists = users.find(u => u.email === email);
      if (userExists) {
          return "An account with this email already exists.";
      }
      const newUser: User = { id: `u${Date.now()}`, name, email, password, role };
      setUsers(prev => [...prev, newUser]);

      if (role === 'patient') {
          const newPatient: Patient = {
              id: `p${Date.now()}`,
              patientId: `PA-${Math.floor(1000 + Math.random() * 9000)}`,
              name,
              dob: dob || new Date().toISOString().split('T')[0],
              gender: 'Prefer not to say',
              bloodType: 'O+',
              existingConditions: 'None reported',
              lesionImages: [],
              email,
              messages: [],
              symptomLogs: [],
              careTasks: []
          };
          setPatients(prev => [newPatient, ...prev]);
      }

      setCurrentUser(newUser);
      setIsLoggedIn(true); // Auto-login on successful sign up
      return null;
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setView('dashboard');
    setSelectedPatientId(null);
    setShowAuthForm(false);
  }

  // --- PATIENT HANDLERS ---
  const handleAddPatient = (patientData: Omit<Patient, 'id' | 'lesionImages'>) => {
    const newPatient: Patient = { ...patientData, id: `p${Date.now()}`, lesionImages: [] };
    setPatients(prev => [newPatient, ...prev]);
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setView('patientDetail');
  };
  
  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };
  
  const handleBackToDashboard = () => {
    setSelectedPatientId(null);
    setView('dashboard');
  };

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

  // --- RENDER LOGIC ---
  const renderContent = () => {
    if (!isLoggedIn || !currentUser) {
      return <AuthView onLogin={handleLogin} onSignUp={handleSignUp} />;
    }
    
    switch (view) {
        case 'dashboard':
            return <DashboardView patients={patients} onSelectPatient={handleSelectPatient} onAddPatient={handleAddPatient} />;
        case 'patientDetail':
            if (selectedPatient) {
                return <PatientDetailView patient={selectedPatient} onBack={handleBackToDashboard} onUpdatePatient={handleUpdatePatient} onViewImageDetails={setViewingImage} />;
            }
            handleBackToDashboard();
            return null;
        default: return <p>Error: Unknown view</p>
    }
  };

  // --- MULTI-ROLE ROUTING SPLIT ---
  if (!isLoggedIn || !currentUser) {
    if (showAuthForm) {
      return (
        <div className="min-h-full flex flex-col bg-background dark:bg-[#0b0f19] text-text-primary dark:text-slate-100 transition-colors duration-300">
          <header className="bg-surface dark:bg-slate-900 border-b border-border dark:border-slate-800 py-4 px-6 md:px-8 flex justify-between items-center shadow-sm transition-colors duration-300">
            <button 
              onClick={() => setShowAuthForm(false)}
              className="flex items-center gap-2 text-sm font-semibold text-text-secondary dark:text-slate-300 hover:text-text-primary dark:hover:text-white transition-colors focus:outline-none"
            >
              <span className="bg-primary-light dark:bg-blue-950 p-1.5 rounded-lg text-primary text-xs">←</span>
              <span>Back to Home</span>
            </button>
            <div className="flex items-center gap-4">
              <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg border border-border dark:border-slate-700 text-text-secondary dark:text-slate-400 bg-surface dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 focus:outline-none transition-all duration-300"
                  title={darkMode ? "Switch to Light Mode" : "Dark Mode"}
              >
                  {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
              </button>
              <span className="text-lg font-bold text-text-primary dark:text-slate-100 tracking-tight">DermDetect AI Portal</span>
            </div>
          </header>
          <div className="flex-grow flex items-center justify-center p-4">
            <AuthView onLogin={handleLogin} onSignUp={handleSignUp} />
          </div>
        </div>
      );
    }
    return <LandingPage onLoginClick={() => setShowAuthForm(true)} darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />;
  }

  // --- RENDERING PATIENT PORTAL PORT ---
  if (currentUser.role === 'patient') {
    const patientProfile = patients.find(p => p.email === currentUser.email) || patients.find(p => p.name === currentUser.name) || patients[0];
    return (
      <div className="min-h-full flex flex-col bg-background dark:bg-[#070a13] text-text-primary dark:text-slate-100 transition-colors duration-300">
         <PatientPortal 
           patient={patientProfile}
           onUpdatePatient={handleUpdatePatient}
           onLogout={handleLogout}
           darkMode={darkMode}
           onToggleDarkMode={() => setDarkMode(!darkMode)}
         />
         {viewingImage && (
           <AnalysisDetailModal 
             image={viewingImage} 
             onClose={() => setViewingImage(null)} 
             role="patient" 
           />
         )}
      </div>
    );
  }

  // --- RENDERING PRACTITIONER PORT ---
  return (
    <div className="min-h-full flex flex-col bg-background dark:bg-[#0b0f19] text-text-primary dark:text-slate-100 transition-colors duration-300">
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {renderContent()}
      </main>
       {viewingImage && (
         <AnalysisDetailModal 
           image={viewingImage} 
           onClose={() => setViewingImage(null)} 
           role="practitioner" 
           patient={selectedPatient || undefined} 
           onUpdatePatient={handleUpdatePatient}
         />
       )}
    </div>
  );
};

export default App;
