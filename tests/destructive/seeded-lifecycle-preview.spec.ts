import { expect, request as pwRequest, test } from "@playwright/test";
import {
  admin,
  approveBusiness,
  createPendingDurationAttempt,
  expireBusinessListing,
  failPaymentAttempt,
  settlePaymentAttempt,
} from "../utils/supabase-admin";
import { loginViaUI } from "../utils/login";
import {
  LIFECYCLE_PREVIEW_VIEWPORTS,
  cleanupLifecyclePreview,
  seedLifecyclePreview,
  type LifecyclePreviewFixture,
} from "../utils/lifecycle-preview";

test.skip(
  process.env.RUN_DESTRUCTIVE !== "1",
  "destructive preview flow — set RUN_DESTRUCTIVE=1 only for a disposable target",
);
test.skip(
  process.env.PREVIEW_FIXTURES_CONFIRMED !== "1",
  "set PREVIEW_FIXTURES_CONFIRMED=1 after confirming the app and Supabase project are disposable",
);
test.describe.configure({ mode: "serial" });

test("seeded customer and owner lifecycle remains safe from registration through recovery", async ({
  baseURL,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "seed the disposable preview once");
  test.setTimeout(180_000);
  expect(baseURL, "PLAYWRIGHT_BASE_URL is required by the destructive target guard").toBeTruthy();

  let fixture: LifecyclePreviewFixture | null = null;
  let anonymous: Awaited<ReturnType<typeof pwRequest.newContext>> | null = null;

  try {
    // Registration coverage stops before signup so no email is sent. The
    // selected paid duration and business-owner intent must survive the route.
    await page.goto("/pricing");
    await page.getByRole("slider", { name: "משך הפרסום" }).fill("4");
    await page.getByRole("button", { name: "פרסום העסק ל־חודש אחד" }).click();
    await expect(page).toHaveURL(
      /\/auth\/register\?redirectTo=%2Fdashboard%2Fbilling%3Fplan%3Dlisting_1m$/,
    );
    await expect(page.getByRole("button", { name: /בעל עסק/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByText("המשך לבחירת משך ההופעה")).toBeVisible();

    fixture = await seedLifecyclePreview();
    anonymous = await pwRequest.newContext({ baseURL: baseURL! });

    const publicResponse = await anonymous.get(
      `/api/businesses?includeSchedule=1&qa=${encodeURIComponent(fixture.marker)}`,
    );
    expect(publicResponse.status()).toBe(200);
    const publicJson = (await publicResponse.json()) as {
      businesses?: Array<Record<string, unknown> & {
        id: string;
        hours_status?: string;
        photos?: Array<{ url: string }>;
      }>;
    };
    const publicBusinesses = publicJson.businesses ?? [];
    const fixtureIds = new Set(Object.values(fixture.businesses).map((business) => business.id));
    const seededPublic = publicBusinesses.filter((business) => fixtureIds.has(business.id));
    expect(seededPublic).toHaveLength(5);
    for (const business of seededPublic) {
      expect(business).not.toHaveProperty("owner_id");
      expect(business).not.toHaveProperty("business_number");
      expect(business).not.toHaveProperty("boosted");
    }

    expect(findBusiness(seededPublic, fixture.businesses.featured.id)?.hours_status).toBe(
      "scheduled",
    );
    expect(findBusiness(seededPublic, fixture.businesses.closed.id)?.hours_status).toBe("closed");
    expect(findBusiness(seededPublic, fixture.businesses.noPhoto.id)?.hours_status).toBe("unknown");
    expect(findBusiness(seededPublic, fixture.businesses.noPhoto.id)?.photos ?? []).toHaveLength(0);
    expect(findBusiness(seededPublic, fixture.businesses.featured.id)?.photos?.[0]?.url).toMatch(
      /\/object\/sign\/photos\/.*token=/,
    );

    const unauthenticatedMine = await anonymous.get("/api/businesses?mine=1");
    expect(unauthenticatedMine.status()).toBe(401);

    // A seeded customer sees the same safe discovery surface at every mobile
    // regression width. Confirmed-closed rows remain in the API as explicit
    // schedule data but are hidden by the shared map/list discovery filter.
    await page.context().clearCookies();
    await loginViaUI(page, fixture.customer.email, fixture.customer.password, "/");
    for (const width of LIFECYCLE_PREVIEW_VIEWPORTS) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/?qa=${fixture.marker}-${width}`);
      const search = page.locator('input[type="search"]').first();
      await search.fill(fixture.marker);

      const featuredCard = page.getByRole("button", {
        name: new RegExp(escapeRegExp(fixture.businesses.featured.name)),
      });
      await expect(featuredCard).toBeVisible({ timeout: 20_000 });
      await expect(
        page.getByRole("button", {
          name: new RegExp(escapeRegExp(fixture.businesses.noPhoto.name)),
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: new RegExp(escapeRegExp(fixture.businesses.closed.name)),
        }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("img", { name: `תמונה של ${fixture.businesses.featured.name}` }),
      ).toBeVisible();

      const cardBox = await featuredCard.boundingBox();
      expect(cardBox?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(cardBox?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/businesses/${fixture.businesses.featured.id}`);
    await expect(page.getByRole("heading", { name: fixture.businesses.featured.name })).toBeVisible();
    await expect(page.getByText(fixture.eventTitle)).toBeVisible();
    await expect(page.getByText(fixture.reviewText)).toBeVisible();
    await expect(page.getByRole("link", { name: "התקשרו" })).toHaveAttribute(
      "href",
      "tel:03-555-0113",
    );
    await expect(page.getByRole("link", { name: /שלחו הודעה בוואטסאפ/ }).first()).toHaveAttribute(
      "href",
      "https://wa.me/972505550113",
    );

    // Owner lifecycle: private draft -> verified/ready -> pending recovery ->
    // settled/public -> expired/private -> failed recovery. Settlement is the
    // local database RPC only and records provider_called=false.
    await page.context().clearCookies();
    await loginViaUI(
      page,
      fixture.lifecycleOwner.email,
      fixture.lifecycleOwner.password,
      "/dashboard/profile",
    );
    await page.goto("/dashboard/profile");
    await expect(page.locator("body")).toContainText(fixture.lifecycleBusiness.name);
    await expect(page.getByText("הטיוטה ממתינה לאימות").first()).toBeVisible();

    await approveBusiness(fixture.lifecycleBusiness.id);
    await page.goto("/dashboard/billing");
    await expect(page.locator("body")).toContainText(fixture.lifecycleBusiness.name);
    await expect(page.getByText("העסק מאומת ומוכן לפרסום").first()).toBeVisible();

    const pending = await createPendingDurationAttempt({
      ownerId: fixture.lifecycleOwner.id,
      businessId: fixture.lifecycleBusiness.id,
      productCode: "listing_1m",
    });
    await page.goto(`/dashboard/billing?payment=processing&attempt=${pending.id}`);
    await expect(page.getByText("התשלום בבדיקה")).toBeVisible();
    await expect(page.getByText(/לא צריך לשלם שוב/)).toBeVisible();

    const { data: beforeSettlement } = await admin()
      .from("businesses")
      .select("is_active, expires_at")
      .eq("id", fixture.lifecycleBusiness.id)
      .single();
    expect(beforeSettlement).toMatchObject({ is_active: false, expires_at: null });

    await settlePaymentAttempt({
      attemptId: pending.id,
      purpose: "dan-113-seeded-lifecycle-preview",
    });
    const { data: settledAttempt } = await admin()
      .from("payment_attempts")
      .select("status, product_code, plan_days, duration_months, raw_return")
      .eq("id", pending.id)
      .single();
    expect(settledAttempt).toMatchObject({
      status: "succeeded",
      product_code: "listing_1m",
      plan_days: 30,
      duration_months: 1,
      raw_return: {
        qa: true,
        provider_called: false,
        purpose: "dan-113-seeded-lifecycle-preview",
      },
    });

    await page.goto(`/dashboard/billing?payment=success&attempt=${pending.id}`);
    await expect(page.getByText("התשלום נקלט")).toBeVisible();
    await expect(page.getByText("העסק מופיע לציבור").first()).toBeVisible();

    const ownerPublicBeforeExpiry = await page.request.get(
      `/api/businesses?qa=${fixture.marker}-active-owner`,
    );
    const ownerPublicBeforeJson = await ownerPublicBeforeExpiry.json();
    expect(
      (ownerPublicBeforeJson.businesses ?? []).some(
        (business: { id: string }) => business.id === fixture!.lifecycleBusiness.id,
      ),
    ).toBe(true);

    await expireBusinessListing(fixture.lifecycleBusiness.id);
    await page.goto("/dashboard/billing");
    await expect(page.getByText("תקופת ההופעה הסתיימה").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "חידוש הופעה" }).first()).toBeVisible();

    const ownerPublicAfterExpiry = await page.request.get(
      `/api/businesses?qa=${fixture.marker}-expired-owner`,
    );
    const ownerPublicAfterJson = await ownerPublicAfterExpiry.json();
    expect(
      (ownerPublicAfterJson.businesses ?? []).some(
        (business: { id: string }) => business.id === fixture!.lifecycleBusiness.id,
      ),
    ).toBe(false);

    const failed = await createPendingDurationAttempt({
      ownerId: fixture.lifecycleOwner.id,
      businessId: fixture.lifecycleBusiness.id,
      productCode: "listing_7d",
    });
    await failPaymentAttempt({ attemptId: failed.id });
    await page.goto(`/dashboard/billing?payment=failed&attempt=${failed.id}`);
    await expect(page.getByText("התשלום לא הושלם")).toBeVisible();
    await expect(page.getByText("תקופת ההופעה הסתיימה").first()).toBeVisible();
  } finally {
    await anonymous?.dispose();
    if (fixture) await cleanupLifecyclePreview(fixture);
  }
});

function findBusiness<T extends { id: string }>(businesses: T[], id: string): T | undefined {
  return businesses.find((business) => business.id === id);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
