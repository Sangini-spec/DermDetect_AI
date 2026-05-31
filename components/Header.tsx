import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
    isLoggedIn: boolean;
    onLogout: () => void;
    darkMode: boolean;
    onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout, darkMode, onToggleDarkMode }) => {
  return (
    <header className="bg-surface/85 dark:bg-slate-900/85 backdrop-blur-xl sticky top-0 z-40 border-b border-border/80 dark:border-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-primary-light dark:bg-blue-950 p-2 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.789-2.75 9.565M12 11c0-3.517 1.009-6.789 2.75-9.565M12 11H3.313m8.687 0H20.687" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary dark:text-slate-100 tracking-tight transition-colors">
              DermDetect <span className="text-primary font-extrabold">AI</span>
            </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
              onClick={onToggleDarkMode}
              className="p-2.5 rounded-lg border border-border dark:border-slate-700 text-text-secondary dark:text-slate-400 bg-surface dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme mode"
          >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-500" />}
          </button>

          {isLoggedIn && (
              <button
                  onClick={onLogout}
                  className="px-4 py-2 border border-border dark:border-slate-700 text-sm font-semibold rounded-lg text-text-secondary dark:text-slate-300 bg-surface dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
              >
                  Logout
              </button>
          )}
        </div>
      </div>
    </header>
  );
};