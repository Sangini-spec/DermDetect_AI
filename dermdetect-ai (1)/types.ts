
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
}