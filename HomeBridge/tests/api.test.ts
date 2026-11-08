import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/src/app";
import {
  filtersSchema,
  propertySchema,
  slotSchema,
  profileSchema,
} from "../shared/validation";
test("API refuses unauthenticated mutations before touching database", async () => {
  const app = createApp({
    url: "https://example.supabase.co",
    key: "test-public-key",
    origins: ["http://localhost:5173"],
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    for (const path of ["/api/bookings", "/api/properties", "/api/slots"]) {
      const response: Response = await fetch(
        `http://127.0.0.1:${address.port}${path}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );
      assert.equal(response.status, 401);
    }
  } finally {
    await new Promise<void>((r, j) => server.close((e) => (e ? j(e) : r())));
  }
});
test("combined search filters validate ranges and exact room types", () => {
  assert.equal(
    filtersSchema.safeParse({ min: "1200", max: "800" }).success,
    false,
  );
  assert.equal(filtersSchema.safeParse({ room_type: "castle" }).success, false);
  const f = filtersSchema.parse({
    city: "Peterborough",
    min: "650",
    max: "1300",
    bedrooms: "0",
    available: "2027-01-01",
    sort: "price-low",
  });
  assert.equal(f.bedrooms, 0);
  assert.equal(f.max, 1300);
});
test("server strips forged owner IDs and rejects invalid data", () => {
  const p = propertySchema.parse({
    landlord_id: "forged",
    title: "A valid title",
    description: "A sufficiently long description.",
    city: "Peterborough",
    address: "Sample address",
    monthly_rent: 900,
    room_type: "Private room",
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
    available_from: "2027-01-01",
  });
  assert.ok(!("landlord_id" in p));
  assert.equal(
    profileSchema.safeParse({
      full_name: "Name",
      preferred_timezone: "Fake/Timezone",
    }).success,
    false,
  );
  assert.equal(
    slotSchema.safeParse({
      property_id: "00000000-0000-4000-8000-000000000001",
      start_time: "2027-01-01T12:00:00Z",
      end_time: "2027-01-01T11:00:00Z",
      viewing_type: "virtual",
    }).success,
    false,
  );
});
test("UTC viewing timestamps render correctly across student time zones", () => {
  const date = new Date("2027-01-15T15:00:00Z");
  const hour = (zone: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date);
  assert.equal(hour("America/Toronto"), "10");
  assert.equal(hour("Asia/Ho_Chi_Minh"), "22");
  assert.equal(hour("Asia/Kolkata"), "20");
});
