import OrderHistory from "@/components/OrderHistory";
import Link from "next/link";

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-24 pb-12 px-5">
      <div className="max-w-3xl mx-auto mb-8">
        <Link href="/" className="text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:underline">
          &larr; Înapoi la Hartă
        </Link>
      </div>
      
      {/* Aici chemăm componenta magică cu roll-down pe care tocmai am creat-o */}
      <OrderHistory />
    </div>
  );
}