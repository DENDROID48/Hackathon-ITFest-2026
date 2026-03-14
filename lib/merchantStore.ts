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

// Obține datele unui magazin specific
export async function getStoreData(storeId: string): Promise<StoreData | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .single();

  if (error || !data) {
    console.error("Eroare la preluarea magazinului:", error);
    return null;
  }
  return data as StoreData;
}

// Adaugă un pachet nou la magazin
export async function addOfferToStore(storeId: string, currentOffers: StoreOffer[], newOffer: Omit<StoreOffer, 'id'>): Promise<boolean> {
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
    return false;
  }
  return true;
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
