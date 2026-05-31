import React, { useState, useMemo } from 'react';
import { 
  User, 
  Plus, 
  CheckCircle2, 
  MessageSquare, 
  Calendar, 
  Send, 
  Activity, 
  ArrowRight, 
  ShieldAlert, 
  FileText,
  Clock,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  ClipboardList,
  Flame,
  UserCheck
} from 'lucide-react';
import { InteractiveCanvas, AnnotationData } from './InteractiveCanvas';
import { analyzeSkinCondition } from '../services/geminiService';
import { ResultCard } from './ResultCard';
import type { Patient, LesionImage, PatientMessage, SymptomLog, CareTask } from '../types';

interface PatientPortalProps {
  patient: Patient;
  onUpdatePatient: (updated: Patient) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const PatientPortal: React.FC<PatientPortalProps> = ({
  patient,
  onUpdatePatient,
  onLogout,
  darkMode,
  onToggleDarkMode
}) => {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'messaging' | 'care' | 'symptoms'>('overview');
  
  // Scans upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Selected scan for details modal
  const [viewingImage, setViewingImage] = useState<LesionImage | null>(null);

  // Chat window state
  const [chatMessage, setChatMessage] = useState('');

  // Symptom tracker state
  const [itching, setItching] = useState(false);
  const [bleeding, setBleeding] = useState(false);
  const [colorChange, setColorChange] = useState(false);
  const [symptomNotes, setSymptomNotes] = useState('');

  // Hydrate care plan if empty
  const defaultTasks: CareTask[] = [
    { id: 't1', task: "Apply broad-spectrum sunscreen SPF 50+ on exposed areas", completed: false },
    { id: 't2', task: "Inspect skin areas for asymmetrical growth or border expansion", completed: false },
    { id: 't3', task: "Keep active lesion site moisturized using gentle hypoallergenic creams", completed: false },
    { id: 't4', task: "Refrain from scraping or scratching dry/raised skin zones", completed: false },
    { id: 't5', task: "Hydrate actively (drink 8+ glasses of fluids daily)", completed: false }
  ];

  const personalCareTasks = useMemo(() => {
    return patient.careTasks && patient.careTasks.length > 0 ? patient.careTasks : defaultTasks;
  }, [patient.careTasks]);

  // Messages list helper
  const messages = useMemo(() => {
    return patient.messages || [];
  }, [patient.messages]);

  // Symptoms entry timeline helper
  const symptomLogs = useMemo(() => {
    return patient.symptomLogs || [];
  }, [patient.symptomLogs]);

  // Calculate compliance count
  const completedTasksCount = useMemo(() => {
    return personalCareTasks.filter(t => t.completed).length;
  }, [personalCareTasks]);

  // Handle local image file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const dataUrl = await fileToDataUrl(file);
      setFilePreview(dataUrl);
      setIsAnnotating(true);
      setUploadError(null);
    }
  };

  // Process annotated upload with coordinates mapping
  const handleAnnotatedConfirm = async (annoData: AnnotationData) => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      // Prompt backend using exact coordinate descriptors
      const result = await analyzeSkinCondition(
        selectedFile,
        annoData.boundingBox,
        annoData.pins,
        annoData.practitionerNotes
      );

      const dataUrl = filePreview || (await fileToDataUrl(selectedFile));
      
      const newLesion: LesionImage = {
        id: `img_${Date.now()}`,
        imageDataUrl: dataUrl,
        file: selectedFile,
        analysisResult: result,
        timestamp: new Date()
      };

      const updatedPatient: Patient = {
        ...patient,
        lesionImages: [newLesion, ...(patient.lesionImages || [])]
      };

      onUpdatePatient(updatedPatient);
      
      // Reset state variables
      setSelectedFile(null);
      setFilePreview(null);
      setIsAnnotating(false);
    } catch (err: any) {
      setUploadError(err.message || 'Error occurred while processing skin condition');
    } finally {
      setIsUploading(false);
    }
  };

  // Messaging trigger
  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const newMsg: PatientMessage = {
      id: `m_${Date.now()}`,
      sender: 'patient',
      text: chatMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedPatient: Patient = {
      ...patient,
      messages: [...messages, newMsg]
    };
    onUpdatePatient(updatedPatient);
    setChatMessage('');
  };

  // Care tasks toggle helper
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = personalCareTasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    const updatedPatient: Patient = {
      ...patient,
      careTasks: updatedTasks
    };
    onUpdatePatient(updatedPatient);
  };

  // Symptoms logging triggers
  const handleSaveSymptoms = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: SymptomLog = {
      id: `symptom_${Date.now()}`,
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      itching,
      bleeding,
      colorChange,
      notes: symptomNotes.trim()
    };

    const updatedPatient: Patient = {
      ...patient,
      symptomLogs: [newLog, ...symptomLogs]
    };
    onUpdatePatient(updatedPatient);
    
    // Clear Form Fields
    setItching(false);
    setBleeding(false);
    setColorChange(false);
    setSymptomNotes('');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-[#070a13] text-text-primary dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* Patient Subport Navigation Menu Header */}
      <header className="bg-surface dark:bg-[#0b0f19] border-b border-border/80 dark:border-slate-800/80 px-4 py-4 md:px-8 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-primary-light dark:bg-blue-955 p-3 rounded-2xl text-primary shadow-sm">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight font-display text-text-primary dark:text-white">
                  Patient Vault <span className="text-primary font-medium text-sm border border-primary/25 px-2 py-0.5 rounded-full ml-1">Terminal</span>
                </h1>
              </div>
              <p className="text-xs text-text-secondary dark:text-slate-450 font-medium">Logged In: <span className="font-bold text-text-primary dark:text-slate-250">{patient.name}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode toggle Button */}
            <button
              onClick={onToggleDarkMode}
              className="p-2.5 rounded-xl border border-border dark:border-slate-750 text-text-secondary dark:text-slate-350 bg-surface dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:outline-none"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4.5 py-2 rounded-xl text-sm font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 hover:bg-rose-100 dark:hover:bg-rose-950/40 border border-rose-200/40 dark:border-rose-950/60 transition-all focus:outline-none"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Terminal Grid Workspaces */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* SIDE BAR VIEW PANEL SELECTION (Spans 3) */}
        <div className="md:col-span-3 space-y-4">
          
          {/* Quick Metrics Badge and User card */}
          <div className="bg-surface dark:bg-slate-900 border border-border/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-center">
            <div className="mx-auto h-16 w-16 bg-primary/10 dark:bg-primary/20 hover:scale-105 transition-transform rounded-full flex items-center justify-center font-bold text-primary text-xl shadow-inner uppercase">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-extrabold text-text-primary dark:text-white truncate font-display">{patient.name}</h3>
              <p className="text-xs text-text-secondary dark:text-slate-450 mt-0.5 font-mono uppercase tracking-wider">{patient.dob}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 dark:border-slate-800">
              <div className="bg-[#f7f9fc] dark:bg-slate-950 p-2.5 rounded-lg">
                <span className="text-2xl font-extrabold text-primary block">{patient.lesionImages?.length || 0}</span>
                <span className="text-[10px] uppercase font-bold text-text-secondary dark:text-slate-400">Total Scans</span>
              </div>
              <div className="bg-[#f7f9fc] dark:bg-slate-950 p-2.5 rounded-lg">
                <span className="text-2xl font-extrabold text-emerald-500 block">{symptomLogs.length}</span>
                <span className="text-[10px] uppercase font-bold text-text-secondary dark:text-slate-400">Daily Logs</span>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2.5 bg-surface dark:bg-slate-900 rounded-2xl border border-border/60 dark:border-slate-800 p-3 shadow-md">
            <button
              onClick={() => { setActiveTab('overview'); setIsAnnotating(false); }}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center gap-3 transition-all
                ${activeTab === 'overview' 
                  ? 'bg-primary text-white shadow-md shadow-primary/25 translate-x-1.5' 
                  : 'text-text-secondary hover:text-text-primary dark:text-slate-350 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
            >
              <Activity className="h-4.5 w-4.5" />
              Overview & Upload Scans
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>

            <button
              onClick={() => { setActiveTab('care'); setIsAnnotating(false); }}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center gap-3 transition-all
                ${activeTab === 'care' 
                  ? 'bg-primary text-white shadow-md shadow-primary/25 translate-x-1.5' 
                  : 'text-text-secondary hover:text-text-primary dark:text-slate-350 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
            >
              <ClipboardList className="h-4.5 w-4.5" />
              Home Monitoring Care Plan
              {completedTasksCount < personalCareTasks.length && (
                <span className="bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold h-4 w-4 ml-1">
                  !
                </span>
              )}
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>

            <button
              onClick={() => { setActiveTab('symptoms'); setIsAnnotating(false); }}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center gap-3 transition-all
                ${activeTab === 'symptoms' 
                  ? 'bg-primary text-white shadow-md shadow-primary/25 translate-x-1.5' 
                  : 'text-text-secondary hover:text-text-primary dark:text-slate-350 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
            >
              <Flame className="h-4.5 w-4.5" />
              Symptom Log Journal
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>

            <button
              onClick={() => { setActiveTab('messaging'); setIsAnnotating(false); }}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center gap-3 transition-all
                ${activeTab === 'messaging' 
                  ? 'bg-primary text-white shadow-md shadow-primary/25 translate-x-1.5' 
                  : 'text-text-secondary hover:text-text-primary dark:text-slate-350 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
            >
              <MessageSquare className="h-4.5 w-4.5" />
              Messaging Thread
              {messages.length > 0 && messages[messages.length - 1].sender === 'doctor' && (
                <span className="bg-rose-500 h-2 w-2 rounded-full ml-1 block animate-ping" />
              )}
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>
          </nav>
        </div>

        {/* WORKSPACE DETAIL SHEETS (Spans 9) */}
        <div className="md:col-span-9">
          
          {/* TAB 1: OVERVIEW & NEW SCAN WORKSPACE */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-surface dark:bg-slate-900 shadow-sm border border-border/50 dark:border-slate-800/80 p-6 md:p-8 rounded-2xl">
                <h2 className="text-2xl font-extrabold text-text-primary dark:text-white font-display">Capture & Track New Skin Lesion</h2>
                <p className="text-sm text-text-secondary dark:text-slate-400 mt-1 mb-6">
                  Add high-resolution dermoscopy photos to analyze patterns, isolate suspect boundaries, and catalog lesion growth rate over time.
                </p>

                {isAnnotating && filePreview ? (
                  <div className="animate-slide-up max-w-2xl mx-auto">
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
                      <div className="mt-6 text-center space-y-3">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                        <p className="text-sm text-indigo-500 font-bold animate-pulse font-mono uppercase tracking-wider">
                          Analyzing structural vectors... Isolating annotated tissues...
                        </p>
                      </div>
                    )}
                    {uploadError && (
                      <div className="mt-4 p-4 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-center">
                        {uploadError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border dark:border-slate-800/80 hover:border-primary/50 rounded-2xl p-12 transition-all bg-[#fafbfd] dark:bg-slate-950/40 relative">
                    <input 
                      type="file" 
                      id="patient-file-upload" 
                      accept="image/png, image/jpeg, image/webp" 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                      onChange={handleFileChange}
                    />
                    <div className="bg-primary-light dark:bg-blue-955 p-4 rounded-2xl text-primary shadow-sm mb-4">
                      <Plus className="h-7 w-7" />
                    </div>
                    <p className="text-base font-bold text-text-primary dark:text-white text-center">
                      Click area or drop files here to upload lesion scans
                    </p>
                    <p className="text-xs text-text-secondary dark:text-slate-400 text-center mt-1">
                      Direct photos are stored locally inside clinic memory vaults. Supports PNG, JPG, or WEBP files.
                    </p>
                  </div>
                )}
              </div>

              {/* Capture History List */}
              <div className="bg-surface dark:bg-slate-900 shadow-sm border border-border/50 dark:border-slate-800/80 p-6 md:p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-text-primary dark:text-white font-display mb-6">Scan Capture Archives ({patient.lesionImages?.length || 0})</h3>
                
                {(!patient.lesionImages || patient.lesionImages.length === 0) ? (
                  <div className="text-center py-10">
                    <p className="text-text-secondary dark:text-slate-400 font-semibold">No visual scans have been cataloged for your profile yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {patient.lesionImages.map(img => (
                      <div 
                        key={img.id} 
                        onClick={() => setViewingImage(img)}
                        className="p-4 rounded-xl border border-border/50 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-950 hover:shadow-lg dark:hover:shadow-slate-955/20 hover:border-primary/20 dark:hover:border-primary/40 cursor-pointer transition-all duration-300 flex gap-4"
                      >
                        <img 
                          src={img.imageDataUrl} 
                          alt="Thumbnail of lesion" 
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-slate-100 dark:bg-slate-800" 
                        />
                        <div className="overflow-hidden flex-grow flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-text-primary dark:text-slate-100 truncate">
                              {img.analysisResult?.conditionName || 'Analysis Completed'}
                            </h4>
                            <p className="text-[10px] text-text-secondary dark:text-slate-450 mt-0.5">
                              {new Date(img.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          {img.analysisResult && (
                            <span className="text-[10px] font-bold text-primary dark:text-blue-400 mt-2 tracking-wide block uppercase">
                              Confidence: {img.analysisResult.confidence}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE CLINICAL ADVISORY CARE TIMELINE */}
          {activeTab === 'care' && (
            <div className="space-y-6 animate-fade-in bg-surface dark:bg-slate-900 shadow-sm border border-border/50 dark:border-slate-800 p-6 md:p-8 rounded-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-border/50 dark:border-slate-800">
                <div>
                  <h2 className="text-2xl font-extrabold text-text-primary dark:text-white font-display">Daily Home Self-Care Plan</h2>
                  <p className="text-xs text-text-secondary dark:text-slate-400 mt-0.5">Recommended daily hygiene loops to facilitate comfortable lesion monitoring.</p>
                </div>
                <div className="bg-primary/15 dark:bg-blue-956 px-4 py-2 rounded-xl text-primary font-bold text-sm font-mono whitespace-nowrap">
                  Compliance: {completedTasksCount} / {personalCareTasks.length}
                </div>
              </div>

              <div className="space-y-3.5">
                {personalCareTasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all duration-300
                      ${task.completed 
                        ? 'bg-emerald-50/50 border-emerald-250 dark:bg-emerald-950/20 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200' 
                        : 'bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-text-primary dark:text-slate-100 hover:scale-[1.01] hover:border-primary/20'}`}
                  >
                    <CheckCircle2 className={`h-5 w-5 flex-shrink-0 transition-transform ${task.completed ? 'text-emerald-500 scale-110' : 'text-slate-300'}`} />
                    <span className={`text-sm ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                      {task.task}
                    </span>
                  </div>
                ))}
              </div>

              {completedTasksCount === personalCareTasks.length && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-250 dark:border-emerald-900 flex items-start gap-4 text-emerald-800 dark:text-emerald-350">
                  <span className="text-2xl animate-bounce">🏆</span>
                  <div>
                    <h4 className="font-bold">Perfect Compliance!</h4>
                    <p className="text-xs mt-1 text-emerald-700/80 dark:text-emerald-350/80">
                      You have fully completed your home monitoring care schedule. Keeping regular routines assists in clinical diagnostics. Keep it up!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SPATIAL EVOLUTION SYMPTOM LOG */}
          {activeTab === 'symptoms' && (
            <div className="space-y-8 animate-fade-in">
              {/* Add New Checkpoint Form */}
              <div className="bg-surface dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-border/50 dark:border-slate-800/80 shadow-sm">
                <h2 className="text-2xl font-extrabold text-text-primary dark:text-white font-display">New Symptom Progress Entry</h2>
                <p className="text-sm text-text-secondary dark:text-slate-400 mt-1 mb-6">
                  Maintain records of any change in lesion physical attributes to assist your clinician.
                </p>

                <form onSubmit={handleSaveSymptoms} className="space-y-5">
                  <div className="p-4 bg-[#f8fafc] dark:bg-slate-950/45 rounded-xl border border-border/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={itching} 
                        onChange={(e) => setItching(e.target.checked)}
                        className="h-4.5 w-4.5 text-primary border-slate-300 rounded focus:ring-primary" 
                      />
                      <span className="text-sm font-semibold text-text-primary dark:text-slate-200">Active Itchiness</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={bleeding} 
                        onChange={(e) => setBleeding(e.target.checked)}
                        className="h-4.5 w-4.5 text-primary border-slate-300 rounded focus:ring-primary" 
                      />
                      <span className="text-sm font-semibold text-text-primary dark:text-slate-200">Bleeding or Oozing</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={colorChange} 
                        onChange={(e) => setColorChange(e.target.checked)}
                        className="h-4.5 w-4.5 text-primary border-slate-300 rounded focus:ring-primary" 
                      />
                      <span className="text-sm font-semibold text-text-primary dark:text-slate-200">Rapid Color Shift</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Special Comments</label>
                    <textarea
                      value={symptomNotes}
                      onChange={(e) => setSymptomNotes(e.target.value)}
                      placeholder="Detail any observations e.g. Border appears slightly rougher, raised area expanded."
                      rows={3}
                      className="w-full text-sm bg-[#fcfdfe] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-primary hover:bg-primary-hover active:bg-primary rounded-xl transition-all shadow-md focus:outline-none"
                  >
                    Save Symptom Checkpoint
                  </button>
                </form>
              </div>

              {/* Checkpoint Timeline List */}
              <div className="bg-surface dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-border/50 dark:border-slate-800/80 shadow-sm">
                <h3 className="text-xl font-bold text-text-primary dark:text-white font-display mb-6">Historical Logs Archive ({symptomLogs.length})</h3>
                {symptomLogs.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-text-secondary dark:text-slate-400 font-medium">No progress checkpoints recorded yet.</p>
                  </div>
                ) : (
                  <div className="relative border-l border-border dark:border-slate-800 pl-6 space-y-6 ml-3">
                    {symptomLogs.map((log) => (
                      <div key={log.id} className="relative bg-[#fcfdfe] dark:bg-[#0c1221] border border-border/40 dark:border-slate-800/80 p-4.5 rounded-xl">
                        {/* Bullet symbol */}
                        <div className="absolute -left-[31px] top-4.5 bg-primary rounded-full h-4 w-4 border-2 border-white dark:border-slate-900" />
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-border/40 dark:border-slate-850 pb-2 mb-3">
                          <span className="font-bold text-sm text-text-primary dark:text-white flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" /> {log.timestamp}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {log.itching && <span className="bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full">Itch</span>}
                            {log.bleeding && <span className="bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full text-rose-500">Bleed</span>}
                            {log.colorChange && <span className="bg-indigo-100 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full">Color</span>}
                            {!log.itching && !log.bleeding && !log.colorChange && <span className="bg-emerald-100 dark:bg-emerald-950/20 text-emerald-750 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full">Stable</span>}
                          </div>
                        </div>
                        {log.notes ? (
                          <p className="text-xs text-text-secondary dark:text-slate-300 leading-relaxed italic">
                            &ldquo;{log.notes}&rdquo;
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400">No additional remarks logged.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: messaging panel */}
          {activeTab === 'messaging' && (
            <div className="bg-surface dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-border/50 dark:border-slate-800 shadow-sm flex flex-col h-[550px] animate-fade-in relative">
              <div className="border-b border-border/60 dark:border-slate-800 pb-4 mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-text-primary dark:text-white font-display">Dermatological Messaging Thread</h2>
                  <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">Direct communication portal with your primary medical practitioner.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 font-mono uppercase bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-full">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" /> Connection Encrypted
                </div>
              </div>

              {/* Chat messages viewport */}
              <div className="flex-grow overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin scroll-smooth">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <MessageSquare className="h-12 w-12 text-slate-350 animate-pulse mb-3" />
                    <p className="text-sm font-semibold text-text-secondary dark:text-slate-400 max-w-sm">
                      Your query desk is empty. Type your message below to send comments, concerns, or coordinate evaluations to your doctor.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender === 'patient';
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div 
                          className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                            ${isMe 
                              ? 'bg-primary text-white rounded-br-none' 
                              : 'bg-[#fafbfc] dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-mono uppercase tracking-wider">
                          {isMe ? 'You' : 'Dr. Practitioner'} • {msg.timestamp}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Console */}
              <div className="flex gap-2.5 items-center border-t border-slate-100 dark:border-slate-800 pt-4 bg-white dark:bg-slate-900 sticky bottom-0">
                <input
                  type="text"
                  placeholder="Type message or ask questions about suspicious lesions..."
                  className="flex-grow bg-[#fafbfc] dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className="bg-primary hover:bg-primary-hover active:bg-primary text-white p-3.5 rounded-xl shadow-lg shadow-primary/10 transition-all focus:outline-none disabled:opacity-50"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Patient scans details preview modal inside Patient Dashboard */}
      {viewingImage && viewingImage.analysisResult && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-background dark:bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up border border-border/65 dark:border-slate-800">
            <div className="p-4 flex justify-between items-center border-b border-border dark:border-slate-800 sticky top-0 bg-background/90 dark:bg-[#0f172a]/95 backdrop-blur-sm z-10">
              <h2 className="text-xl font-bold text-text-primary dark:text-slate-100">Scan Details & Result Feed</h2>
              <button 
                onClick={() => setViewingImage(null)} 
                className="text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                <img src={viewingImage.imageDataUrl} alt="Lesion condition view" className="rounded-lg w-full max-h-[380px] object-contain shadow-md border dark:border-slate-850" />
                <p className="text-center text-xs text-text-secondary dark:text-slate-450 mt-3 font-mono">
                  Scan date: {new Date(viewingImage.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <ResultCard result={viewingImage.analysisResult} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary diagnostic advisory box */}
      <footer className="bg-amber-50/50 border-t border-warning/10 py-5 px-4 text-center text-xs text-warning-text dark:bg-[#131518] dark:border-amber-900/40 dark:text-amber-300">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <ShieldAlert className="h-4 w-4 text-warning flex-shrink-0 animate-pulse" />
          <span>
            <strong>Medical Disclaimer:</strong> DermDetect AI tools and metrics serve only as tracking companions. Consult a primary care clinic or board-certified dermatologist for biopsied medical diagnoses.
          </span>
        </div>
      </footer>

    </div>
  );
};
