import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getIsraelDateContext } from "../../lib/utils/schedule";
import {
  TEST_PASSWORD,
  admin,
  cleanupTestUser,
  createConfirmedUser,
  createPendingBusinessAsOwner,
  signInTestUser,
  uniqEmail,
  type CreatedUser,
} from "./supabase-admin";

export const LIFECYCLE_PREVIEW_VIEWPORTS = [320, 390, 430] as const;

export type LifecyclePreviewFixture = {
  marker: string;
  customer: CreatedUser;
  catalogOwner: CreatedUser;
  lifecycleOwner: CreatedUser;
  lifecycleBusiness: { id: string; name: string };
  businesses: {
    featured: { id: string; name: string };
    noPhoto: { id: string; name: string };
    closed: { id: string; name: string };
    flowers: { id: string; name: string };
    sweets: { id: string; name: string };
  };
  eventTitle: string;
  reviewText: string;
  photoPath: string;
};

type PreviewCleanup = {
  users: CreatedUser[];
  photoPaths: string[];
};

/**
 * Seeds a disposable cross-role preview without calling HYP. Public catalog
 * rows use service-role fixture setup; the lifecycle draft still goes through
 * the authenticated owner insert path so its RLS behavior remains real.
 */
export async function seedLifecyclePreview(): Promise<LifecyclePreviewFixture> {
  const cleanup: PreviewCleanup = { users: [], photoPaths: [] };
  const marker = `DAN113-${Date.now()}`;

  try {
    const customer = await createPreviewUser(cleanup, "customer", "Preview Customer");
    const catalogOwner = await createPreviewUser(cleanup, "business_owner", "Preview Catalog Owner");
    const lifecycleOwner = await createPreviewUser(cleanup, "business_owner", "Preview Lifecycle Owner");
    const ownerClient = await signInTestUser(lifecycleOwner);
    const lifecycleBusiness = await createPendingBusinessAsOwner(ownerClient, {
      ownerId: lifecycleOwner.id,
      name: `${marker} טיוטת בעל עסק`,
    });

    const names = {
      featured: `${marker} קפה שכונתי מצולם`,
      noPhoto: `${marker} עסק ללא תמונה ושעות`,
      closed: `${marker} עסק סגור היום`,
      flowers: `${marker} פרחים פתוחים`,
      sweets: `${marker} מאפים ללא שעות`,
    };
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const sb = admin();
    const { data: rows, error: businessError } = await sb
      .from("businesses")
      .insert([
        previewBusinessRow(catalogOwner.id, names.featured, "coffee", expiresAt, {
          description: "עסק תצוגה עם תמונה חתומה, אירוע, ביקורת ופרטי קשר.",
          phone: "03-555-0113",
          whatsapp: "972505550113",
          business_number: `${marker}-private`,
        }),
        previewBusinessRow(catalogOwner.id, names.noPhoto, "food", expiresAt),
        previewBusinessRow(catalogOwner.id, names.closed, "meat", expiresAt),
        previewBusinessRow(catalogOwner.id, names.flowers, "flowers", expiresAt),
        previewBusinessRow(catalogOwner.id, names.sweets, "sweets", expiresAt, {
          kashrut: "kosher",
        }),
      ])
      .select("id, name");
    if (businessError) throw new Error(`preview business seed failed: ${businessError.message}`);

    const byName = new Map((rows ?? []).map((row) => [row.name, row.id]));
    const businesses = {
      featured: requiredBusiness(byName, names.featured),
      noPhoto: requiredBusiness(byName, names.noPhoto),
      closed: requiredBusiness(byName, names.closed),
      flowers: requiredBusiness(byName, names.flowers),
      sweets: requiredBusiness(byName, names.sweets),
    };

    const context = getIsraelDateContext();
    const { error: scheduleError } = await sb.from("business_schedules").insert([
      openScheduleRow(businesses.featured.id, context.date),
      openScheduleRow(businesses.flowers.id, context.date),
      {
        business_id: businesses.closed.id,
        date: context.date,
        open_time: null,
        close_time: null,
        note: "סגור היום — תרחיש תצוגה",
      },
    ]);
    if (scheduleError) throw new Error(`preview schedule seed failed: ${scheduleError.message}`);

    const eventTitle = `${marker} אירוע טעימות`;
    const { error: eventError } = await sb.from("business_events").insert({
      business_id: businesses.featured.id,
      title: eventTitle,
      description: "אירוע תצוגה מקומי ללא תשלום אמיתי.",
      event_date: context.date,
      start_time: "12:00:00",
      end_time: "14:00:00",
      price: 0,
    });
    if (eventError) throw new Error(`preview event seed failed: ${eventError.message}`);

    const reviewText = `${marker} ביקורת לקוח מאומתת`;
    const { error: reviewError } = await sb.from("reviews").insert({
      business_id: businesses.featured.id,
      user_id: customer.id,
      reviewer_name: "לקוחת תצוגה",
      rating: 5,
      comment: reviewText,
    });
    if (reviewError) throw new Error(`preview review seed failed: ${reviewError.message}`);

    const photoPath = `${businesses.featured.id}/${marker}.png`;
    const logo = await readFile(resolve(process.cwd(), "public/logo.png"));
    const { error: uploadError } = await sb.storage.from("photos").upload(photoPath, logo, {
      contentType: "image/png",
      upsert: false,
    });
    if (uploadError) throw new Error(`preview photo upload failed: ${uploadError.message}`);
    cleanup.photoPaths.push(photoPath);

    const { error: photoError } = await sb.from("photos").insert({
      business_id: businesses.featured.id,
      url: photoPath,
      is_primary: true,
    });
    if (photoError) throw new Error(`preview photo row failed: ${photoError.message}`);

    return {
      marker,
      customer,
      catalogOwner,
      lifecycleOwner,
      lifecycleBusiness: {
        id: lifecycleBusiness.id,
        name: `${marker} טיוטת בעל עסק`,
      },
      businesses,
      eventTitle,
      reviewText,
      photoPath,
    };
  } catch (error) {
    await cleanupSeededPreview(cleanup);
    throw error;
  }
}

export async function cleanupLifecyclePreview(fixture: LifecyclePreviewFixture): Promise<void> {
  await cleanupSeededPreview({
    users: [fixture.lifecycleOwner, fixture.catalogOwner, fixture.customer],
    photoPaths: [fixture.photoPath],
  });
}

async function createPreviewUser(
  cleanup: PreviewCleanup,
  role: "business_owner" | "customer",
  name: string,
): Promise<CreatedUser> {
  const user = await createConfirmedUser({
    email: uniqEmail(`dan113-${role}`),
    password: TEST_PASSWORD,
    name,
    role,
  });
  cleanup.users.push(user);
  return user;
}

async function cleanupSeededPreview(cleanup: PreviewCleanup): Promise<void> {
  if (cleanup.photoPaths.length > 0) {
    const { error } = await admin().storage.from("photos").remove(cleanup.photoPaths);
    if (error) console.warn(`preview photo cleanup warning: ${error.message}`);
  }
  for (const user of cleanup.users) {
    await cleanupTestUser(user.id);
  }
}

function previewBusinessRow(
  ownerId: string,
  name: string,
  category: "coffee" | "food" | "meat" | "flowers" | "sweets",
  expiresAt: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    owner_id: ownerId,
    name,
    description: "עסק תצוגה עבור בדיקת גילוי לקוחות בסביבה חד־פעמית.",
    category,
    address: "רחוב התצוגה 113, תל אביב",
    lat: 32.0853,
    lng: 34.7818,
    kashrut: "none",
    is_verified: true,
    is_active: true,
    is_legacy_public: false,
    expires_at: expiresAt,
    ...overrides,
  };
}

function openScheduleRow(businessId: string, date: string) {
  return {
    business_id: businessId,
    date,
    open_time: "00:00:00",
    close_time: "23:59:59",
    note: "פתוח לאורך יום התצוגה",
  };
}

function requiredBusiness(byName: Map<string, string>, name: string) {
  const id = byName.get(name);
  if (!id) throw new Error(`preview business row missing after insert: ${name}`);
  return { id, name };
}
