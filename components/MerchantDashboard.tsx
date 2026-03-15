"use client";

import { useState, useEffect } from "react";
import { type StoreData, type StoreOffer, getStoreByOwner, addOfferToStore, removeOfferFromStore, updateOfferInStore, getStoreOrders, updateOrderStatus, supabase } from "@/lib/merchantStore";

// Tip pentru comenzile magazinului
type StoreOrder = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  pickup_time?: string;
  user_id: string;
  order_items: { quantity: number; price_at_purchase: number; offer_id: string }[];
};

export default function MerchantDashboard() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPartner, setIsPartner] = useState(true);

  // Funcționalități V2: Comenzi și Statistici
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [orderFilter, setOrderFilter] = useState<'active' | 'history'>('active');
  const [stats, setStats] = useState({ totalRevenue: 0, packagesSaved: 0, co2Saved: 0 });

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pickupTime, setPickupTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editingOffer, setEditingOffer] = useState<StoreOffer | null>(null);

  useEffect(() => {
    async function loadStore() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setError("Trebuie să fii autentificat pentru a accesa panoul comerciantului.");
          setLoading(false);
          return;
        }

        const storeData = await getStoreByOwner(session.user.id);
        
        if (!storeData) {
          setIsPartner(false);
        } else {
          setStore(storeData);
          
          // Încarcă și calculează statisticile și comenzile
          const storeOrders = await getStoreOrders(storeData.id);
          setOrders(storeOrders);
          
          let revenue = 0;
          let packages = 0;
          
          storeOrders
            .filter((order: any) => order.status === 'COMPLETED')
            .forEach((order: any) => {
              revenue += Number(order.total_amount);
              order.order_items?.forEach((item: any) => {
                packages += Number(item.quantity || 1);
              });
            });
          
          setStats({
            totalRevenue: revenue,
            packagesSaved: packages,
            co2Saved: +(packages * 2.5).toFixed(1) // Apoximativ 2.5kg CO2 pe pachet
          });
        }
      } catch (err: any) {
        setError(err.message || "A apărut o eroare la încărcarea datelor.");
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, []);

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setIsSubmitting(true);

    const newOffer = {
      title,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice),
      quantityAvailable: parseInt(quantity, 10),
      pickupTime: pickupTime || "Specificați la telefon",
    };

    const addedOffer = await addOfferToStore(store.id, newOffer);
    
    if (addedOffer) {
      // Optimistic update with the REAL ID
      setStore({
        ...store,
        offers: [...(store.offers || []), addedOffer]
      });
      setIsAdding(false);
      setTitle("");
      setPrice("");
      setOriginalPrice("");
      setQuantity("1");
      setPickupTime("");
    } else {
      alert("A apărut o eroare la salvarea pachetului.");
    }
    setIsSubmitting(false);
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteOffer = async (offerId: string) => {
    if (!store) return;
    if (!confirm("Sigur dorești să ștergi acest pachet?")) return;

    setDeletingId(offerId);
    const success = await removeOfferFromStore(store.id, offerId);

    if (success) {
      setStore(prev => prev ? { ...prev, offers: prev.offers.filter(o => o.id !== offerId) } : prev);
    } else {
      alert("A apărut o eroare la ștergerea pachetului. Încearcă din nou.");
    }
    setDeletingId(null);
  };

  const handleEditOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !editingOffer) return;
    setIsSubmitting(true);

    // Optimistic update
    setStore(prev => prev ? { ...prev, offers: prev.offers.map(o => o.id === editingOffer.id ? editingOffer : o) } : prev);

    const success = await updateOfferInStore(store.id, editingOffer);
    if (!success) {
      alert("A apărut o eroare la salvarea modificărilor.");
      // Revert
      setStore(prev => prev ? { ...prev, offers: prev.offers.map(o => o.id === editingOffer.id ? o : o) } : prev);
    }

    setIsSubmitting(false);
    setEditingOffer(null);
  };

  const handleCloneOffer = async (offer: StoreOffer) => {
    if (!store) return;

    const cloned = await addOfferToStore(store.id, {
      title: offer.title,
      price: offer.price,
      originalPrice: offer.originalPrice,
      quantityAvailable: offer.quantityAvailable,
      pickupTime: offer.pickupTime,
    });

    if (cloned) {
      setStore({ ...store, offers: [...(store.offers || []), cloned] });
    } else {
      alert("A apărut o eroare la duplicarea pachetului.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'COMPLETED' | 'CANCELLED') => {
    // Optimistic Update
    setOrders(prev => 
      prev.map(ord => ord.id === orderId ? { ...ord, status: newStatus } : ord)
    );

    const success = await updateOrderStatus(orderId, newStatus);
    if (!success) {
      alert("A apărut o eroare la actualizarea comenzii.");
      // Revert if failed
      setOrders(prev => 
        prev.map(ord => ord.id === orderId ? { ...ord, status: "RESERVED" } : ord)
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-gray-100 dark:bg-neutral-800 h-24 rounded-3xl w-full"></div>
        <div className="bg-gray-100 dark:bg-neutral-800 h-64 rounded-3xl w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-[32px] border border-gray-100 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-red-500 mb-2">Eroare Autentificare</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="text-center py-16 bg-white dark:bg-[#111111] rounded-[32px] border border-gray-100 dark:border-neutral-800 shadow-sm px-6">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          🏪
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
          Devino Partener Quick-Eets
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
          Ai un restaurant, o brutărie sau o cafenea? Alătură-te luptei împotriva risipei alimentare. Vinde excedentul la sfârșitul zilei și recuperează costurile, ajutând în același timp mediul.
        </p>
        <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 shadow-lg shadow-orange-500/20">
          Aplică Acum
        </button>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="bg-white dark:bg-[#111111] p-6 rounded-[32px] border border-gray-100 dark:border-neutral-800 shadow-sm">
      
      {/* DASHBOARD ANALYTICS (V2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
          <div className="text-emerald-500 mb-1 font-bold">💰 Venit Generat</div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalRevenue} <span className="text-lg font-bold text-gray-500">RON</span></div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/30">
          <div className="text-blue-500 mb-1 font-bold">🛍️ Pachete Salvate</div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.packagesSaved}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-800/30">
          <div className="text-green-500 mb-1 font-bold">🌍 CO2 Evitat</div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.co2Saved} <span className="text-lg font-bold text-gray-500">kg</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLOANA 1: INVENTAR (Adăugare oferte) */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">
                Inventar: {store.name}
              </span>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                Pachete Disponibile
              </h2>
            </div>
            
            {!isAdding && (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black font-bold py-2.5 px-5 rounded-full text-sm hover:scale-105 transition-transform"
              >
                + Adaugă Pachet
              </button>
            )}
          </div>

          {isAdding && (
            <form onSubmit={handleAddOffer} className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-5 rounded-2xl mb-6 slide-down">
              <h3 className="font-bold text-base mb-4 text-gray-900 dark:text-white">Creează Pachet Surpriză</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Titlu / Descriere</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="ex: Mix Patiserie + 2 Sandvișuri" className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:text-white transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Preț (RON)</label>
                  <input required type="number" step="0.5" min="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="15" className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:text-white transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Valoare (RON)</label>
                  <input required type="number" step="0.5" min="1" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="45" className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:text-white transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Ridicare</label>
                  <input type="text" value={pickupTime} onChange={e => setPickupTime(e.target.value)} placeholder="ex: 18:00 - 19:30" className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:text-white transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Cantitate</label>
                  <input required type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="2" className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 dark:text-white transition-colors" />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-1.5 text-sm rounded-full font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors">Anulează</button>
                <button disabled={isSubmitting} type="submit" className="bg-emerald-500 text-white text-sm font-bold px-5 py-1.5 rounded-full hover:bg-emerald-600 transition-colors disabled:opacity-50">
                  {isSubmitting ? "Se salvează..." : "Publică"}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {(!store.offers || store.offers.length === 0) ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-300 dark:border-neutral-800">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Niciun pachet activ în acest moment.</p>
              </div>
            ) : (
              store.offers.map((offer) => (
                <div key={offer.id} className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 overflow-hidden">
                  {editingOffer?.id === offer.id ? (
                    // --- INLINE EDIT FORM ---
                    <form onSubmit={handleEditOffer} className="p-4">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="col-span-2">
                          <input required type="text" value={editingOffer.title} onChange={e => setEditingOffer({...editingOffer, title: e.target.value})} className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:text-white" placeholder="Titlu" />
                        </div>
                        <input required type="number" step="0.5" min="1" value={editingOffer.price} onChange={e => setEditingOffer({...editingOffer, price: parseFloat(e.target.value)})} className="bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:text-white" placeholder="Preț (RON)" />
                        <input required type="number" step="0.5" min="1" value={editingOffer.originalPrice} onChange={e => setEditingOffer({...editingOffer, originalPrice: parseFloat(e.target.value)})} className="bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:text-white" placeholder="Valoare (RON)" />
                        <input required type="number" min="0" value={editingOffer.quantityAvailable} onChange={e => setEditingOffer({...editingOffer, quantityAvailable: parseInt(e.target.value)})} className="bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:text-white" placeholder="Cantitate" />
                        <input type="text" value={editingOffer.pickupTime || ''} onChange={e => setEditingOffer({...editingOffer, pickupTime: e.target.value})} className="bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:text-white" placeholder="Ridicare (ex: 18:00-19:30)" />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setEditingOffer(null)} className="px-4 py-1.5 text-xs rounded-full font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800">Anulare</button>
                        <button disabled={isSubmitting} type="submit" className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-emerald-600 disabled:opacity-50">{isSubmitting ? 'Se salvează...' : 'Salvează'}</button>
                      </div>
                    </form>
                  ) : (
                    // --- NORMAL VIEW ---
                    <div className="flex justify-between items-center p-4 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{offer.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{offer.price} RON</span>
                          <span className="bg-gray-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-700 dark:text-gray-300">STOC: {offer.quantityAvailable}</span>
                          {offer.pickupTime && (
                            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-orange-200 dark:border-orange-800/50">
                              ⏱️ {offer.pickupTime}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingOffer(offer)}
                          className="w-8 h-8 flex shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                          title="Editează Pachetul"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleCloneOffer(offer)}
                          className="w-8 h-8 flex shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                          title="Duplichează Pachetul"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          disabled={deletingId === offer.id}
                          className="w-8 h-8 flex shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-40"
                          title="Șterge Pachet"
                        >
                          {deletingId === offer.id ? '…' : '✕'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLOANA 2: COMENZI ACTIVE / ISTORIC */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-100 dark:border-neutral-800 pb-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Comenzi
            </h2>
            <div className="flex bg-gray-100 dark:bg-neutral-900 p-1 rounded-full w-full sm:w-auto">
              <button
                onClick={() => setOrderFilter('active')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-sm font-bold transition-all ${orderFilter === 'active' ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Active
              </button>
              <button
                onClick={() => setOrderFilter('history')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-sm font-bold transition-all ${orderFilter === 'history' ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Istoric
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {(() => {
              const filteredOrders = orders.filter(o => 
                orderFilter === 'active' ? o.status === 'RESERVED' : o.status !== 'RESERVED'
              );

              if (filteredOrders.length === 0) {
                return (
                  <div className="text-center py-8 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-300 dark:border-neutral-800">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {orderFilter === 'active' ? "Nu ai nicio comandă activă în acest moment." : "Istoricul comenzilor este gol."}
                    </p>
                  </div>
                );
              }

              return filteredOrders.map((order) => {
                 let statusColor = "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300";
                 let statusLabel = "Necunoscut";

                 if (order.status === "RESERVED") {
                    statusColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
                    statusLabel = "De ridicat";
                 } else if (order.status === "COMPLETED") {
                    statusColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
                    statusLabel = "Ridicată";
                 } else if (order.status === "CANCELLED") {
                    statusColor = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                    statusLabel = "Anulată";
                 }

                 return (
                  <div key={order.id} className="p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#111111] shadow-sm hover:border-emerald-200 transition-colors flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor} mb-1 inline-block`}>
                          {statusLabel}
                        </span>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Comanda #{order.id.split('-')[0]}</h4>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">{order.total_amount} RON</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-500 font-medium bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                         {order.pickup_time ? `⏱️ Ridicare: ${order.pickup_time}` : "⏱️ Nespecificat"}
                       </span>
                       <span className="text-gray-400 font-medium">
                         {new Date(order.created_at).toLocaleTimeString("ro-RO", { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>

                    {/* ACTIONS */}
                    {order.status === "RESERVED" && (
                      <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100 dark:border-neutral-800">
                         <button 
                           onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                           className="flex-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 py-2 rounded-xl font-bold text-sm transition-colors"
                         >
                           ✅ Finalizare
                         </button>
                         <button 
                           onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                           className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 py-2 rounded-xl font-bold text-sm transition-colors"
                         >
                           ❌ Anulare
                         </button>
                      </div>
                    )}
                  </div>
                 );
              });
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
