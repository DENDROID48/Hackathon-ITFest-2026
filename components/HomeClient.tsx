"use client";

import { useMemo, useState } from "react";
import StoreList from "@/components/StoreList";
import MapView from "@/components/MapView";

export interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  image?: string;
  opensAt?: string;
  closesAt?: string;
}

type RegionOption = {
  id: string;
  label: string;
  center: { lat: number; lng: number };
};

function distanceApprox(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export default function HomeClient({
  regions,
  stores,
  defaultRegionId,
}: {
  regions: RegionOption[];
  stores: Store[];
  defaultRegionId: string;
}) {
  const [regionId, setRegionId] = useState(defaultRegionId || "all"); 
  const [view, setView] = useState<"list" | "map">("list");
  const [radiusKm, setRadiusKm] = useState(6);

  const extendedRegions = useMemo(() => {
    // Default pe Timișoara
    const defaultCenter = regions.length > 0 ? regions[0].center : { lat: 45.7537, lng: 21.2257 };
    return [{ id: "all", label: "Toate zonele", center: defaultCenter }, ...regions];
  }, [regions]);

  const selectedRegion = useMemo(() => {
    return extendedRegions.find((r) => r.id === regionId) ?? extendedRegions[0];
  }, [regionId, extendedRegions]);

  const storesNear = useMemo(() => {
    // Dacă am selectat "Toate zonele", returnăm toate magazinele
    if (regionId === "all") return stores;

    // Altfel, filtrăm în funcție de distanță
    return stores
      .map((s) => ({ ...s, _dist: distanceApprox(selectedRegion.center, { lat: s.lat, lng: s.lng }) }))
      .filter((s) => s._dist <= radiusKm)
      .sort((a, b) => a._dist - b._dist);
  }, [stores, selectedRegion, radiusKm, regionId]);

  return (
    <div className="w-full">
      {/* HEADER HERO */}
      <div className="bg-white px-5 pt-8 pb-10 shadow-sm dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-neutral-800 transition-colors">
        <div className="mx-auto max-w-7xl">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-6xl drop-shadow-sm">
              Salvează Mâncarea. <br/>
              <span className="text-emerald-500">Salvează Bugetul.</span>
            </h1>
            <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium max-w-xl text-lg">
              Descoperă pachete surpriză cu alimente delicioase, la o fracțiune din preț, salvate din restaurantele și magazinele din apropierea ta.
            </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-5 mt-4">
        {/* FILTERS BAR */}
        <div className="sticky top-24 z-20 mb-8 rounded-[24px] border border-gray-200 bg-white/80 p-4 shadow-md backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80 transition-all">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <select
                className="w-full cursor-pointer appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm font-bold text-gray-900 outline-none hover:border-emerald-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:w-[280px] transition-all"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
              >
                {extendedRegions.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>

              {regionId !== "all" && (
                <select
                  className="w-full cursor-pointer appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm font-bold text-gray-900 outline-none hover:border-emerald-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:w-[140px] transition-all animate-in fade-in slide-in-from-left-4"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                >
                  {[3, 6, 10, 15].map((km) => (
                    <option key={km} value={km}>Razã: {km} km</option>
                  ))}
                </select>
              )}
            </div>

            {/* COMUTATOR MOBIL (Listă / Hartă) - Apare doar pe ecrane < lg */}
            <div className="flex rounded-2xl bg-gray-100 dark:bg-neutral-800 p-1.5 lg:hidden w-full sm:w-auto shadow-inner">
              <button 
                onClick={() => setView("list")} 
                className={`flex-1 rounded-xl py-3 px-6 text-sm font-black uppercase tracking-wider transition-all duration-300 ${view === "list" ? "bg-white shadow-md text-black dark:bg-neutral-700 dark:text-white scale-100" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white scale-95"}`}
              >
                📝 Listă
              </button>
              <button 
                onClick={() => setView("map")} 
                className={`flex-1 rounded-xl py-3 px-6 text-sm font-black uppercase tracking-wider transition-all duration-300 ${view === "map" ? "bg-white shadow-md text-black dark:bg-neutral-700 dark:text-white scale-100" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white scale-95"}`}
              >
                🗺️ Hartă
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        {/* ✅ FIX: Am setat grid-ul să se aplice DOAR pe desktop (lg:grid-cols-2). Pe mobil e o singură coloană */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 items-start">
          
          {/* SECTIUNEA LISTĂ */}
          {/* ✅ FIX: Afișăm pe mobil doar dacă view === 'list'. Pe desktop (lg:block) o afișăm mereu. */}
          <section className={`${view === "list" ? "block animate-in fade-in slide-in-from-bottom-4 duration-500" : "hidden"} lg:block`}>
            {storesNear.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-12 text-center border border-gray-200 dark:border-neutral-800 shadow-sm mt-4">
                <span className="text-5xl">🧭</span>
                <h3 className="text-xl font-bold mt-4 text-gray-900 dark:text-white">Niciun magazin găsit</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Nu am găsit magazine cu pachete salvate în această rază. Mărește raza de căutare!</p>
              </div>
            ) : (
              <StoreList stores={storesNear} />
            )}
          </section>

          {/* SECTIUNEA HARTĂ */}
          {/* ✅ FIX: Afișăm pe mobil doar dacă view === 'map'. Pe desktop (lg:block) o afișăm mereu și o facem lipicioasă (sticky). */}
          <section className={`${view === "map" ? "block animate-in fade-in slide-in-from-bottom-4 duration-500" : "hidden"} lg:block relative`}>
            <div className="lg:sticky lg:top-48 h-[500px] lg:h-[700px] w-full overflow-hidden rounded-[32px] border border-gray-200 shadow-xl bg-gray-100 dark:bg-neutral-800 dark:border-neutral-800 transition-all">
               <MapView stores={storesNear} center={selectedRegion.center} zoom={regionId === "all" ? 13 : 14} />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}