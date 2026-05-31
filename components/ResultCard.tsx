import React from 'react';
import type { AnalysisResult } from '../types';

interface ResultCardProps {
  result: AnalysisResult;
}

const getConfidenceClasses = (confidence: string): { bg: string, text: string, border: string } => {
    switch(confidence.toLowerCase()) {
        case 'high':
            return { 
                bg: 'bg-success-light dark:bg-emerald-950/40', 
                text: 'text-success-text dark:text-emerald-400', 
                border: 'border-success dark:border-emerald-600' 
            };
        case 'medium':
            return { 
                bg: 'bg-warning-light dark:bg-amber-950/40', 
                text: 'text-warning-text dark:text-amber-400', 
                border: 'border-warning dark:border-amber-600' 
            };
        case 'low':
            return { 
                bg: 'bg-danger-light dark:bg-rose-950/40', 
                text: 'text-danger-text dark:text-rose-400', 
                border: 'border-danger dark:border-rose-600' 
            };
        default:
            return { 
                bg: 'bg-slate-100 dark:bg-slate-800/80', 
                text: 'text-slate-800 dark:text-slate-300', 
                border: 'border-slate-200 dark:border-slate-700' 
            };
    }
}

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block text-text-secondary dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const confidenceClasses = getConfidenceClasses(result.confidence);
  return (
    <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in border border-border/60 dark:border-slate-700/60 transition-colors">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b border-border dark:border-slate-750 pb-4 mb-6">
            <div>
                <p className="text-sm font-medium text-text-secondary dark:text-slate-400">Potential Condition</p>
                <h2 className="text-3xl font-extrabold text-primary mt-1">{result.conditionName}</h2>
            </div>
            <div className="mt-4 md:mt-0 text-left md:text-right">
                <p className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">AI Confidence Level</p>
                <span className={`px-4 py-1.5 text-sm font-bold rounded-full ${confidenceClasses.bg} ${confidenceClasses.text}`}>
                    {result.confidence}
                </span>
            </div>
        </div>

        <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100 mb-2 flex items-center"><InfoIcon />Description</h3>
            <p className="text-text-secondary dark:text-slate-300 leading-relaxed">{result.description}</p>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100 mb-3">Recommendations</h3>
            <ul className="space-y-3">
                {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                        <CheckCircleIcon />
                        <span className="ml-3 text-text-secondary dark:text-slate-300 leading-relaxed">{rec}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );
};