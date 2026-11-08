import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { demoProperties } from "../shared/demo.js";
// This script is never imported by the app or server. Use a separate development project.
if (
  process.env.NODE_ENV !== "development" ||
  !process.argv.includes("--confirm-development")
)
  throw new Error(
    "Development-only seed: set NODE_ENV=development and pass --confirm-development.",
  );
const {
  SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: key,
  DEMO_PASSWORD: password,
} = process.env;
if (!url || !key || !password || password.length < 12)
  throw new Error(
    "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and a DEMO_PASSWORD of at least 12 characters.",
  );
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const owners: string[] = [];
for (const [email, role, name] of [
  ["landlord1@homebridge.example", "landlord", "Demo Landlord One"],
  ["landlord2@homebridge.example", "landlord", "Demo Landlord Two"],
  ["student@homebridge.example", "student", "Demo Student"],
]) {
  let { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, full_name: name },
  });
  if (error) {
    const existing = await db
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (!existing.data) throw error;
    if (role === "landlord") owners.push(existing.data.id);
  } else if (role === "landlord") owners.push(data.user!.id);
}
for (const [i, sample] of demoProperties.entries()) {
  const { property_images, ...base } = sample;
  const p = {
    ...base,
    landlord_id: owners[i % owners.length],
    available_from: new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .slice(0, 10),
  };
  const { error } = await db.from("properties").upsert(p);
  if (error) throw error;
  const exists = await db
    .from("property_images")
    .select("id")
    .eq("property_id", p.id)
    .limit(1);
  if (exists.error) throw exists.error;
  if (!exists.data.length) {
    const images = await db
      .from("property_images")
      .insert(
        property_images.map((img) => ({
          property_id: p.id,
          image_url: img.image_url,
        })),
      );
    if (images.error) throw images.error;
  }
  for (let d = 1; d <= 4; d++) {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + d);
    start.setUTCHours(16 + i, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60000);
    const slot = await db
      .from("viewing_slots")
      .upsert(
        {
          property_id: p.id,
          landlord_id: p.landlord_id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          viewing_type: d % 2 ? "virtual" : "in-person",
          meeting_url: null,
        },
        {
          onConflict: "property_id,start_time,viewing_type",
          ignoreDuplicates: true,
        },
      );
    if (slot.error) throw slot.error;
  }
}
console.log(
  "Fictional development data ready: 6 properties, 2 landlords, 1 student, and future viewing slots.",
);
console.log(
  "Accounts: landlord1@homebridge.example, landlord2@homebridge.example, student@homebridge.example. Use your DEMO_PASSWORD. No real messages were sent.",
);
