
export interface AnalysisResult {
  conditionName: string;
  confidence: string;
  description: string;
  recommendations: string[];
}

export interface LesionImage {
  id: string;
  imageDataUrl: string; // The image stored as a base64 data URL
  file?: File; // The original file object, available for new uploads, undefined for loaded data
  analysisResult: AnalysisResult | null;
  timestamp: Date;
  boundingBox?: { x1: number; y1: number; x2: number; y2: number } | null;
  pins?: Array<{ id: string; x: number; y: number; label: string }>;
  practitionerNotes?: string;
  patientNotes?: string;
}

export interface PatientMessage {
  id: string;
  sender: 'patient' | 'doctor';
  text: string;
  timestamp: string;
}

export interface SymptomLog {
  id: string;
  timestamp: string;
  itching: boolean;
  bleeding: boolean;
  colorChange: boolean;
  notes: string;
}

export interface CareTask {
  id: string;
  task: string;
  completed: boolean;
}

export interface Patient {
  id: string;
  patientId?: string;
  name: string;
  dob: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  bloodType?: string;
  existingConditions?: string;
  lesionImages: LesionImage[];
  email?: string; // Links patient user to their clinical file archive
  messages?: PatientMessage[];
  symptomLogs?: SymptomLog[];
  careTasks?: CareTask[];
}

export interface ComparisonResult {
    changeSummary: string;
    keyObservations: string[];
    recommendation: string;
    updatedConditionAssessment: string;
    postComparisonCondition: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In a real app, this would be a hash
  role: 'practitioner' | 'patient';
}