import { createClient } from "@supabase/supabase-js";

export type StoreOffer = {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  quantityAvailable: number;
};

export type StoreData = {
  id: string;
  name: string;
  address: string;
  image: string;
  opens_at: string;
  closes_at: string;
  offers: StoreOffer[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Obține datele unui magazin care aparține unui anumit utilizator
export async function getStoreByOwner(userId: string): Promise<StoreData | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null; // Returnează null dacă utilizatorul nu are magazin
  }
  return data as StoreData;
}

// Adaugă un pachet nou la magazin
export async function addOfferToStore(storeId: string, currentOffers: StoreOffer[], newOffer: Omit<StoreOffer, 'id'>): Promise<StoreOffer | null> {
  // Generăm un ID unic simplu
  const offerWithId: StoreOffer = {
    ...newOffer,
    id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  };
  
  const updatedOffers = [...(currentOffers || []), offerWithId];

  const { error } = await supabase
    .from("stores")
    .update({ offers: updatedOffers })
    .eq("id", storeId);

  if (error) {
    console.error("Eroare la adăugarea ofertei:", error);
    return null;
  }
  return offerWithId;
}

// Șterge un pachet din magazin
export async function removeOfferFromStore(storeId: string, currentOffers: StoreOffer[], offerIdToRemove: string): Promise<boolean> {
  const updatedOffers = currentOffers.filter(offer => offer.id !== offerIdToRemove);

  const { error } = await supabase
    .from("stores")
    .update({ offers: updatedOffers })
    .eq("id", storeId);

  if (error) {
    console.error("Eroare la ștergerea ofertei:", error);
    return false;
  }
  return true;
}
