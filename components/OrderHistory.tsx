"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/orderStore";

// Tipuri pentru a păstra TypeScript-ul fericit
type OrderItem = {
  offer_id: string;
  quantity: number;
  price_at_purchase: number;
};

type StoreOffer = {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
};

type OrderData = {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  stores: {
    name: string;
    image: string;
    offers: StoreOffer[];
  };
  order_items: OrderItem[];
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stocăm ID-urile comenzilor care sunt "deschise" (roll-down)
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchAllOrders() {
      // Tragem comenzile, detaliile magazinului (inclusiv ofertele JSON) și itemele cumpărate
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, created_at, total_amount, status,
          stores ( name, image, offers ),
          order_items ( offer_id, quantity, price_at_purchase )
        `)
        .order("created_at", { ascending: false }); // Cele mai noi primele

      if (error) {
        console.error("Eroare la fetch istoric comenzi:", error);
      } else {
        setOrders(data as unknown as OrderData[]);
      }
      setLoading(false);
    }

    fetchAllOrders();
  }, []);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ro-RO", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-emerald-500"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center p-12 bg-white dark:bg-neutral-900 rounded-[24px] border border-gray-200 dark:border-neutral-800">
        <span className="text-4xl">🛍️</span>
        <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Nu ai nicio comandă încă</h3>
        <p className="text-gray-500">Salvează primul tău pachet pentru a-l vedea aici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white">Istoric Comenzi</h2>
      
      {orders.map((order) => {
        const isExpanded = expandedOrders[order.id];
        // Ne asigurăm că extragem corect magazinul (Supabase poate returna array sau obiect la relații 1-to-1)
        const store = Array.isArray(order.stores) ? order.stores[0] : order.stores;
        const storeOffers = store?.offers || [];

        // Calculăm banii salvați total pentru această comandă
        let totalOriginalValue = 0;

        return (
          <div 
            key={order.id} 
            className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-[24px] overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md"
          >
            {/* PARTEA VIZIBILĂ MEREU (HEADER) */}
            <div 
              onClick={() => toggleExpand(order.id)}
              className="p-5 flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {store?.image ? (
                    <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🏪</div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{store?.name || "Magazin Necunoscut"}</h3>
                  <p className="text-xs text-gray-500 font-medium">{formatDate(order.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="font-black text-gray-900 dark:text-white">{order.total_amount.toFixed(2)} RON</p>
                  <p className={`text-xs font-bold ${order.status === 'RESERVED' ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {order.status === 'RESERVED' ? 'ACTIVĂ' : 'FINALIZATĂ'}
                  </p>
                </div>
                {/* Săgeata care se rotește */}
                <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* PARTEA ASCUNSĂ (ROLL-DOWN) */}
            <div 
              className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="p-5 pt-0 border-t border-dashed border-gray-200 dark:border-neutral-800 mt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 my-4">Detalii Produse</p>
                  
                  <div className="space-y-4">
                    {order.order_items.map((item, idx) => {
                      // Căutăm oferta originală în JSON-ul magazinului bazat pe offer_id
                      const matchedOffer = storeOffers.find(o => o.id === item.offer_id);
                      
                      // Fallbacks în caz că oferta a fost ștearsă din meniul magazinului între timp
                      const title = matchedOffer?.title || "Produs Salvat (Ofertă Veche)";
                      const originalPrice = matchedOffer?.originalPrice || (item.price_at_purchase * 3); // estimare dacă lipsește
                      
                      totalOriginalValue += (originalPrice * item.quantity);

                      return (
                        <div key={idx} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 dark:bg-neutral-800 text-xs font-bold text-gray-700 dark:text-gray-300">
                              {item.quantity}x
                            </span>
                            <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{title}</span>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-xs text-gray-400 line-through mr-2">{(originalPrice * item.quantity).toFixed(2)} RON</span>
                            <span className="font-bold text-sm text-gray-900 dark:text-white">{(item.price_at_purchase * item.quantity).toFixed(2)} RON</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* BANNER BANI SALVAȚI */}
                  <div className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex justify-between items-center">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Total Bani Salvați:</span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                      {(totalOriginalValue - order.total_amount).toFixed(2)} RON 🎉
                    </span>
                  </div>

                </div>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}