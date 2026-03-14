"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/orderStore";

type StoreOffer = {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  quantityAvailable: number;
};

type StoreData = {
  id: string;
  name: string;
  address: string;
  image: string;
  opens_at: string;
  closes_at: string;
  offers: StoreOffer[];
};

export default function StoreClient({ store }: { store: StoreData }) {
  const router = useRouter();
  
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔥 NOU: Starea pentru a ști dacă magazinul e deschis ACUM
  const [isOpen, setIsOpen] = useState(true);

  // 🔥 NOU: Logica care verifică ora curentă (se actualizează singură)
  useEffect(() => {
    const checkOpenStatus = () => {
      if (!store.opens_at || !store.closes_at) return;
      
      const now = new Date();
      // Formatăm ora curentă ca "HH:MM" (ex: "09:05" sau "14:30")
      const currentHour = now.getHours().toString().padStart(2, "0");
      const currentMinute = now.getMinutes().toString().padStart(2, "0");
      const currentTimeStr = `${currentHour}:${currentMinute}`;

      // Verificăm dacă ora curentă este între ora de deschidere și cea de închidere
      if (store.closes_at < store.opens_at) {
        // Cazul rar în care magazinul se închide după miezul nopții (ex: 10:00 - 02:00)
        setIsOpen(currentTimeStr >= store.opens_at || currentTimeStr <= store.closes_at);
      } else {
        // Cazul normal (ex: 08:00 - 20:00)
        setIsOpen(currentTimeStr >= store.opens_at && currentTimeStr < store.closes_at);
      }
    };

    checkOpenStatus(); // Verificăm instant când se încarcă pagina
    
    // Setăm un interval să verifice din nou în fiecare minut,
    // în caz că utilizatorul stă mult pe pagină și se face ora închiderii
    const interval = setInterval(checkOpenStatus, 60000);
    return () => clearInterval(interval);
  }, [store.opens_at, store.closes_at]);

  const toggleOffer = (offerId: string) => {
    setConfirmingId(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setExpandedOfferId((prev) => (prev === offerId ? null : offerId));
  };

  const handleReserve = async (offer: StoreOffer) => {
    setIsProcessing(true);
    try {
      const { data: orderDataArray, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: store.id,
          total_amount: offer.price,
          status: "RESERVED",
          payment_method: "AT_STORE"
        })
        .select();

      if (orderError) throw orderError;
      
      const orderData = orderDataArray?.[0];
      if (!orderData) throw new Error("Comanda nu a putut fi returnată de baza de date.");

      const { error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: orderData.id,
          offer_id: offer.id,
          quantity: 1,
          price_at_purchase: offer.price
        });

      if (itemError) throw itemError;

      router.push(`/orders/${orderData.id}`);
    } catch (error) {
      console.error("Eroare detaliată la rezervare:", JSON.stringify(error, null, 2));
      alert("A apărut o eroare la plasarea comenzii. Încearcă din nou.");
      setIsProcessing(false);
      setConfirmingId(null);
    }
  };

  const onButtonClick = (offer: StoreOffer) => {
    if (confirmingId === offer.id) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      handleReserve(offer);
    } else {
      setConfirmingId(offer.id);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setConfirmingId(null);
      }, 4000);
    }
  };

  const offers = store.offers || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 dark:bg-[#0a0a0a]">
      {/* HEADER */}
      <div className="relative h-64 w-full sm:h-80">
        <img 
          src={store.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80"} 
          alt={store.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        <button 
          onClick={() => router.push('/')}
          className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
        >
          &larr;
        </button>

        <div className="absolute bottom-0 left-0 w-full p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            {/* 🔥 FIX ANTI-GLONȚ PENTRU CULOAREA DE FUNDAL */}
            <span 
              style={{ backgroundColor: isOpen ? "#10b981" : "#ef4444" }}
              className="rounded-md px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-sm"
            >
              {isOpen 
                ? `Deschis: ${store.opens_at} - ${store.closes_at}` 
                : `Închis (Deschide la ${store.opens_at})`
              }
            </span>
          </div>
          <h1 className="text-3xl font-black sm:text-4xl drop-shadow-lg">{store.name}</h1>
          <p className="mt-2 text-sm font-medium opacity-90 drop-shadow-md flex items-center gap-2">
            <span>📍</span> {store.address}
          </p>
        </div>
      </div>

      {/* BODY: Lista de Pachete */}
      <div className="mx-auto max-w-3xl p-6">
        <h2 className="mb-6 text-2xl font-black text-gray-900 dark:text-white">Pachete Disponibile</h2>
        
        {offers.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-4xl">😔</span>
            <p className="mt-4 font-medium text-gray-500 dark:text-gray-400">Momentan nu sunt oferte salvate aici.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => {
              const isExpanded = expandedOfferId === offer.id;
              const isConfirming = confirmingId === offer.id;
              const savedMoney = offer.originalPrice - offer.price;

              return (
                <div 
                  key={offer.id} 
                  className={`overflow-hidden rounded-[24px] border transition-all duration-300 ${
                    isExpanded 
                      ? "border-emerald-500 bg-white shadow-lg dark:border-emerald-500/50 dark:bg-neutral-900" 
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                  }`}
                >
                  <div 
                    onClick={() => toggleOffer(offer.id)}
                    className="flex cursor-pointer select-none items-center justify-between p-5 sm:p-6"
                  >
                    <div className="flex-1 pr-4">
                      <h3 className="font-bold text-gray-900 dark:text-white sm:text-lg">{offer.title}</h3>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 mt-1">
                        Doar {offer.quantityAvailable} pachete rămase!
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block text-[10px] font-bold uppercase text-gray-400">Astăzi</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white">{offer.price} RON</span>
                      </div>
                      
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 transition-transform duration-300 dark:bg-neutral-800 ${isExpanded ? "rotate-180" : ""}`}>
                        <svg width="12" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-dashed border-gray-100 p-5 pt-4 sm:p-6 dark:border-neutral-800">
                        
                        <div className="mb-6 rounded-2xl bg-gray-50 p-4 dark:bg-neutral-800/50">
                          <div className="mb-4 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-neutral-700">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm dark:bg-neutral-800">🏪</div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pachet pregătit de</p>
                              <p className="font-bold text-gray-900 dark:text-white">{store.name}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-500 dark:text-gray-400">Preț inițial în magazin:</span>
                            <span className="font-bold text-gray-400 line-through dark:text-gray-500">{offer.originalPrice} RON</span>
                          </div>
                          <div className="mt-2 flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-500 dark:text-gray-400">Prețul tău salvat:</span>
                            <span className="font-bold text-gray-900 dark:text-white">{offer.price} RON</span>
                          </div>
                          <div className="mt-3 flex justify-between items-center rounded-lg bg-emerald-100/50 px-3 py-2 dark:bg-emerald-900/20">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Economisești:</span>
                            <span className="font-black text-emerald-700 dark:text-emerald-400">{savedMoney} RON</span>
                          </div>
                        </div>

                        {/* Buton de plată care este DEZACTIVAT dacă magazinul e închis */}
                        <button 
                          disabled={isProcessing || offer.quantityAvailable <= 0 || !isOpen}
                          onClick={() => onButtonClick(offer)}
                          style={{
                            backgroundColor: (isProcessing || !isOpen) ? "#9ca3af" : (isConfirming ? "#f97316" : "#059669"),
                            boxShadow: (isProcessing || !isOpen) ? "none" : (isConfirming ? "0 10px 15px -3px rgba(249, 115, 22, 0.3)" : "0 10px 15px -3px rgba(5, 150, 105, 0.3)")
                          }}
                          className={`w-full rounded-xl py-4 font-bold text-white transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed ${isConfirming ? "animate-pulse" : ""}`}
                        >
                          {!isOpen 
                            ? "Magazin Închis" 
                            : isProcessing 
                              ? "Se procesează..." 
                              : isConfirming 
                                ? "Ești sigur? Apasă pentru a confirma!" 
                                : "Rezervă și Ridică la Locație"}
                        </button>
                        
                        <p className="mt-3 text-center text-xs text-gray-400">
                          {isConfirming ? "Ai 4 secunde să confirmi comanda." : `Nu ai nevoie de card. Plătești direct la ${store.name}.`}
                        </p>

                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}