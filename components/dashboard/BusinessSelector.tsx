"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChevronDown } from "lucide-react";
import type { Business } from "@/lib/types";

export default function BusinessSelector({
  businesses,
  selectedId,
}: {
  businesses: Business[];
  selectedId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("businessId", e.target.value);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-card">
      <label className="flex items-center gap-2 text-sm font-medium text-stone-600 mb-2">
        <Building2 className="h-4 w-4 text-[#059669]" aria-hidden="true" />
        בחרו עסק לניהול
      </label>
      <div className="relative">
        <select
          value={selectedId}
          onChange={handleChange}
          className="w-full h-11 appearance-none rounded-xl border border-stone-200 bg-white px-4 pr-4 pl-10 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent cursor-pointer"
        >
          {businesses.map((biz) => (
            <option key={biz.id} value={biz.id}>
              {biz.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
      </div>
    </div>
  );
}
