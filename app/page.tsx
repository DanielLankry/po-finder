import { Suspense } from "react";
import MapPage from "./MapPage";

export default function Home() {
  return (
    <>
      {/* SEO crawlable content — hidden visually but indexed by Google */}
      <section className="sr-only" aria-hidden="false">
        <h1>פוקרוב — רוכלים ועסקים ניידים בישראל</h1>
        <p>
          פוקרוב היא פלטפורמה למציאת רוכלים, דוכנים ועסקים ניידים בסביבתך.
          מצא קפה נייד, פלאפל רחוב, מוכרי פרחים, אוכל רחוב, וינטג׳ ועוד —
          ישירות על המפה, בזמן אמת.
        </p>
        <p>
          עסקים ניידים בתל אביב, ירושלים, חיפה, באר שבע, פתח תקווה, ראשון לציון ובכל הארץ.
          פוקרוב — כי הרחוב הוא השוק.
        </p>
        <ul>
          <li>רוכלים ניידים</li>
          <li>דוכני אוכל רחוב</li>
          <li>קפה נייד</li>
          <li>שווקים ניידים</li>
          <li>אומנים ויוצרים ניידים</li>
          <li>שירותים ניידים לאירועים</li>
        </ul>
      </section>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-surface">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full border-4 border-[#D1FAE5] border-t-[#059669] animate-spin mx-auto mb-4" />
              <p className="text-stone-500">טוען...</p>
            </div>
          </div>
        }
      >
        <MapPage />
      </Suspense>
    </>
  );
}
