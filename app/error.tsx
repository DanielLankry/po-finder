"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4" dir="rtl">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">!</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-stone-900 mb-2">
          משהו השתבש
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          אירעה שגיאה בלתי צפויה. נסו לרענן את העמוד.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2"
        >
          נסו שוב
        </button>
      </div>
    </div>
  );
}
