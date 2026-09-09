"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, ArrowLeft, RefreshCw } from "lucide-react";
import { ownerPath, type OwnerProgressData } from "@/lib/owner-progress";

const Workspace = createContext<{ data: OwnerProgressData | null; error: string | null }>({ data: null, error: null });
export const useOwnerWorkspace = () => useContext(Workspace);

/** Saved mutations refresh the read model without discarding unsaved form input. */
export function notifyOwnerDataChanged() {
  window.dispatchEvent(new Event("owner-data-changed"));
}

/** Keeps the same owner progress visible across dashboard routes and approval changes. */
export default function OwnerWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = params.get("businessId");
  const [data, setData] = useState<OwnerProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setError("עדכון מצב העסק מתעכב. בדקו את החיבור ונסו שוב.");
      controller.abort();
    }, 12_000);
    fetch(`/api/account/progress${selected ? `?businessId=${encodeURIComponent(selected)}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "העסק שנבחר אינו זמין בחשבון הזה." : "לא הצלחנו לעדכן את מצב העסק. נסו שוב.");
        return response.json() as Promise<OwnerProgressData>;
      })
      .then((result) => { if (!controller.signal.aborted) { setData(result); setError(null); } })
      .catch((caught) => { if (!controller.signal.aborted) setError(caught.message); })
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [selected, pathname, revision]);

  useEffect(() => {
    const visibleRefresh = () => { if (document.visibilityState === "visible") refresh(); };
    // Align to minute boundaries so saved minute-based opening/closing times update promptly.
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => { visibleRefresh(); timer = setTimeout(tick, 60_000 - Date.now() % 60_000 + 50); };
    timer = setTimeout(tick, 60_000 - Date.now() % 60_000 + 50);
    window.addEventListener("owner-data-changed", refresh);
    window.addEventListener("focus", visibleRefresh);
    document.addEventListener("visibilitychange", visibleRefresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("owner-data-changed", refresh);
      window.removeEventListener("focus", visibleRefresh);
      document.removeEventListener("visibilitychange", visibleRefresh);
    };
  }, [refresh]);

  // Never render another business's progress while its selected route is loading.
  const current = data && (!selected || data.business?.id === selected) ? data : null;
  return (
    <Workspace.Provider value={{ data: current, error }}>
      <div className="space-y-6">
        {error ? (
          <div className="brand-panel p-4 text-sm text-[#8A3618]" role="alert">
            <p>{error} נתונים קודמים עשויים להיות לא מעודכנים.</p>
            <button onClick={refresh} className="brand-control mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-bold"><RefreshCw className="h-4 w-4" />ניסיון נוסף</button>
          </div>
        ) : current ? <OwnerProgressView data={current} /> : <p className="brand-panel p-5 text-base" role="status">טוענים את ההתקדמות של העסק…</p>}
        <div key={selected ?? "latest"}>{children}</div>
      </div>
    </Workspace.Provider>
  );
}

/** Presents approval, publication and profile quality as separate, actionable facts. */
export function OwnerProgressView({ data }: { data: OwnerProgressData }) {
  const { business, completion, journey } = data;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const submittedAt = business?.created_at && !business.is_verified ? new Date(business.created_at) : null;
  const waitingHours = submittedAt ? Math.max(0, Math.floor((Date.parse(data.updatedAt) - submittedAt.getTime()) / 3_600_000)) : 0;
  const waitingDays = Math.floor(waitingHours / 24);
  const waitingText = waitingHours < 1 ? "לפני פחות משעה" : waitingHours === 1 ? "לפני שעה" : waitingHours < 24 ? `לפני ${waitingHours} שעות` : waitingDays === 1 ? "לפני יום" : waitingDays === 2 ? "לפני יומיים" : `לפני ${waitingDays} ימים`;
  return (
    <section className="brand-panel overflow-hidden" aria-label="התקדמות לפרסום" data-testid="owner-progress">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#17402D] bg-[#FFF3B0] px-4 py-4 sm:px-6">
        <h2 className="font-display text-3xl text-[#17402D]">הדרך לפרסום</h2>
        <span className="text-sm font-bold text-[#17402D]">{journey.publicVisible ? "מופיע לציבור" : "עדיין לא מופיע לציבור"}</span>
      </div>
      <div className="space-y-5 p-4 sm:p-6">
        {data.businesses.length > 1 && <label className="block text-sm font-bold">עסק לניהול
          <select value={business?.id ?? ""} onChange={(event) => { const next = new URLSearchParams(params.toString()); next.set("businessId", event.target.value); router.push(`${pathname}?${next}`); }} className="brand-control mt-2 h-12 w-full rounded-xl px-3 text-base">
            {data.businesses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>}
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="שלבי הפרסום">
          {journey.steps.map((step, index) => <li key={step.label} aria-current={step.state === "current" ? "step" : undefined} className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-sm font-bold sm:flex-col sm:text-center ${step.state === "current" ? "border-[#8A3618] bg-[#F6E3D9] text-[#8A3618]" : step.state === "complete" ? "border-[#17402D]/25 bg-[#EFF5F0] text-[#17402D]" : "border-[#17402D]/15 text-[#59645D]"}`}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current" aria-hidden="true">{step.state === "complete" ? <Check className="h-4 w-4" /> : index + 1}</span>
            <span>{step.label}<span className="sr-only">{step.state === "complete" ? " — הושלם" : step.state === "current" ? " — השלב הנוכחי" : " — בהמשך"}</span></span>
          </li>)}
        </ol>
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
          <div className="min-w-0 space-y-2">
            <h3 className="text-base font-black text-[#17402D]">{journey.title}</h3>
            <p className="max-w-2xl text-sm leading-relaxed text-[#405348]">{journey.description}</p>
            <p className="text-sm font-bold text-[#8A3618]">הטיפול כעת: {journey.responsible}</p>
            {submittedAt && Number.isFinite(submittedAt.getTime()) && <p className="text-sm text-[#405348]">הטיוטה נוצרה ב־{submittedAt.toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" })}, {waitingText}. הבקשה בבדיקה; נעדכן במייל.</p>}
          </div>
          <Link href={journey.actionHref} className="brand-button inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-base font-bold sm:w-auto">{journey.actionLabel}<ArrowLeft className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        <details className="border-t-2 border-[#17402D]/15 pt-4">
          <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-3 text-base font-bold text-[#17402D]">
            <span>שלמות הפרופיל · {completion.completed} מתוך {completion.total} פרטים הושלמו</span>
            <span className="flex items-center gap-2">{completion.percent}%<ChevronDown className="h-4 w-4" aria-hidden="true" /></span>
          </summary>
          <div role="progressbar" aria-label="שלמות הפרופיל" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.percent} className="my-3 h-2 overflow-hidden rounded-full bg-[#D8D1C2]">
            <div className="h-full rounded-full bg-[#2D6A4F]" style={{ width: `${completion.percent}%` }} />
          </div>
          <p className="mb-3 text-sm leading-relaxed text-[#405348]">המלצות לכרטיס שימושי ומלא. השלמת הפרטים אינה מחליפה אישור צוות ותשלום או הטבה תקפה.</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {completion.items.map((item) => <li key={item.id}><Link href={item.href} className="brand-control flex min-h-16 items-start gap-3 rounded-xl p-3 text-sm">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${item.complete ? "border-[#2D6A4F] bg-[#DDEBE0]" : "border-[#8A3618]"}`} aria-hidden="true">{item.complete ? <Check className="h-4 w-4" /> : "+"}</span>
              <span><span className="block font-bold">{item.label} · {item.complete ? "הושלם" : "להשלמה"}</span><span className="mt-1 block text-[#405348]">{item.help}</span></span>
            </Link></li>)}
          </ul>
        </details>
        {business && !journey.publicVisible && <Link className="inline-flex min-h-11 items-center text-sm font-bold text-[#2D6A4F] underline" href={ownerPath("/dashboard/profile#profile-preview", business.id)}>תצוגה מקדימה בתוך עורך הפרופיל</Link>}
      </div>
    </section>
  );
}
