import { createClient } from "@supabase/supabase-js";

export type StoreOffer = {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  quantityAvailable: number;
  pickupTime?: string;
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
export async function addOfferToStore(storeId: string, newOffer: Omit<StoreOffer, 'id'>): Promise<StoreOffer | null> {
  const offerWithId: StoreOffer = {
    ...newOffer,
    id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  };

  const { data: store, error: fetchError } = await supabase
    .from("stores")
    .select("offers")
    .eq("id", storeId)
    .single();

  if (fetchError || !store) return null;

  const updatedOffers = [...(store.offers || []), offerWithId];

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
export async function removeOfferFromStore(storeId: string, offerIdToRemove: string): Promise<boolean> {
  const { data: store, error: fetchError } = await supabase
    .from("stores")
    .select("offers")
    .eq("id", storeId)
    .single();

  if (fetchError || !store) return false;

  const updatedOffers = (store.offers || []).filter((offer: any) => offer.id !== offerIdToRemove);

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

// Actualizează un pachet existent din magazin
export async function updateOfferInStore(storeId: string, updatedOffer: StoreOffer): Promise<boolean> {
  const { data: store, error: fetchError } = await supabase
    .from("stores")
    .select("offers")
    .eq("id", storeId)
    .single();

  if (fetchError || !store) return false;

  const updatedOffers = (store.offers || []).map((offer: any) =>
    offer.id === updatedOffer.id ? updatedOffer : offer
  );

  const { error } = await supabase
    .from("stores")
    .update({ offers: updatedOffers })
    .eq("id", storeId);

  if (error) {
    console.error("Eroare la actualizarea ofertei:", error);
    return false;
  }
  return true;
}

// Obține comenzile pentru un anumit magazin (Analytics & Active Orders)
export async function getStoreOrders(storeId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      total_amount,
      status,
      created_at,
      pickup_time,
      user_id,
      order_items (
        quantity,
        price_at_purchase,
        offer_id
      )
    `)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Eroare la obținerea comenzilor magazinului (detalii complete):", error.message, error.details, error.hint, JSON.stringify(error));
    return [];
  }
  return data;
}

// Actualizează statusul unei comenzi (merchants)
export async function updateOrderStatus(orderId: string, status: 'COMPLETED' | 'CANCELLED'): Promise<boolean> {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.error("Eroare la actualizarea comenzii:", error);
    return false;
  }
  return true;
}
