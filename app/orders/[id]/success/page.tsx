import OrderSuccessClient from "@/components/OrderSuccessClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderSuccessPage({ params }: Props) {
  const { id } = await params;

  // La fel, până legăm Supabase complet aici, folosim un mock 
  // ca să testezi animațiile și afișarea codului QR
  const mockOrderData = {
    id: id,
    storeName: "Brutăria Artizanală",
    storeAddress: "Piața Victoriei 2, Timișoara",
    total: 15,
    items: [{ title: "Magic Bag Patiserie", qty: 1, price: 15 }],
    pickupEnd: "20:00"
  };

  return <OrderSuccessClient order={mockOrderData} />;
}