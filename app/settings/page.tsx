import { ThemeSettings } from "@/components/ThemeSettings";
import LogoutButton from "@/components/LogoutButton";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Setări Profil
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
            Gestionează preferințele contului tău și aspectul aplicației.
          </p>
        </div>

        {/* SETTINGS CONTENT */}
        <div className="space-y-6">
          
          {/* SECȚIUNEA ASPECT */}
          <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-[32px] border border-gray-100 dark:border-neutral-800 shadow-sm transition-all duration-300">
            <ThemeSettings />
          </div>

          {/* Alte secțiuni (Ex. Date personale, Notificări) pot fi adăugate aici în viitor */}
          <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-[32px] border border-gray-100 dark:border-neutral-800 shadow-sm transition-all duration-300 opacity-90">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🔒</span> Cont și Securitate
             </h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">
               Deconectează-te în siguranță de pe acest dispozitiv.
             </p>
             <LogoutButton />
          </div>

        </div>
      </div>
    </div>
  );
}
