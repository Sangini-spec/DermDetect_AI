import React from 'react';
import type { AnalysisResult } from '../types';

interface ResultCardProps {
  result: AnalysisResult;
}

const getConfidenceClasses = (confidence: string): { bg: string, text: string, border: string } => {
    switch(confidence.toLowerCase()) {
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

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
    <div className="bg-surface rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in border border-border/60">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b border-border pb-4 mb-6">
            <div>
                <p className="text-sm font-medium text-text-secondary">Potential Condition</p>
                <h2 className="text-3xl font-extrabold text-primary mt-1">{result.conditionName}</h2>
            </div>
            <div className="mt-4 md:mt-0 text-left md:text-right">
                <p className="text-sm font-medium text-text-secondary mb-2">AI Confidence Level</p>
                <span className={`px-4 py-1.5 text-sm font-semibold rounded-full ${confidenceClasses.bg} ${confidenceClasses.text}`}>
                    {result.confidence}
                </span>
            </div>
        </div>

        <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center"><InfoIcon />Description</h3>
            <p className="text-text-secondary leading-relaxed">{result.description}</p>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Recommendations</h3>
            <ul className="space-y-3">
                {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                        <CheckCircleIcon />
                        <span className="ml-3 text-text-secondary leading-relaxed">{rec}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );
};