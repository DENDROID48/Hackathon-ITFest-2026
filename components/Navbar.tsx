"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/orderStore";
import { User } from "@supabase/supabase-js";

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Stări
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ------------------------------------------------------------------
  // 1. EFECT PRINCIPAL: Date + Evenimente (Totul într-un loc)
  // ------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true; // Previne actualizările dacă componenta nu mai e pe ecran

    // A. Funcția de încărcare (Definită AICI pentru a rupe bucla infinită)
    const fetchSessionAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user || null;

        if (!isMounted) return;
        
        // Actualizăm User-ul
        setUser(currentUser);

        if (currentUser) {
          // Luăm profilul doar dacă avem user
          const { data, error } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", currentUser.id)
            .maybeSingle();
          
          if (!isMounted) return;

          if (!error && data) {
            setProfile(data as unknown as UserProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Navbar Error:", error);
      }
    };

    // B. Executăm imediat la montare
    fetchSessionAndProfile();

    // C. Ascultăm evenimentul CUSTOM (din Setări)
    const handleProfileUpdate = () => {
      console.log("Navbar: Refreshing profile...");
      fetchSessionAndProfile();
    };
    window.addEventListener("profile-updated", handleProfileUpdate);

    // D. Ascultăm evenimentele SUPABASE (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchSessionAndProfile();
      }
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
            setUser(null);
            setProfile(null);
            router.refresh();
            router.push("/login");
        }
      }
    });

    // Cleanup
    return () => {
      isMounted = false;
      window.removeEventListener("profile-updated", handleProfileUpdate);
      authListener.subscription.unsubscribe();
    };
  }, [router]); // ✅ Dependențe minime (doar router), fără funcții externe!


  // ------------------------------------------------------------------
  // 2. EFECT SECUNDAR: Doar UI (Scroll)
  // ------------------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  // ------------------------------------------------------------------
  // HELPERS & RENDER
  // ------------------------------------------------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getInitials = () => {
    if (profile?.full_name) return profile.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "Q";
  };

  const isActive = (path: string) => 
    pathname === path 
      ? "text-black dark:text-white font-bold bg-gray-100/50 dark:bg-neutral-800/50" 
      : "text-gray-500 dark:text-gray-400 font-medium hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800";

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled 
            ? "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-gray-200 dark:border-neutral-800 shadow-sm py-2" 
            : "bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border-transparent py-4"
        }`}
        style={{
          WebkitBackdropFilter: scrolled ? "blur(24px)" : "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-14">
            
            {/* LOGO */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black text-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                ⚡
              </div>
              <span className="font-black text-2xl tracking-tighter text-gray-900 dark:text-white">
                Quick<span className="text-emerald-600 dark:text-emerald-500">Eets</span>.
              </span>
            </Link>

            {/* DESKTOP MENU */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100/50 dark:bg-neutral-800/50 p-1.5 rounded-full border border-gray-200/50 dark:border-neutral-700/50 backdrop-blur-sm">
              <Link href="/" className={`px-5 py-2 rounded-full text-sm transition-all duration-200 ${isActive('/')}`}>
                Hartă 🗺️
              </Link>
              <Link href="/orders" className={`px-5 py-2 rounded-full text-sm transition-all duration-200 ${isActive('/orders')}`}>
                Comenzi 📦
              </Link>
            </div>

            {/* USER ACTIONS */}
            <div className="hidden md:flex items-center gap-5">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link href="/merchant" className="hidden lg:flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold rounded-full text-xs hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">
                    🏪 Mod Comerciant
                  </Link>
                  <Link href="/settings" className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-neutral-700 group">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-emerald-200 transition-all">
                      {getInitials()}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-900 dark:text-white leading-none mb-0.5">
                        {profile?.full_name?.split(" ")[0] || "Salut!"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        Contul Meu
                      </span>
                    </div>
                  </Link>
                </div>
              ) : (
                <Link href="/login" className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 hover:scale-105 transition-all shadow-lg shadow-gray-200 dark:shadow-none">
                  Intră în Cont
                </Link>
              )}
            </div>

            {/* MOBILE BUTTON */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-black dark:text-white transition"
            >
              <span className="text-2xl">{isMenuOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl pt-24 px-6 md:hidden animate-in fade-in slide-in-from-bottom-10 duration-200">
          <div className="flex flex-col gap-4">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black text-gray-900 dark:text-white py-4 border-b border-gray-100 dark:border-neutral-800">
              🗺️ Harta Interactivă
            </Link>
            <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black text-gray-900 dark:text-white py-4 border-b border-gray-100 dark:border-neutral-800">
              📦 Istoric Comenzi
            </Link>
            
            <div className="mt-8">
              {user ? (
                <div className="bg-gray-50 dark:bg-neutral-800 p-6 rounded-3xl border border-gray-100 dark:border-neutral-700">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {getInitials()}
                    </div>
                    <div>
                      <div className="font-bold text-lg dark:text-white">{profile?.full_name || "Utilizator"}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </div>
                  <Link href="/merchant" onClick={() => setIsMenuOpen(false)} className="block w-full text-center bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 py-3 rounded-xl font-bold mb-3">
                    🏪 Panou Comerciant
                  </Link>
                  <Link href="/settings" onClick={() => setIsMenuOpen(false)} className="block w-full text-center bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold mb-3">
                    Setări Profil
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-center text-red-500 dark:text-red-400 font-bold py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
                    Deconectare
                  </button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block w-full text-center bg-emerald-600 dark:bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 dark:shadow-none">
                  Autentificare
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
