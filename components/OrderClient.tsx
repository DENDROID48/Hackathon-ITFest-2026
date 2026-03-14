"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type Order } from "@/lib/orderStore";
// 1. IMPORTĂM BIBLIOTECA DE CONFETI
import confetti from "canvas-confetti";

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString("ro-RO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function OrderClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  // FETCH ORDER LOGIC
  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      type OrderItemDB = { quantity: number; price_at_purchase: number; };

      const { data: orderData, error } = await supabase
        .from("orders")
        .select(`
          *,
          stores ( name, address ),
          order_items ( quantity, price_at_purchase )
        `)
        .eq("id", orderId)
        .single();

      if (error || !orderData) {
        console.error("Eroare la fetch comandă:", error);
        setLoading(false);
        return;
      }

      const storeInfo = Array.isArray(orderData.stores) ? orderData.stores[0] : orderData.stores;
      setStoreName(storeInfo?.name || "Magazin Necunoscut");
      setStoreAddress(storeInfo?.address || "");

      const formatted: Order = {
        id: orderData.id,
        createdAt: orderData.created_at,
        status: orderData.status, 
        storeId: orderData.store_id,
        paymentMethod: orderData.payment_method,
        note: orderData.note,
        items: (orderData.order_items || []).map((item: OrderItemDB) => ({
          qty: item.quantity,
          price: item.price_at_purchase
        })),
        total: orderData.total_amount, 
      };

      setOrder(formatted);
      setLoading(false);
    }

    fetchOrder();
  }, [orderId]);

  // 2. EFECTUL DE CONFETI (Se declanșează când comanda a fost încărcată)
  useEffect(() => {
    // Ne asigurăm că aruncăm confeti doar dacă e o comandă proaspătă/activă
    if (order && order.status === "RESERVED") {
      const duration = 0.5 * 1000; // 3 secunde de petrecere
      const animationEnd = Date.now() + duration;

      const frame = () => {
        // Tunul din stânga
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10B981', '#34D399', '#FCD34D'] // Culorile aplicației tale (Verde & Galben/Portocaliu)
        });
        // Tunul din dreapta
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10B981', '#34D399', '#FCD34D']
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      
      // Pornim animația
      frame();
    }
  }, [order]);

  // RENDER PENTRU LOADING
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-emerald-600 dark:border-neutral-800 dark:border-t-emerald-500"></div>
      </div>
    );
  }

  // RENDER PENTRU EROARE/LIPSĂ COMANDĂ
  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6 text-center dark:bg-[#0a0a0a]">
        <h1 className="text-xl font-bold dark:text-white">Comanda nu a fost găsită</h1>
        <Link href="/" className="mt-4 text-sm underline dark:text-gray-400">Înapoi la Hartă</Link>
      </div>
    );
  }

  const pickupCode = order.id.slice(-5).toUpperCase();
  const isActive = order.status === "RESERVED";

  // RENDER TICHET
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-4 transition-colors duration-300 dark:bg-[#0a0a0a]">
      
      <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-white shadow-2xl transition-all dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
        
        {/* === HEADER === */}
        <div className={`relative px-6 py-8 text-center text-white transition-colors duration-500 ${
            isActive 
            ? "bg-gradient-to-br from-emerald-500 to-emerald-700" 
            : "bg-gradient-to-br from-gray-500 to-gray-700 dark:from-neutral-700 dark:to-neutral-800"
          }`}>
          
          {isActive && (
            <div className="absolute left-1/2 top-4 -translate-x-1/2 transform">
               <span className="flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
                </span>
            </div>
          )}

          <h2 className="mt-2 text-xs font-bold uppercase tracking-[0.2em] opacity-90">
            {isActive ? "GATA DE RIDICARE" : "COMANDĂ FINALIZATĂ"}
          </h2>
          
          <div className="mt-4 text-5xl font-black tracking-tighter drop-shadow-md">
            {pickupCode}
          </div>
          <p className="mt-2 text-xs opacity-90 font-medium">Prezintă codul la casă</p>
        </div>

        {/* === THE NOTCH === */}
        <div className="relative flex items-center justify-between bg-white px-4 dark:bg-neutral-900">
          <div className="-ml-6 h-6 w-6 rounded-full bg-gray-100 dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-neutral-800"></div>
          <div className="h-[2px] w-full border-t-2 border-dashed border-gray-200 dark:border-neutral-700"></div>
          <div className="-mr-6 h-6 w-6 rounded-full bg-gray-100 dark:bg-[#0a0a0a] border-l border-gray-200 dark:border-neutral-800"></div>
        </div>

        {/* === BODY === */}
        <div className="px-6 pb-8 pt-4">
          
          <div className="flex items-center gap-4 border-b border-gray-100 pb-4 dark:border-neutral-800">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-2xl dark:bg-neutral-800">
              🏪
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{storeName}</h3>
              <p className="text-xs text-gray-500 line-clamp-1 dark:text-gray-400">{storeAddress}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-xs font-bold uppercase text-gray-400">Produse Salvate</p>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  <span className="font-bold text-black dark:text-white">{item.qty}x</span> Magic Bag
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Surpriză</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-gray-50 p-4 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</span>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {order.total.toFixed(2)} <span className="text-sm font-bold text-gray-500">RON</span>
              </span>
            </div>
            {order.paymentMethod === "AT_STORE" && isActive && (
               <div className="mt-3 text-center text-xs font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 py-1.5 rounded-lg">
                 Plata se face la locație
               </div>
            )}
          </div>

          <div className="mt-8 text-center flex flex-col items-center">
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
              ID: {order.id.split('-')[0]} • {formatDate(order.createdAt)}
            </p>
            <Link href="/" className="mt-6 inline-block w-full rounded-xl bg-gray-100 dark:bg-neutral-800 py-4 text-sm font-bold text-gray-900 dark:text-white transition-all hover:bg-gray-200 dark:hover:bg-neutral-700 active:scale-95">
              Înapoi la Hartă
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}