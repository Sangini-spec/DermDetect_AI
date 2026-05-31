import React from 'react';

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

export const Disclaimer: React.FC = () => {
  return (
    <div className="bg-secondary-light border-l-4 border-secondary p-4 rounded-r-lg mt-8 animate-fade-in">
        <div className="flex">
            <div className="flex-shrink-0 pt-0.5">
                <AlertIcon />
            </div>
            <div className="ml-3">
                <p className="text-sm font-bold text-secondary-text-dark">Important Medical Disclaimer</p>
                <p className="mt-1 text-sm text-secondary-text">
                    This tool is an AI-powered assistant and does not provide medical advice. The analysis is for informational purposes only. It is not a substitute for a professional medical diagnosis. Please consult a qualified healthcare provider or dermatologist for any health concerns.
                </p>
            </div>
        </div>
    </div>
  );
};