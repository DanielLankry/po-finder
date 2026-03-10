import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessById } from "@/lib/db/businesses";
import { getTodaySchedule } from "@/lib/db/schedules";
import { getReviews } from "@/lib/db/reviews";
import PhotoGrid from "@/components/business/PhotoGrid";
import StatusCard from "@/components/business/StatusCard";
import HoursCard from "@/components/business/HoursCard";
import ReviewSummary from "@/components/business/ReviewSummary";
import ReviewsList from "@/components/business/ReviewsList";
import AddReviewForm from "@/components/business/AddReviewForm";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CATEGORY_LABELS, KASHRUT_LABELS } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BusinessPage({ params }: Props) {
  const { id } = await params;

  let business;
  try {
    business = await getBusinessById(id);
  } catch {
    notFound();
  }

  const [schedule, reviews, { data: authData }] = await Promise.all([
    getTodaySchedule(id),
    getReviews(id),
    (await createClient()).auth.getUser(),
  ]);

  const isLoggedIn = !!authData.user;
  const photos = business.photos ?? [];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FAFAF7]" dir="rtl">
        <div className="max-w-[1280px] mx-auto px-4 pt-[88px] pb-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm text-stone-500">
            <Link href="/" className="hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded">
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
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                    {CATEGORY_LABELS[business.category as keyof typeof CATEGORY_LABELS]}
                  </span>
                  {business.kashrut !== "none" && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
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
              {business.weekly_hours && (
                <div className="mb-6">
                  <HoursCard weeklyHours={business.weekly_hours} />
                </div>
              )}

              <hr className="border-stone-100 mb-6" />

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
              <StatusCard business={business} schedule={schedule} />
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
