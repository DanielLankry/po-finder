import { Suspense } from "react";
import MapPage from "./MapPage";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-surface">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-stone-500">טוען...</p>
          </div>
        </div>
      }
    >
      <MapPage />
    </Suspense>
  );
}
