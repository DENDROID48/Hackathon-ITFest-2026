import { createClient } from "@supabase/supabase-js";

// --- 1. Tipurile Aplicației (Frontend) ---
export type OrderItem = { offerId: string; qty: number };

export type CreateOrderBody = {
  storeId: string;
  paymentMethod: "IN_APP" | "AT_STORE";
  note?: string;
  items: OrderItem[];
  total: number;
};

export type Order = {
  id: string;
  createdAt: string;
  status: "RESERVED" | "CANCELLED" | "COMPLETED";
  storeId: string;
  paymentMethod: "IN_APP" | "AT_STORE";
  note?: string;
  items: OrderItem[];
  total: number;
};

// --- 2. Tipul Bazei de Date (Backend/Supabase) ---
// Definim asta ca să scăpăm de eroarea "Unexpected any"
type DbOrder = {
  id: string;
  created_at: string;
  status: "RESERVED" | "CANCELLED" | "COMPLETED";
  store_id: string;
  payment_method: "IN_APP" | "AT_STORE";
  note: string | null;
  items: OrderItem[]; // Supabase returnează JSON-ul mapat automat
  total: number;
};

// --- 3. Inițializăm Supabase ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ EROARE: Lipsesc variabilele de mediu Supabase în .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- 4. Funcții Helper (DB Mapping) ---

// Acum funcția acceptă tipul strict DbOrder, nu any
function mapDbOrderToAppOrder(dbOrder: DbOrder): Order {
  return {
    id: dbOrder.id,
    createdAt: dbOrder.created_at,
    status: dbOrder.status,
    storeId: dbOrder.store_id,
    paymentMethod: dbOrder.payment_method,
    note: dbOrder.note || "",
    items: dbOrder.items,
    total: Number(dbOrder.total),
  };
}

// --- 5. Funcții API ---

// ... importurile și tipurile rămân la fel ...

export async function createOrderInDb(body: CreateOrderBody): Promise<Order | null> {
  // 🔒 REGULA DE AUR: Maxim 2 pachete per tip de produs per comandă
  /* const MAX_QTY_PER_ITEM = 2;

  for (const item of body.items) {
    if (item.qty > MAX_QTY_PER_ITEM) {
      console.error(`Tentativă de fraudă? Userul a cerut ${item.qty} pachete.`);
      return null; // Sau aruncăm o eroare
    }
  }
  */
 
  // Apelăm funcția SQL "RPC" (Remote Procedure Call)
  const { data, error } = await supabase.rpc('create_order_transaction', {
    p_store_id: body.storeId,
    p_items: body.items,
    p_total: body.total,
    p_payment_method: body.paymentMethod,
    p_note: body.note || ""
  });

  if (error) {
    console.error("Eroare tranzacție (probabil stoc epuizat):", error.message);
    return null;
  }

  // Funcția returnează doar ID-ul și statusul, așa că trebuie să reconstruim obiectul
  // sau, pentru simplitate, returnăm o structură minimă validă
  return {
    id: data.id,
    createdAt: new Date().toISOString(),
    status: data.status, // "RESERVED"
    storeId: body.storeId,
    paymentMethod: body.paymentMethod,
    note: body.note,
    items: body.items,
    total: body.total
  };
}

// ... restul funcțiilor (getOrderFromDb, updateOrderStatus) rămân la fel ...
export async function getOrderFromDb(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !data) return null;
  
  // Cast explicit
  return mapDbOrderToAppOrder(data as unknown as DbOrder);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  return !error;
}