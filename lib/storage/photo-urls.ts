import type { SupabaseClient } from "@supabase/supabase-js";
import type { Photo } from "@/lib/types";

const PHOTO_URL_MARKERS = [
  "/object/public/photos/",
  "/object/sign/photos/",
  "/object/authenticated/photos/",
];

function normalizePhotoPath(value: string): string | null {
  try {
    const decoded = decodeURIComponent(value).replace(/^\/+/, "");
    if (!decoded || decoded.length > 1024 || /[\u0000-\u001f\u007f]/.test(decoded)) {
      return null;
    }
    if (decoded.split("/").some((segment) => segment === "." || segment === "..")) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/** Extracts the bucket-relative object path from legacy URLs or new path rows. */
export function getPhotoStoragePath(value: string): string | null {
  for (const marker of PHOTO_URL_MARKERS) {
    const markerIndex = value.indexOf(marker);
    if (markerIndex >= 0) {
      const pathWithQuery = value.slice(markerIndex + marker.length);
      return normalizePhotoPath(pathWithQuery.split("?")[0]);
    }
  }

  if (!value.includes("://")) {
    return normalizePhotoPath(value);
  }
  return null;
}

/**
 * Replaces stored photo paths/legacy public URLs with short-lived signed URLs.
 * A missing/failed signature never falls back to a stored public, expired, or
 * arbitrary external URL. Callers render the normal branded image fallback.
 */
export async function signPhotoRecords(
  supabase: SupabaseClient,
  photos: Photo[],
  expiresInSeconds = 60 * 60,
): Promise<Photo[]> {
  const paths = photos
    .map((photo) => getPhotoStoragePath(photo.url))
    .filter((path): path is string => Boolean(path));
  if (paths.length === 0) {
    return photos.map((photo) => ({ ...photo, url: "" }));
  }

  const uniquePaths = [...new Set(paths)];
  const { data } = await supabase.storage
    .from("photos")
    .createSignedUrls(uniquePaths, expiresInSeconds);
  const signedByPath = new Map(
    (data ?? [])
      .filter((item) => item.signedUrl)
      .map((item) => [item.path, item.signedUrl]),
  );

  return photos.map((photo) => {
    const path = getPhotoStoragePath(photo.url);
    const signedUrl = path ? signedByPath.get(path) : null;
    return { ...photo, url: signedUrl ?? "" };
  });
}
