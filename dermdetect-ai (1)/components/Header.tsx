import React from 'react';

interface HeaderProps {
    isLoggedIn: boolean;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout }) => {
  return (
    <header className="bg-surface/80 backdrop-blur-xl sticky top-0 z-40 border-b border-border/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-primary-light p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.789-2.75 9.565M12 11c0-3.517 1.009-6.789 2.75-9.565M12 11H3.313m8.687 0H20.687" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              DermDetect <span className="text-primary font-extrabold">AI</span>
            </h1>
        </div>
        {isLoggedIn && (
            <button
                onClick={onLogout}
                className="px-4 py-2 border border-border text-sm font-medium rounded-lg text-text-secondary bg-surface hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
                Logout
            </button>
        )}
      </div>
    </header>
  );
};