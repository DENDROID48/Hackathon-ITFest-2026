import OrderList from "@/components/OrderList";

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-4xl">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            📦 Istoric Comenzi
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
            Aici găsești toate pachetele surpriză pe care le-ai rezervat.
          </p>
        </div>

        {/* CONTAINER COMenzi */}
        <OrderList />

      </div>
    </div>
  );
}
