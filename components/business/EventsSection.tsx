import type { BusinessEvent } from "@/lib/types";
import { Calendar, Clock, Tag } from "lucide-react";

interface EventsSectionProps {
  events: BusinessEvent[];
}

function formatHebrewDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Jerusalem",
  });
}

export default function EventsSection({ events }: EventsSectionProps) {
  if (!events.length) return null;

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-stone-900 mb-4">
        🎉 אירועים קרובים
      </h2>
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-lg text-stone-900 mb-1">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-stone-600 text-sm leading-relaxed mb-3">
                    {event.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#059669]" aria-hidden="true" />
                    {formatHebrewDate(event.event_date)}
                  </span>
                  {event.start_time && (
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <Clock className="h-4 w-4 text-[#059669]" aria-hidden="true" />
                      {event.start_time.slice(0, 5)}
                      {event.end_time && ` – ${event.end_time.slice(0, 5)}`}
                    </span>
                  )}
                  {event.price != null && (
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-4 w-4 text-[#059669]" aria-hidden="true" />
                      {event.price === 0 ? "כניסה חופשית" : `₪${event.price}`}
                    </span>
                  )}
                </div>
              </div>
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
