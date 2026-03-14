"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, getUserOrders, type Order } from "@/lib/orderStore";

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setError("Trebuie să fii autentificat pentru a vedea comenzile.");
          setLoading(false);
          return;
        }

        const userOrders = await getUserOrders(session.user.id);
        setOrders(userOrders);
      } catch (err) {
        setError("A apărut o eroare la încărcarea comenzilor.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 dark:bg-neutral-800 h-32 rounded-3xl w-full"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-[32px] border border-gray-100 dark:border-neutral-800">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Eroare</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
        <Link href="/login" className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform inline-block">
          Mergi la Autentificare
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-neutral-900/50 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-neutral-800">
        <div className="text-6xl mb-6 opacity-80">🛍️</div>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Nicio comandă încă!</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Nu ai plasat nicio comandă până acum. Descoperă ofertele din apropierea ta și salvează mâncarea delicioasă!
        </p>
        <Link href="/" className="bg-emerald-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-600 hover:scale-105 transition-all shadow-lg shadow-emerald-200 dark:shadow-none inline-block">
          Explorează Harta
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const orderDate = new Date(order.createdAt).toLocaleDateString("ro-RO", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Determine status styling
        let statusColor = "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300";
        let statusLabel = "Necunoscut";

        if (order.status === "RESERVED") {
          statusColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
          statusLabel = "Rezervată";
        } else if (order.status === "COMPLETED") {
          statusColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
          statusLabel = "Ridicată";
        } else if (order.status === "CANCELLED") {
          statusColor = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
          statusLabel = "Anulată";
        }

        return (
          <Link
            href={`/orders/${order.id}`}
            key={order.id}
            className="block group"
          >
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-[24px] border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                {/* Info Vanzare */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                      {statusLabel}
                    </span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {orderDate}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Spre Detalii Comandă ➔
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                    ID: {order.id.split('-')[0]}***
                  </p>
                </div>

                {/* Pret */}
                <div className="bg-gray-50 dark:bg-neutral-800/50 px-5 py-3 rounded-2xl sm:text-right border border-gray-100 dark:border-neutral-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total plată</div>
                  <div className="font-black text-2xl text-emerald-600 dark:text-emerald-400">
                    {order.total} <span className="text-sm">RON</span>
                  </div>
                </div>

              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
