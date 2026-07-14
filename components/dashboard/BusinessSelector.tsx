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
    <div className="brand-panel-soft p-4">
      <label className="flex items-center gap-2 text-sm font-medium text-stone-600 mb-2">
        <Building2 className="h-4 w-4 text-[#2D6A4F]" aria-hidden="true" />
        בחרו עסק לניהול
      </label>
      <div className="relative">
        <select
          value={selectedId}
          onChange={handleChange}
          className="brand-control w-full h-11 appearance-none rounded-xl px-4 pr-4 pl-10 text-sm font-bold text-stone-900 cursor-pointer"
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
