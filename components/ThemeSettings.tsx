"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

useEffect(() => {
    // Folosim window.setTimeout pentru a face actualizarea stării asincronă.
    // Acest lucru liniștește linter-ul React, evitând randările în cascadă (cascading renders)
    // în exact același ciclu de execuție.
    const timerId = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    // Cleanup funcție obligatorie pentru type-safety și memorie
    return () => window.clearTimeout(timerId);
  }, []);

  if (!mounted) {
    return <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-2xl animate-pulse"></div>;
  }

  // Helper pentru a simplifica clasele dinamice. 
  // O funcție mică, strict tipizată, previne erorile umane în string-urile Tailwind.
  const getButtonClasses = (option: "light" | "dark" | "system") => {
    const isActive = theme === option;
    
    // Clasele de bază (layout, forme, tranziții)
    const baseClasses = "relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 group";
    
    // Starea ACTIVĂ: border verde, fundal ușor nuanțat, adaptat pentru zi și noapte
    const activeClasses = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
    
    // Starea INACTIVĂ: alb/negru curat, hover blând
    const inactiveClasses = "border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800";

    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const getIconContainerClasses = (option: "light" | "dark" | "system", colorClasses: string) => {
    const isActive = theme === option;
    const base = "w-10 h-10 mb-3 rounded-full flex items-center justify-center transition-colors duration-300";
    // Dacă e activ sau are hover, îi dăm culoarea specifică. Altfel, rămâne gri discret.
    const activeOrHover = isActive ? colorClasses : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 group-hover:" + colorClasses.split(' ').join(' group-hover:');
    
    return `${base} ${activeOrHover}`;
  };

  const getTextClasses = (option: "light" | "dark" | "system") => {
    const isActive = theme === option;
    return `text-sm font-bold transition-colors duration-300 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`;
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Aspect Aplicație
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* === OPȚIUNEA 1: LIGHT === */}
        <button onClick={() => setTheme("light")} className={getButtonClasses("light")}>
          <div className={getIconContainerClasses("light", "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>
          </div>
          <span className={getTextClasses("light")}>Luminos</span>
          {theme === 'light' && (
            <div className="absolute top-3 right-3 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center animate-in zoom-in duration-200">
               <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          )}
        </button>

        {/* === OPȚIUNEA 2: DARK === */}
        <button onClick={() => setTheme("dark")} className={getButtonClasses("dark")}>
          <div className={getIconContainerClasses("dark", "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          </div>
          <span className={getTextClasses("dark")}>Întunecat</span>
          {theme === 'dark' && (
            <div className="absolute top-3 right-3 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center animate-in zoom-in duration-200">
               <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          )}
        </button>

        {/* === OPȚIUNEA 3: AUTO === */}
        <button onClick={() => setTheme("system")} className={getButtonClasses("system")}>
          <div className={getIconContainerClasses("system", "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
          </div>
          <span className={getTextClasses("system")}>Auto</span>
          {theme === 'system' && (
            <div className="absolute top-3 right-3 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center animate-in zoom-in duration-200">
               <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          )}
        </button>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 px-1 font-medium">
        *Opțiunea &quot;Auto&quot; va sincroniza tema cu setările dispozitivului tău.
      </p>
    </div>
  );
}
