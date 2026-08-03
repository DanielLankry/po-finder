import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
} from "lucide-react";
import {
  getOwnerLifecycleDetails,
  type OwnerLifecycleDetails,
  type OwnerLifecycleInput,
  type OwnerLifecycleTone,
} from "@/lib/owner-lifecycle";

const TONE_CLASSES: Record<OwnerLifecycleTone, {
  panel: string;
  iconWrap: string;
  icon: string;
  pill: string;
  button: string;
}> = {
  success: {
    panel: "border-[#17402D] bg-emerald-50 shadow-[4px_4px_0_0_#17402D]",
    iconWrap: "bg-white",
    icon: "text-[#2D6A4F]",
    pill: "border-[#17402D] bg-emerald-100 text-[#17402D] shadow-[2px_2px_0_0_#17402D]",
    button: "brand-button",
  },
  warning: {
    panel: "border-amber-700 bg-amber-50 shadow-[4px_4px_0_0_#B45309]",
    iconWrap: "bg-amber-100",
    icon: "text-amber-700",
    pill: "border-amber-700 bg-amber-100 text-amber-800 shadow-[2px_2px_0_0_#B45309]",
    button: "border-2 border-amber-800 bg-amber-700 text-white shadow-[3px_3px_0_0_#92400E] hover:bg-amber-800",
  },
  error: {
    panel: "border-red-700 bg-red-50 shadow-[4px_4px_0_0_#B91C1C]",
    iconWrap: "bg-red-100",
    icon: "text-red-700",
    pill: "border-red-700 bg-red-100 text-red-700 shadow-[2px_2px_0_0_#B91C1C]",
    button: "border-2 border-red-800 bg-red-700 text-white shadow-[3px_3px_0_0_#991B1B] hover:bg-red-800",
  },
  neutral: {
    panel: "border-[#8A3618] bg-white shadow-[4px_4px_0_0_#8A3618]",
    iconWrap: "bg-[#FFF3B0]",
    icon: "text-[#8A3618]",
    pill: "border-[#8A3618] bg-[#F6E3D9] text-[#8A3618] shadow-[2px_2px_0_0_#8A3618]",
    button: "border-2 border-[#8A3618] bg-[#8A3618] text-white shadow-[3px_3px_0_0_#5F2410] hover:bg-[#A8441F]",
  },
};

export function OwnerLifecycleBanner({
  business,
  nowIso,
  compact = false,
}: {
  business: OwnerLifecycleInput;
  nowIso?: string;
  compact?: boolean;
}) {
  const details = getOwnerLifecycleDetails(business, nowIso);
  const classes = TONE_CLASSES[details.tone];
  const Icon = getLifecycleIcon(details);

  return (
    <section
      className={`flex flex-col gap-4 rounded-[18px] border-2 p-5 sm:flex-row sm:items-start sm:justify-between ${classes.panel}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${classes.iconWrap}`}>
          <Icon className={`h-5 w-5 ${classes.icon}`} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-black text-stone-950">
              {details.title}
            </h2>
            <OwnerLifecyclePill details={details} />
          </div>
          {!compact && (
            <p className="mt-1 text-xs leading-relaxed text-stone-700">
              {details.description}
            </p>
          )}
        </div>
      </div>
      <Link
        href={details.actionHref}
        className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-4 py-2 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4552D] focus-visible:ring-offset-2 ${classes.button}`}
      >
        {details.actionLabel}
      </Link>
    </section>
  );
}

export function OwnerLifecyclePills({
  business,
  nowIso,
}: {
  business: OwnerLifecycleInput;
  nowIso?: string;
}) {
  const details = getOwnerLifecycleDetails(business, nowIso);

  return (
    <div className="flex flex-wrap gap-2 text-xs font-black">
      <StatusPill
        active={business.is_verified === true}
        activeText="מאומת"
        inactiveText="ממתין לאימות"
      />
      <OwnerLifecyclePill details={details} />
    </div>
  );
}

export function OwnerLifecycleNotice({
  tone,
  text,
}: {
  tone: Exclude<OwnerLifecycleTone, "neutral">;
  text: string;
}) {
  const classes =
    tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-red-300 bg-red-50 text-red-900";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${classes}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function OwnerLifecycleLoading({ text = "טוען..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-center text-sm text-stone-500" role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 animate-spin text-[#2D6A4F]" aria-hidden="true" />
      {text}
    </div>
  );
}

function OwnerLifecyclePill({ details }: { details: OwnerLifecycleDetails }) {
  return (
    <span className={`inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-black ${TONE_CLASSES[details.tone].pill}`}>
      {details.pill}
    </span>
  );
}

function StatusPill({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 ${
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-stone-200 text-stone-700"
      }`}
    >
      {active ? activeText : inactiveText}
    </span>
  );
}

function getLifecycleIcon(details: OwnerLifecycleDetails) {
  if (details.state === "active") return CheckCircle2;
  if (details.state === "ready_to_publish") return CreditCard;
  if (details.state === "pending_verification") return Clock3;
  return AlertCircle;
}
