"use client";

import { useEffect, useRef } from "react";
import type { Map, Layer } from "leaflet";

type MapStore = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type MapViewProps = {
  stores: MapStore[];
  center?: { lat: number; lng: number };
  zoom?: number;
};

interface DefaultIconPrototype {
  _getIconUrl?: string;
}

interface LeafletHTMLDivElement extends HTMLDivElement {
  _leaflet_id?: unknown;
}

const getCoord = (val: unknown, fallback: number): number => {
  if (val === null || val === undefined) return fallback;
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? fallback : parsed;
};

export default function MapView({ stores, center, zoom = 13 }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const isInitializingRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const defaultLat = 45.7537;
  const defaultLng = 21.2257;

  // --- INIT MAP ---
  useEffect(() => {
    let isMounted = true; 

    const initMap = async () => {
      if (isInitializingRef.current || mapInstanceRef.current || !mapContainerRef.current) {
        return;
      }

      const container = mapContainerRef.current as LeafletHTMLDivElement;
      if (container._leaflet_id) return;

      isInitializingRef.current = true;

      try {
        const L = (await import("leaflet")).default;
        
        if (!isMounted) return; 

        const iconPrototype = L.Icon.Default.prototype as unknown as DefaultIconPrototype;
        delete iconPrototype._getIconUrl;

        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        });

        if (container._leaflet_id) return;

        const safeLat = getCoord(center?.lat, defaultLat);
        const safeLng = getCoord(center?.lng, defaultLng);

        const map = L.map(container, {
          scrollWheelZoom: false 
        }).setView([safeLat, safeLng], zoom);

        map.on('click', () => map.scrollWheelZoom.enable());
        map.on('mouseout', () => map.scrollWheelZoom.disable());

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        mapInstanceRef.current = map;

        const checkSize = () => {
          if (container.clientWidth > 0 && mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        };

        const observer = new ResizeObserver(checkSize);
        observer.observe(container);
        resizeObserverRef.current = observer;

        intervalRef.current = setInterval(checkSize, 300);

        stores.forEach((store) => {
          const lat = parseFloat(String(store.lat));
          const lng = parseFloat(String(store.lng));

          if (isNaN(lat) || isNaN(lng)) return;

          L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`
              <div style="font-family: sans-serif; text-align: center;">
                <b>${store.name}</b><br/>
                <span style="font-size: 12px; color: #666;">${store.address}</span><br/>
                <a href="/store/${store.id}" style="display: block; margin-top: 8px; background: black; color: white; padding: 6px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold;">Vezi Detalii</a>
              </div>
            `);
        });

      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Eroare la inițializarea hărții:", error.message);
        }
      } finally {
        if (isMounted) isInitializingRef.current = false;
      }
    };

    initMap();

    // ✅ FIX SUPREM: Curățenie Agresivă la schimbarea paginii
    return () => {
      isMounted = false; 
      isInitializingRef.current = false; // Resetăm starea de inițializare
      
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      // 🔥 Aici e magia: ștergem complet urma lăsată de Leaflet pe div
      if (mapContainerRef.current) {
        // Folosim interfața strictă definită sus, fără niciun any!
        const container = mapContainerRef.current as LeafletHTMLDivElement;
        container._leaflet_id = undefined;
      }
    };
  }, [center, zoom, stores]);

  // --- UPDATE MAP ---
  useEffect(() => {
    let isMounted = true; 

    const updateMap = async () => {
      const map = mapInstanceRef.current;
      if (!map) return;

      try {
        const L = (await import("leaflet")).default;
        
        if (!isMounted || !mapInstanceRef.current) return;

        map.eachLayer((layer: Layer) => {
          if (layer instanceof L.Marker) {
            map.removeLayer(layer);
          }
        });

        stores.forEach((store) => {
          const lat = parseFloat(String(store.lat));
          const lng = parseFloat(String(store.lng));

          if (isNaN(lat) || isNaN(lng)) return;

          L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`
              <div style="font-family: sans-serif; text-align: center;">
                <b>${store.name}</b><br/>
                <span style="font-size: 12px; color: #666;">${store.address}</span><br/>
                <a href="/store/${store.id}" style="display: block; margin-top: 8px; background: black; color: white; padding: 6px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold;">Vezi Detalii</a>
              </div>
            `);
        });

        if (center) {
          const safeLat = getCoord(center?.lat, defaultLat);
          const safeLng = getCoord(center?.lng, defaultLng);
          map.flyTo([safeLat, safeLng], zoom, { duration: 1.2 });
        }
      } catch (err) {
        console.warn("Eroare la update Leaflet:", err);
      }
    };

    updateMap();

    return () => {
      isMounted = false; 
    };
  }, [stores, center, zoom]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full z-0 rounded-3xl relative" 
      style={{ minHeight: "100%", height: "100%" }} 
    />
  );
}