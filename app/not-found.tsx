import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4" dir="rtl">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
          <MapPin className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="font-display font-extrabold text-6xl text-stone-900 mb-2">404</h1>
        <p className="text-stone-600 text-lg mb-1">העמוד לא נמצא</p>
        <p className="text-stone-400 text-sm mb-8">
          ייתכן שהקישור שגוי או שהעמוד הוסר.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}
