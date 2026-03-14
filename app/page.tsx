import HomeClient from "@/components/HomeClient";
import { supabase } from "@/lib/orderStore";

// Opțiunile pentru dropdown-ul de filtrare
const regions = [
  { id: "tm-centru", label: "Timișoara - Centru", center: { lat: 45.7537, lng: 21.2257 } },
  { id: "tm-complex", label: "Timișoara - Complex", center: { lat: 45.7472, lng: 21.2319 } },
];

export default async function HomePage() {
  // Tragem TOATE magazinele din Supabase
  const { data: storesDB, error } = await supabase
    .from("stores")
    .select("*");

  if (error) {
    console.error("Eroare la încărcarea magazinelor:", error);
  }

  // 🔥 FIX-UL: Mapăm datele din baza de date pentru a se potrivi cu interfața din frontend
  const formattedStores = (storesDB || []).map((store) => ({
    id: store.id,
    name: store.name,
    address: store.address,
    lat: store.lat,
    lng: store.lng,
    image: store.image,
    // Aici facem "traducerea" ca să dispară Program necunoscut
    opensAt: store.opens_at,   
    closesAt: store.closes_at, 
  }));

  return (
    <HomeClient 
      regions={regions} 
      stores={formattedStores} 
      defaultRegionId="all" 
    />
  );
}