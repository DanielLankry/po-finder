import type { SupabaseClient } from "@supabase/supabase-js";
import type { Photo } from "@/lib/types";

const PHOTO_URL_MARKERS = [
  "/object/public/photos/",
  "/object/sign/photos/",
  "/object/authenticated/photos/",
];

/** Extracts the bucket-relative object path from legacy URLs or new path rows. */
export function getPhotoStoragePath(value: string): string | null {
  for (const marker of PHOTO_URL_MARKERS) {
    const markerIndex = value.indexOf(marker);
    if (markerIndex >= 0) {
      const pathWithQuery = value.slice(markerIndex + marker.length);
      return decodeURIComponent(pathWithQuery.split("?")[0]);
    }
  }

  if (!value.includes("://")) {
    return value.replace(/^\/+/, "") || null;
  }
  return null;
}

/**
 * Replaces stored photo paths/legacy public URLs with short-lived signed URLs.
 * A failed signature keeps the original URL so current public-bucket installs
 * remain backwards compatible until the privacy migration is applied.
 */
export async function signPhotoRecords(
  supabase: SupabaseClient,
  photos: Photo[],
  expiresInSeconds = 60 * 60,
): Promise<Photo[]> {
  const paths = photos
    .map((photo) => getPhotoStoragePath(photo.url))
    .filter((path): path is string => Boolean(path));
  if (paths.length === 0) return photos;

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
    return signedUrl ? { ...photo, url: signedUrl } : photo;
  });
}
