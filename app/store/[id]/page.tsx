import StoreClient from "@/components/StoreClient"; 
import { supabase } from "@/lib/orderStore";
import { notFound } from "next/navigation";

export default async function StorePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  // Extragem magazinul real din Supabase
  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !store) {
    return notFound();
  }

  return <StoreClient store={store} />;
}