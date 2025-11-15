

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { Spinner } from './components/Spinner';
import { analyzeSkinCondition, compareLesions } from './services/geminiService';
import type { AnalysisResult, Patient, LesionImage, ComparisonResult, User } from './types';

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
        existingConditions: 'None reported'
    },
    {
        id: 'p2',
        name: 'Jane Smith',
        dob: '1992-11-14',
        lesionImages: [],
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

// --- HELPER COMPONENTS ---

const AuthView: React.FC<{
    onLogin: (email: string, password: string) => Promise<string | null>;
    onSignUp: (name: string, email: string, password: string) => Promise<string | null>;
}> = ({ onLogin, onSignUp }) => {
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
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
            } else {
                errorMessage = await onSignUp(name, email, password);
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
    
    const inputClasses = "relative block w-full px-4 py-3 border border-border bg-white/80 placeholder-text-secondary text-text-primary focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm rounded-lg";

    return (
        <div className="flex items-center justify-center min-h-full bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                     <div className="mx-auto h-16 w-16 bg-primary-light rounded-full flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.789-2.75 9.565M12 11c0-3.517 1.009-6.789 2.75-9.565M12 11H3.313m8.687 0H20.687" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
                    <p className="mt-2 text-center text-sm text-text-secondary">to access the DermDetect AI Portal</p>
                </div>
                <form ref={formRef} className="mt-8 space-y-6 bg-surface p-8 rounded-2xl shadow-2xl" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {!isLogin && <input id="full-name" name="name" type="text" autoComplete="name" required className={inputClasses} placeholder="Full Name" />}
                        <input id="email-address" name="email" type="email" autoComplete="email" required className={inputClasses} placeholder="Email address" />
                        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClasses} placeholder="Password" />
                         {!isLogin && <input id="confirm-password" name="confirm-password" type="password" required className={inputClasses} placeholder="Confirm Password" />}
                    </div>
                     {error && <p className="text-danger-text text-sm text-center bg-danger-light p-3 rounded-lg">{error}</p>}
                    <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-300 shadow-md hover:shadow-lg disabled:bg-sky-400 disabled:cursor-not-allowed">
                        {isLoading ? <Spinner /> : (isLogin ? 'Sign in' : 'Create Account')}
                    </button>
                    <p className="text-center text-sm text-text-secondary">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button type="button" onClick={toggleMode} className="font-medium text-primary hover:text-primary-hover hover:underline">
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
    
    const inputClass = "w-full px-4 py-2 border border-border bg-surface text-text-primary rounded-lg focus:ring-primary focus:border-primary placeholder-text-secondary";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-lg m-4 animate-slide-up max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-text-primary mb-6">Add New Patient</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-text-secondary mb-1 block">Full Name *</label>
                            <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-secondary mb-1 block">Date of Birth *</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-secondary mb-1 block">Patient ID</label>
                            <input type="text" name="patientId" placeholder="e.g., AB-12345" value={formData.patientId} onChange={handleChange} className={inputClass} />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-text-secondary mb-1 block">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                                <option>Prefer not to say</option>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                             <label className="text-sm font-medium text-text-secondary mb-1 block">Blood Type</label>
                             <input type="text" name="bloodType" placeholder="e.g., O+" value={formData.bloodType} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                    <div>
                         <label className="text-sm font-medium text-text-secondary mb-1 block">Existing Conditions / Notes</label>
                         <textarea name="existingConditions" value={formData.existingConditions} onChange={handleChange} rows={3} className={inputClass} placeholder="e.g., Allergic to penicillin"></textarea>
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-secondary bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary-hover disabled:bg-blue-300 transition-colors" disabled={!formData.name || !formData.dob}>Save Patient</button>
                </div>
            </div>
        </div>
    );
};

const PatientCard: React.FC<{ patient: Patient, onSelect: () => void }> = ({ patient, onSelect }) => (
    <div onClick={onSelect} className="bg-surface p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border border-transparent hover:border-primary/30">
        <div className="flex items-center gap-4">
            <div className="bg-primary-light p-3 rounded-full transition-colors"><PatientIcon /></div>
            <div>
                <p className="text-xl font-bold text-text-primary">{patient.name}</p>
                <p className="text-sm text-text-secondary">DOB: {patient.dob}</p>
            </div>
            <div className="ml-auto text-right">
                 <p className="text-4xl font-extrabold text-primary transition-colors">{patient.lesionImages.length}</p>
                 <p className="text-xs text-text-secondary font-medium tracking-wider uppercase">Scans</p>
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-text-primary">Patient Dashboard</h1>
                    <p className="text-text-secondary mt-1">Manage and track all your patients.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
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
    <div className="bg-surface rounded-2xl shadow-lg p-6 md:p-8 mt-6 animate-fade-in">
        <h3 className="text-xl font-bold text-text-primary mb-6">Comparison Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold text-text-secondary text-sm uppercase tracking-wider">Updated Assessment</h4>
                <p className="text-xl font-semibold text-primary mt-1">{result.updatedConditionAssessment}</p>
            </div>
            <div>
                <h4 className="font-semibold text-text-secondary text-sm uppercase tracking-wider">Suspected Condition</h4>
                <p className="text-xl font-semibold text-primary mt-1">{result.postComparisonCondition}</p>
            </div>
        </div>
        <div className="mt-6 border-t border-border pt-6 space-y-4">
            <div>
                <h4 className="font-semibold text-text-primary">Change Summary</h4>
                <p className="text-text-secondary bg-slate-50 p-3 rounded-lg mt-1">{result.changeSummary}</p>
            </div>
            <div>
                <h4 className="font-semibold text-text-primary">Key Observations</h4>
                 <ul className="space-y-2 mt-2">
                    {result.keyObservations.map((obs, index) => (
                        <li key={index} className="flex items-start">
                            <CheckCircleIcon />
                            <span className="ml-3 text-text-secondary leading-relaxed">{obs}</span>
                        </li>
                    ))}
                </ul>
            </div>
             <div>
                <h4 className="font-semibold text-text-primary">Recommendation</h4>
                <p className="text-text-secondary mt-1">{result.recommendation}</p>
            </div>
        </div>
    </div>
);

const AnalysisDetailModal: React.FC<{ image: LesionImage, onClose: () => void }> = ({ image, onClose }) => {
    if (!image.analysisResult) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up" role="dialog" aria-modal="true">
                <div className="p-4 flex justify-between items-center border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                    <h2 className="text-xl font-bold text-text-primary">Analysis Details</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><XIcon /></button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col items-center">
                        <img src={image.imageDataUrl} alt="Lesion analysis" className="rounded-lg w-full object-contain shadow-md" />
                        <p className="text-center text-sm text-text-secondary mt-2">Scan taken on: {image.timestamp.toLocaleString()}</p>
                    </div>
                    <div>
                        <ResultCard result={image.analysisResult} />
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

    const handleImageUpload = useCallback(async (file: File) => {
        setIsUploading(true);
        setError(null);
        try {
            const analysisResult = await analyzeSkinCondition(file);
            const imageDataUrl = await fileToDataUrl(file);
            const newLesionImage: LesionImage = {
                id: `img_${Date.now()}`,
                file,
                imageDataUrl,
                timestamp: new Date(),
                analysisResult,
            };
            const updatedPatient = { ...patient, lesionImages: [newLesionImage, ...patient.lesionImages]};
            onUpdatePatient(updatedPatient);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsUploading(false);
        }
    }, [patient, onUpdatePatient]);
    
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
    
    const DetailItem: React.FC<{label: string, value?: string}> = ({label, value}) => value ? <div className="text-sm"><span className="font-medium text-text-secondary">{label}:</span> {value}</div> : null;
    const selectClasses = "w-full px-4 py-3 border border-border bg-background text-text-primary rounded-lg focus:ring-primary focus:border-primary transition-colors";

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="inline-flex items-center mb-6 text-primary hover:text-primary-hover font-medium">
                <BackIcon /> Back to Dashboard
            </button>
            
            <div className="space-y-8">
                {/* Patient Details */}
                <div className="bg-surface p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-text-primary mb-4">Patient Details</h2>
                    <h1 className="text-3xl font-bold text-text-primary">{patient.name}</h1>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-text-primary">
                        <DetailItem label="DOB" value={patient.dob} />
                        <DetailItem label="Patient ID" value={patient.patientId} />
                        <DetailItem label="Gender" value={patient.gender} />
                        <DetailItem label="Blood Type" value={patient.bloodType} />
                    </div>
                    {patient.existingConditions && <p className="text-sm mt-4 text-text-secondary bg-slate-50 p-3 rounded-md"><span className="font-medium text-text-primary">Notes:</span> {patient.existingConditions}</p>}
                </div>

                {/* Upload New Image */}
                <div className="bg-surface p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-text-primary mb-4">Upload New Image</h2>
                    <ImageUploader onImageUpload={handleImageUpload} imageDataUrl={null} />
                    {isUploading && <p className="text-center mt-4 text-text-secondary animate-pulse">AI is analyzing, please wait...</p>}
                </div>
                
                {error && <div className="text-center text-danger-text bg-danger-light p-3 rounded-lg"><p>{error}</p></div>}
                
                {/* Image History */}
                <div className="bg-surface p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-text-primary mb-4">Image History ({patient.lesionImages.length})</h2>
                    <div className="max-h-[30rem] overflow-y-auto space-y-4 pr-3 -mr-3">
                        {patient.lesionImages.length === 0 && <p className="text-text-secondary text-center py-8">No images uploaded yet.</p>}
                        {patient.lesionImages.map(img => {
                            const confidenceClasses = getConfidenceClasses(img.analysisResult?.confidence || '');
                            return (
                                <div key={img.id} onClick={() => onViewImageDetails(img)} className="flex items-center gap-4 p-4 rounded-xl hover:bg-background border border-border cursor-pointer transition-all duration-200">
                                    <img src={img.imageDataUrl} className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-slate-100" alt="Lesion thumbnail"/>
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-bold text-text-primary truncate">{img.analysisResult?.conditionName || 'Analysis Pending'}</p>
                                        <p className="text-sm text-text-secondary">{img.timestamp.toLocaleString()}</p>
                                    </div>
                                    {img.analysisResult && (
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${confidenceClasses.bg} ${confidenceClasses.text}`}>
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
                     <div className="bg-surface p-6 md:p-8 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold text-text-primary mb-6">Compare Lesions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <select onChange={e => setCompareId1(e.target.value)} value={compareId1 || ''} className={`${selectClasses} ${!compareId1 ? 'text-text-secondary' : 'text-text-primary'}`}>
                                <option value="" disabled>Select Image 1 (Before)</option>
                                {patient.lesionImages.map(img => <option key={img.id} value={img.id}>{img.timestamp.toLocaleString()}</option>)}
                            </select>
                            <select onChange={e => setCompareId2(e.target.value)} value={compareId2 || ''} className={`${selectClasses} ${!compareId2 ? 'text-text-secondary' : 'text-text-primary'}`}>
                                <option value="" disabled>Select Image 2 (After)</option>
                                {patient.lesionImages.map(img => <option key={img.id} value={img.id}>{img.timestamp.toLocaleString()}</option>)}
                            </select>
                            <button onClick={handleCompare} disabled={!compareId1 || !compareId2 || isComparing || compareId1 === compareId2} className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-hover disabled:bg-slate-300 transition-colors">
                                 {isComparing ? <Spinner/> : <><CompareIcon /> Compare</>}
                             </button>
                        </div>
                         {compareId1 && compareId2 && compareId1 === compareId2 && <p className="text-danger-text text-sm mt-2 text-center">Please select two different images to compare.</p>}
                         {isComparing && <p className="text-center mt-4 text-text-secondary animate-pulse">AI is comparing images...</p>}
                         {comparisonResult && (
                            <div className="mt-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="font-semibold text-text-secondary mb-2">Image 1 (Before)</p>
                                        <img src={compareImg1?.imageDataUrl} className="w-full rounded-lg shadow-md" alt="Comparison image 1" />
                                        <p className="text-sm text-text-secondary mt-2">{compareImg1?.timestamp.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-text-secondary mb-2">Image 2 (After)</p>
                                        <img src={compareImg2?.imageDataUrl} className="w-full rounded-lg shadow-md" alt="Comparison image 2" />
                                        <p className="text-sm text-text-secondary mt-2">{compareImg2?.timestamp.toLocaleString()}</p>
                                    </div>
                                </div>
                                <ComparisonResultCard result={comparisonResult} />
                            </div>
                         )}
                     </div>
                )}
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem('isLoggedIn'));
  const [users, setUsers] = useState<User[]>(() => loadState<User[]>('users', []));
  const [view, setView] = useState<'dashboard' | 'patientDetail'>('dashboard');
  const [patients, setPatients] = useState<Patient[]>(() => loadState<Patient[]>('patients', initialPatients));
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<LesionImage | null>(null);

  // --- ENSURE DEFAULT USER EXISTS ---
  useEffect(() => {
    const defaultUserEmail = 'doctor@clinic.com';
    
    setUsers(prevUsers => {
      const userExists = prevUsers.some(user => user.email === defaultUserEmail);
      if (!userExists) {
        const defaultUser: User = {
          id: 'user_default_doctor',
          name: 'Dr. Clinic',
          email: defaultUserEmail,
          password: '12345',
        };
        return [...prevUsers, defaultUser];
      }
      return prevUsers;
    });
  }, []); // Run only once on mount to seed the default user

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
      saveState('users', users);
  }, [users]);
  
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
        setIsLoggedIn(true);
        return null;
    }
    return "Invalid credentials. Please try again.";
  };
  
  const handleSignUp = async (name: string, email: string, password: string): Promise<string | null> => {
      await new Promise(res => setTimeout(res, 500)); // Simulate network delay
      const userExists = users.find(u => u.email === email);
      if (userExists) {
          return "An account with this email already exists.";
      }
      const newUser: User = { id: `u${Date.now()}`, name, email, password };
      setUsers(prev => [...prev, newUser]);
      setIsLoggedIn(true); // Auto-login on successful sign up
      return null;
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('dashboard');
    setSelectedPatientId(null);
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
    if (!isLoggedIn) return <AuthView onLogin={handleLogin} onSignUp={handleSignUp} />;
    
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

  if (!isLoggedIn) {
      return <div className="h-full"><AuthView onLogin={handleLogin} onSignUp={handleSignUp} /></div>
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {renderContent()}
      </main>
       {viewingImage && <AnalysisDetailModal image={viewingImage} onClose={() => setViewingImage(null)} />}
    </div>
  );
};

export default App;
