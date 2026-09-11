import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  const toggleTheme = () => {
    setIsHighContrast(!isHighContrast);
  };

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors flex items-center justify-center shadow-sm"
      title={isHighContrast ? 'Switch to Standard Dark Mode' : 'Switch to High-Contrast Mode'}
    >
      {isHighContrast ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-blue-400" />
      )}
    </button>
  );
}
