import MerchantDashboard from "@/components/MerchantDashboard";

export default function MerchantPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 dark:bg-[#0a0a0a] pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">
          Portal <span className="text-orange-600 dark:text-orange-500">Comerciant</span>
        </h1>
        <MerchantDashboard />
      </div>
    </main>
  );
}
