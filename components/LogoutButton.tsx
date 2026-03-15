"use client";

import { supabase } from "@/lib/orderStore";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login"); // Fallback routing although navbar auth listener handles this as well
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="mt-6 w-full sm:w-auto bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-3 px-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-200 dark:border-red-800/30 flex items-center justify-center gap-2 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      {isLoggingOut ? "Se deconectează..." : "Deconectare"}
    </button>
  );
}
