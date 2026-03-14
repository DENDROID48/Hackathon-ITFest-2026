"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

type OrderDetails = {
  id: string;
  storeName: string;
  storeAddress: string;
  total: number;
  items: { title: string; qty: number; price: number }[];
  pickupEnd: string;
};

export default function OrderSuccessClient({ order }: { order: OrderDetails }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timeLeft, setTimeLeft] = useState("2h 30m");

  useEffect(() => {
    if (!order?.id) return;

    // Definim funcția async în interior
    const runConfetti = async () => {
      // Import dinamic pentru a evita erorile de SSR ("window is not defined")
      const confettiModule = await import("canvas-confetti");
      const confetti = confettiModule.default;

      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      // ✅ FIX FINAL: Folosim 'window.setInterval' explicit
      // TypeScript știe acum că returnează un 'number', deci nu mai avem nevoie de 'any'
      const intervalId = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return window.clearInterval(intervalId);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      // Cleanup function
      return () => window.clearInterval(intervalId);
    };

    // Pornim animația
    runConfetti();
  }, [order]); // Rulează când se schimbă comanda

  // SAFEGUARD
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black">
        <p className="dark:text-white">Se încarcă detaliile comenzii...</p>
      </div>
    );
  }

  // Date sigure
  const safeId = order.id || "N/A";
  const displayId = safeId.length > 8 ? safeId.slice(0, 8).toUpperCase() : safeId;

  return (
    <main className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4 py-12 dark:bg-[#000]">
      
      <div className="w-full max-w-md space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
        
        {/* TITLU */}
        <div className="text-center space-y-2">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-4xl mb-4 shadow-lg shadow-emerald-200 dark:bg-emerald-900/30 dark:shadow-none animate-bounce">
                🎉
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Comandă Confirmată!</h1>
            <p className="text-gray-500 font-medium">Mulțumim că salvezi mâncarea.</p>
        </div>

        {/* TICHET */}
        <div className="relative bg-white rounded-[32px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:bg-[#1A1A1A]">
            
            {/* Header Verde cu QR */}
            <div className="bg-emerald-600 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                
                <div className="relative z-10 bg-white p-4 rounded-3xl shadow-xl inline-block mx-auto mb-4">
                    {order.id ? (
                        <QRCodeSVG value={order.id} size={180} />
                    ) : (
                        <div className="h-[180px] w-[180px] bg-gray-200 animate-pulse rounded-xl" />
                    )}
                </div>
                <p className="text-emerald-100 text-sm font-medium uppercase tracking-widest mb-1">Scanează la ridicare</p>
                <p className="text-white font-bold text-lg">ID: {displayId}</p>
            </div>

            {/* Linie de rupere */}
            <div className="relative flex items-center justify-between px-4 -mt-3">
                <div className="h-6 w-6 rounded-full bg-[#F2F2F7] dark:bg-black"></div>
                <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-2 dark:border-gray-700"></div>
                <div className="h-6 w-6 rounded-full bg-[#F2F2F7] dark:bg-black"></div>
            </div>

            {/* Detalii Comandă */}
            <div className="p-8 pt-4">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Magazin</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{order.storeName || "Magazin"}</h3>
                        <p className="text-sm text-gray-500">{order.storeAddress || "Adresă indisponibilă"}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ridicare Până la</p>
                        <p className="text-xl font-bold text-red-500">{order.pickupEnd || "20:00"}</p>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 dark:bg-white/5 dark:border-white/5">
                    {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between py-1 text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                    <span className="font-bold text-black dark:text-white">{item.qty}x</span> {item.title}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white">{(item.price || 0).toFixed(2)} MDL</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-2">Fără produse</p>
                    )}
                    
                    <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-lg dark:border-white/10">
                        <span className="text-gray-900 dark:text-white">Total</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{(order.total || 0).toFixed(2)} MDL</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.storeAddress || "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-black font-bold text-sm hover:bg-gray-200 transition dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                    >
                        🗺️ Navighează
                    </a>
                    <Link 
                        href="/"
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white font-bold text-sm hover:bg-gray-800 transition dark:bg-white dark:text-black"
                    >
                        🏠 Acasă
                    </Link>
                </div>
            </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
            Arată acest cod QR personalului magazinului.
        </p>

      </div>
    </main>
  );
}
