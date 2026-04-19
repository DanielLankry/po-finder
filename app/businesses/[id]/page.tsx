import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getBusinessById } from "@/lib/db/businesses";
import { getTodaySchedule, getWeeklySchedule } from "@/lib/db/schedules";
import { getReviews } from "@/lib/db/reviews";
import { getBusinessEvents } from "@/lib/db/events";
import PhotoGrid from "@/components/business/PhotoGrid";
import ViewTracker from "@/components/business/ViewTracker";
import StatusCard from "@/components/business/StatusCard";
import HoursCard from "@/components/business/HoursCard";
import ReviewSummary from "@/components/business/ReviewSummary";
import ReviewsList from "@/components/business/ReviewsList";
import AddReviewForm from "@/components/business/AddReviewForm";
import EventsSection from "@/components/business/EventsSection";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CATEGORY_LABELS, KASHRUT_LABELS } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let business;
  try { business = await getBusinessById(id); } catch { return {}; }

  const photo = business.photos?.[0]?.url;
  const title = `${business.name} — ${CATEGORY_LABELS[business.category as keyof typeof CATEGORY_LABELS] ?? ""}`;
  const description = business.description
    ? `${business.description.slice(0, 155)}...`
    : `${business.name} — עסק נייד בישראל. מצאו אותנו על המפה בפה קרוב.`;

  return {
    title,
    description,
    alternates: { canonical: `https://pokarov.co.il/businesses/${id}` },
    openGraph: {
      title,
      description,
      url: `https://pokarov.co.il/businesses/${id}`,
      type: "website",
      locale: "he_IL",
      images: photo ? [{ url: photo, width: 800, height: 600, alt: business.name }] : [],
    },
    twitter: { card: "summary_large_image", title, description, images: photo ? [photo] : [] },
  };
}

export default async function BusinessPage({ params }: Props) {
  const { id } = await params;

  let business;
  try {
    business = await getBusinessById(id);
  } catch {
    notFound();
  }

  const [schedule, weeklySchedule, reviews, events, { data: authData }] = await Promise.all([
    getTodaySchedule(id),
    getWeeklySchedule(id),
    getReviews(id),
    getBusinessEvents(id),
    (await createClient()).auth.getUser(),
  ]);

  // If there's no daily override for today, derive it from the weekly template
  const todayDow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })).getDay();
  const todayWeekly = weeklySchedule?.find((w) => w.day_of_week === todayDow);
  const effectiveSchedule = schedule ?? (todayWeekly?.is_active ? {
    id: todayWeekly.id,
    business_id: todayWeekly.business_id,
    date: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" }),
    address: todayWeekly.address,
    lat: todayWeekly.lat,
    lng: todayWeekly.lng,
    open_time: todayWeekly.open_time,
    close_time: todayWeekly.close_time,
    note: todayWeekly.note,
    created_at: todayWeekly.created_at,
  } : null);

  const isLoggedIn = !!authData.user;
  const photos = business.photos ?? [];

  // JSON-LD LocalBusiness schema
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://pokarov.co.il/businesses/${business.id}`,
    name: business.name,
    description: business.description ?? undefined,
    url: `https://pokarov.co.il/businesses/${business.id}`,
    image: photos[0]?.url ?? undefined,
    telephone: business.phone ?? undefined,
    address: business.address ? {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressCountry: "IL",
    } : undefined,
    geo: business.lat && business.lng ? {
      "@type": "GeoCoordinates",
      latitude: business.lat,
      longitude: business.lng,
    } : undefined,
    aggregateRating: business.avg_rating > 0 ? {
      "@type": "AggregateRating",
      ratingValue: business.avg_rating,
      reviewCount: business.review_count,
    } : undefined,
    sameAs: business.instagram ? [`https://instagram.com/${business.instagram}`] : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Navbar />
      <ViewTracker businessId={id} />
      <div className="min-h-screen bg-[#FAFAF7]" dir="rtl">
        <div className="max-w-[1280px] mx-auto px-4 pt-[88px] pb-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm text-stone-500">
            <Link href="/" className="hover:text-[#059669] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded">
              דף הבית
            </Link>
            <ArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
            <span className="text-stone-900">{business.name}</span>
          </div>

          {/* Photo grid */}
          <div className="mb-8">
            <PhotoGrid photos={photos} businessName={business.name} />
          </div>

          {/* 2-column layout: content right (60%), sticky card left (38%) */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content — RIGHT (wider) */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#D1FAE5] text-[#047857] font-medium">
                    {CATEGORY_LABELS[business.category as keyof typeof CATEGORY_LABELS]}
                  </span>
                  {business.kashrut !== "none" && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#D1FAE5] text-[#047857] font-medium">
                      {KASHRUT_LABELS[business.kashrut as keyof typeof KASHRUT_LABELS]}
                    </span>
                  )}
                  {business.business_number && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      עסק מאומת
                    </span>
                  )}
                </div>
                <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-3">
                  {business.name}
                </h1>
                {business.description && (
                  <p className="text-stone-600 leading-relaxed">
                    {business.description}
                  </p>
                )}
              </div>

              <hr className="border-stone-100 mb-6" />

              {/* Weekly hours */}
              {(weeklySchedule?.length || business.weekly_hours) && (
                <div className="mb-6">
                  <HoursCard
                    weeklySchedule={weeklySchedule}
                    weeklyHours={business.weekly_hours}
                  />
                </div>
              )}

              {/* Events */}
              {events.length > 0 && (
                <>
                  <div className="mb-6">
                    <EventsSection events={events} />
                  </div>
                  <hr className="border-stone-100 mb-6" />
                </>
              )}

              {/* Reviews */}
              <div>
                <h2 className="font-display font-bold text-xl text-stone-900 mb-4">
                  ביקורות
                </h2>
                <ReviewSummary
                  avgRating={business.avg_rating}
                  reviewCount={business.review_count}
                />
                <hr className="border-stone-100 my-6" />
                <ReviewsList reviews={reviews} />
                <hr className="border-stone-100 my-6" />
                <AddReviewForm businessId={id} isLoggedIn={isLoggedIn} />
              </div>
            </div>

            {/* Sticky status card — LEFT (narrower) */}
            <div className="lg:w-[360px] flex-shrink-0">
              <StatusCard business={business} schedule={effectiveSchedule} />
            </div>
          </div>
        </div>

        {/* Mobile sticky WhatsApp bar */}
        {business.whatsapp && (
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-200 p-4 safe-area-bottom">
            <a
              href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#1EB856] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              שלחו הודעה בוואטסאפ
            </a>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
