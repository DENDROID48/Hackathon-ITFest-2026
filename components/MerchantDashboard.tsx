"use client";

import { useState, useEffect } from "react";
import { type StoreData, type StoreOffer, getStoreByOwner, addOfferToStore, removeOfferFromStore, supabase } from "@/lib/merchantStore";

export default function MerchantDashboard() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPartner, setIsPartner] = useState(true);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    };

    const success = await addOfferToStore(store.id, store.offers, newOffer);
    
    if (success) {
      // Optimistic update
      setStore({
        ...store,
        offers: [...(store.offers || []), { ...newOffer, id: `tmp_${Date.now()}` }]
      });
      setIsAdding(false);
      setTitle("");
      setPrice("");
      setOriginalPrice("");
      setQuantity("1");
    } else {
      alert("A apărut o eroare la salvarea pachetului.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!store) return;
    if (!confirm("Sigur dorești să ștergi acest pachet?")) return;

    // Optimistic delete
    const previousOffers = [...(store.offers || [])];
    setStore({
      ...store,
      offers: store.offers.filter(o => o.id !== offerId)
    });

    const success = await removeOfferFromStore(store.id, previousOffers, offerId);
    if (!success) {
      alert("A apărut o eroare la ștergerea pachetului.");
      // Revert optimistic delete
      setStore({ ...store, offers: previousOffers });
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">
            Mod Comerciant ACTIV
          </span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            Inventar: {store.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestionează pachetele listate astăzi pentru salvare.
          </p>
        </div>
        
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform"
          >
            + Adaugă Pachet Nou
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddOffer} className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-6 rounded-2xl mb-8 slide-down">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Creează Pachet Surpriză</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Titlu / Descriere scurtă</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="ex: Mix Patiserie + 2 Sandvișuri" className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Preț Vânzare (RON)</label>
              <input required type="number" step="0.5" min="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="15" className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Valoare Originală (RON)</label>
              <input required type="number" step="0.5" min="1" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="45" className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 dark:text-white transition-colors" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cantitate Disponibilă</label>
              <input required type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="2" className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 dark:text-white transition-colors" />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2 rounded-full font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors">Anulează</button>
            <button disabled={isSubmitting} type="submit" className="bg-emerald-500 text-white font-bold px-6 py-2 rounded-full hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {isSubmitting ? "Se salvează..." : "Publică Pachetul"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {(!store.offers || store.offers.length === 0) ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-300 dark:border-neutral-800">
            <p className="text-gray-500 dark:text-gray-400">Nu ai niciun pachet publicat astăzi.</p>
          </div>
        ) : (
          store.offers.map((offer) => (
            <div key={offer.id} className="flex justify-between items-center p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{offer.title}</h4>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{offer.price} RON</span>
                  <span className="text-gray-400 line-through">{offer.originalPrice} RON</span>
                  <span className="bg-gray-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">Stoc: {offer.quantityAvailable}</span>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteOffer(offer.id)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                title="Șterge Pachet"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
