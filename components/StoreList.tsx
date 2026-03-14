"use client";

import Link from "next/link";
import Image from "next/image";
import type { Store } from "./HomeClient";

// ✅ Type-safe: Extindem interfața pentru a include distanța calculată în HomeClient
interface StoreWithDistance extends Store {
  _dist?: number;
}

export default function StoreList({ stores }: { stores: StoreWithDistance[] }) {
  // 1. UX: Empty state mult mai prietenos și vizual
  if (!stores || stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
        <span className="text-6xl mb-4">🍽️</span>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Niciun magazin în zonă</h3>
        <p className="text-gray-500 text-sm">Încearcă să mărești raza de căutare din filtre.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      {stores.map((store) => (
        <Link key={store.id} href={`/store/${store.id}`} className="group block">
          <div className="flex flex-col sm:flex-row bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300">
            
            {/* 2. UX: Aspect ratio constant și fallback pentru lipsa imaginii */}
            <div className="relative h-48 sm:h-36 sm:w-40 bg-gray-50 shrink-0 flex items-center justify-center overflow-hidden">
              {store.image ? (
                <Image 
                  src={store.image} 
                  alt={store.name} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              ) : (
                <span className="text-4xl opacity-50">🏪</span>
              )}
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col justify-between w-full">
              <div>
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                      {store.name}
                    </h3>
                    {/* 3. UX: Afișarea distanței (dacă e disponibilă) */}
                    {store._dist !== undefined && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                            {store._dist.toFixed(1)} km
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{store.address}</p>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {store.opensAt && store.closesAt ? (
                        <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-md">
                            {store.opensAt} - {store.closesAt}
                        </span>
                    ) : (
                        <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-md">
                            
                        </span>
                    )}
                </div>
                {/* Un mic indicator vizual de interacțiune */}
                <span className="text-emerald-600 font-bold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    →
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
