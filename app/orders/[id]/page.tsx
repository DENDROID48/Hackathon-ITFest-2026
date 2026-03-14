import OrderClient from "@/components/OrderClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  
  // Pasăm pur și simplu ID-ul către componenta ta curată de Client
  return <OrderClient orderId={id} />;
}