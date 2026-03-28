import { PLANS } from "@/lib/plans";
import { Tag } from "lucide-react";

export default function AdminPricingPage() {
  return (
    <div className="p-8" dir="rtl">
      <div className="mb-6">
        <h1 className="font-extrabold text-2xl text-[#111]">מחירון</h1>
        <p className="text-[#888] text-sm mt-1">תוכניות מחירים פעילות · לעריכה יש לעדכן lib/plans.ts</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <th className="text-right px-6 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">#</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">תוכנית</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">ימים</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">מחיר</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-[#888] uppercase tracking-wider">מחיר ליום</th>
            </tr>
          </thead>
          <tbody>
            {PLANS.map((plan, i) => (
              <tr key={plan.days} className={`border-b border-[#F3F4F6] ${i % 2 === 0 ? "" : "bg-[#FAFAF7]"} hover:bg-[#ECFDF5] transition-colors`}>
                <td className="px-6 py-4">
                  <div className="h-8 w-8 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                    <Tag className="h-4 w-4 text-[#059669]" />
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-[#111]">{plan.label}</td>
                <td className="px-6 py-4 text-[#555]">{plan.days} ימים</td>
                <td className="px-6 py-4 font-bold text-[#059669]">₪{(plan.price / 100).toFixed(0)}</td>
                <td className="px-6 py-4 text-[#888]">₪{(plan.price / 100 / plan.days).toFixed(1)}/יום</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
