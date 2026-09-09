"use client";

import Link from "next/link";
import { Clock3, MapPin } from "lucide-react";
import { getOwnerDayStatus } from "@/lib/utils/schedule";
import { ownerPath, type OwnerProgressData } from "@/lib/owner-progress";
import { useOwnerWorkspace } from "./OwnerWorkspace";

/** The workspace refreshes at minute boundaries and after saves; no publication inference from hours. */
export default function TodayStatus() {
  const { data, error } = useOwnerWorkspace();
  if (error) return <p className="brand-panel p-5 text-sm" role="status">סטטוס הפעילות אינו זמין כרגע. נסו לרענן את מצב העסק.</p>;
  if (!data) return <p className="brand-panel p-5 text-sm" role="status">טוענים את שעות הפעילות…</p>;
  return <TodayStatusView data={data} />;
}

/** Renders the same effective daily/weekly/overnight interval used by public discovery. */
export function TodayStatusView({ data }: { data: OwnerProgressData }) {
  const status = getOwnerDayStatus(data.daily, data.weekly, new Date(data.updatedAt));
  const label = status.availability === "open" ? "פתוח עכשיו" : status.availability === "closed" ? "סגור עכשיו" : "שעות הפעילות לא הוגדרו";
  return <section className="brand-panel space-y-4 p-5 sm:p-6" aria-label="סטטוס היום" data-testid="today-status">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-3xl text-[#17402D]">סטטוס היום</h2>
      <span className={`rounded-full border-2 border-[#17402D]/30 px-3 py-1.5 text-sm font-bold ${status.availability === "open" ? "bg-[#DDEBE0] text-[#17402D]" : "bg-[#FFF3B0] text-[#72540C]"}`} role="status">{label}</span>
    </div>
    <p className="text-sm text-[#405348]">מצב הפעילות לפי השעות שהגדרתם. מצב הפרסום מוצג בנפרד למעלה.</p>
    {status.source && <p className="text-sm font-bold text-[#17402D]">{status.source === "weekly" ? "לפי השעות השבועיות" : "לפי שינוי ליום זה"}{status.overnight ? " · פעילות שהתחילה אתמול ונמשכת אחרי חצות" : ""}</p>}
    {status.schedule?.open_time && status.schedule.close_time && status.hoursStatus === "scheduled" && <p className="flex items-center gap-2 text-base text-[#17402D]"><Clock3 className="h-5 w-5" aria-hidden="true" /><span dir="ltr">{status.schedule.open_time.slice(0, 5)}–{status.schedule.close_time.slice(0, 5)}</span></p>}
    {status.schedule?.address && <p className="flex items-start gap-2 text-base text-[#405348]"><MapPin className="h-5 w-5 shrink-0" aria-hidden="true" />{status.schedule.address}</p>}
    {status.schedule?.note && <p className="text-sm text-[#405348]">{status.schedule.note}</p>}
    <Link href={ownerPath(`/dashboard/schedule?tab=${status.source === "daily" ? "override" : "weekly"}`, data.business?.id)} className="brand-button inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold">{status.source ? "עריכת שעות הפעילות" : "הוספת שעות פעילות"}</Link>
  </section>;
}
