import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const ids = {
  landlord: "10000000-0000-4000-8000-000000000001",
  other: "10000000-0000-4000-8000-000000000002",
  student: "10000000-0000-4000-8000-000000000003",
  stranger: "10000000-0000-4000-8000-000000000004",
};
test("PostgreSQL schema, authorization, and reservation lifecycle", async (t) => {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid,name text,bucket_id text); alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;`);
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/001_homebridge.sql", import.meta.url),
      "utf8",
    ),
  );
  for (const [name, id] of Object.entries(ids))
    await db.query(`insert into auth.users values($1,$2,$3)`, [
      id,
      `${name}@example.invalid`,
      JSON.stringify({
        full_name: name,
        role: name === "landlord" || name === "other" ? "landlord" : "student",
      }),
    ]);
  const as = async (id: string, role = "authenticated") => {
    await db.exec(`reset role; set role ${role};`);
    await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [id]);
  };
  const scalar = async (sql: string, params: unknown[] = []) =>
    Object.values(
      (await db.query<Record<string, unknown>>(sql, params)).rows[0],
    )[0] as string;
  await as(ids.landlord);
  const property = await scalar(
    `insert into public.properties(landlord_id,title,description,city,address,monthly_rent,room_type,bedrooms,bathrooms,available_from) values($1,'Fictional rental','A sufficiently detailed fictional listing description','Peterborough','Fictional sample address',850,'Private room',1,1,current_date) returning id`,
    [ids.landlord],
  );
  const createSlot = async (days = 2) =>
    scalar(
      `select public.manage_slot($1,now()+($2||' days')::interval,now()+($2||' days')::interval+interval '30 minutes','virtual','https://example.com/private-meeting')`,
      [property, days],
    );
  const slot = await createSlot();
  let booking = "";
  await t.test(
    "anonymous visitors see properties and safe availability, never meeting URLs",
    async () => {
      await as("", "anon");
      assert.equal((await db.query("select * from properties")).rows.length, 1);
      const rows = (
        await db.query<Record<string, unknown>>(
          "select * from available_slots($1)",
          [property],
        )
      ).rows;
      assert.equal(rows.length, 1);
      assert.ok(!("meeting_url" in rows[0]));
      await assert.rejects(
        db.query("select * from viewing_slots"),
        /permission denied/,
      );
      await assert.rejects(
        db.query("select book_viewing($1)", [slot]),
        /permission denied/,
      );
    },
  );
  await t.test(
    "students cannot become landlords or write another user profile",
    async () => {
      await as(ids.student);
      await assert.rejects(
        db.query("update profiles set role='landlord' where id=$1", [
          ids.student,
        ]),
        /permission denied/,
      );
      const r = await db.query(
        "update profiles set full_name='Hacked' where id=$1 returning id",
        [ids.landlord],
      );
      assert.equal(r.rows.length, 0);
      await assert.rejects(
        db.query(
          "select manage_slot($1,now()+interval '3 days',now()+interval '3 days 1 hour','virtual',null)",
          [property],
        ),
        /Not permitted/,
      );
    },
  );
  await t.test(
    "other landlord cannot modify this property or its availability",
    async () => {
      await as(ids.other);
      assert.equal(
        (
          await db.query(
            "update properties set title='Hacked title' where id=$1 returning id",
            [property],
          )
        ).rows.length,
        0,
      );
      await assert.rejects(
        db.query("select remove_slot($1)", [slot]),
        /Not permitted/,
      );
      await assert.rejects(
        db.query("select book_viewing($1)", [slot]),
        /Student account required/,
      );
    },
  );
  await t.test(
    "student books atomically and a competing booking is rejected",
    async () => {
      await as(ids.student);
      const attempts = await Promise.allSettled([
        db.query("select book_viewing($1) as id", [slot]),
        db.query("select book_viewing($1) as id", [slot]),
      ]);
      assert.equal(attempts.filter((x) => x.status === "fulfilled").length, 1);
      const won = attempts.find(
        (x) => x.status === "fulfilled",
      ) as PromiseFulfilledResult<{ rows: { id: string }[] }>;
      booking = won.value.rows[0].id;
      assert.equal(
        (await db.query("select * from available_slots($1)", [property])).rows
          .length,
        0,
      );
    },
  );
  await t.test(
    "participants see same booking, strangers cannot access private data",
    async () => {
      await as(ids.student);
      let rows = (
        await db.query<{
          my_appointments: { id: string; meeting_url: string }[];
        }>("select my_appointments()")
      ).rows[0].my_appointments;
      assert.equal(rows[0].id, booking);
      assert.equal(rows[0].meeting_url, "https://example.com/private-meeting");
      await as(ids.landlord);
      assert.equal(
        (
          await db.query<{ my_appointments: { id: string }[] }>(
            "select my_appointments()",
          )
        ).rows[0].my_appointments[0].id,
        booking,
      );
      await as(ids.stranger);
      assert.equal((await db.query("select * from bookings")).rows.length, 0);
      assert.equal(
        (await db.query("select * from viewing_slots")).rows.length,
        0,
      );
      await assert.rejects(
        db.query("select cancel_booking($1)", [booking]),
        /Not permitted/,
      );
    },
  );
  await t.test("reserved slot cannot be edited or removed", async () => {
    await as(ids.landlord);
    await assert.rejects(
      db.query("select remove_slot($1)", [slot]),
      /Cancel the upcoming/,
    );
    await assert.rejects(
      db.query(
        "select manage_slot($1,now()+interval '3 days',now()+interval '3 days 1 hour','virtual',null,$2)",
        [property, slot],
      ),
      /Cannot edit/,
    );
  });
  await t.test(
    "cancellation reopens the slot; cancelled student loses meeting access",
    async () => {
      await as(ids.student);
      await db.query("select cancel_booking($1)", [booking]);
      assert.equal(
        (await db.query("select * from available_slots($1)", [property])).rows
          .length,
        1,
      );
      const history = (
        await db.query<{ my_appointments: { meeting_url: null }[] }>(
          "select my_appointments()",
        )
      ).rows[0].my_appointments;
      assert.equal(history[0].meeting_url, null);
      await as(ids.stranger);
      const newId = await scalar("select book_viewing($1)", [slot]);
      assert.notEqual(newId, booking);
      await db.query("select cancel_booking($1)", [newId]);
    },
  );
  await t.test(
    "unavailable properties reject new bookings; removed slots stay removed",
    async () => {
      await as(ids.landlord);
      await db.query("update properties set status='unavailable' where id=$1", [
        property,
      ]);
      await as(ids.student);
      await assert.rejects(
        db.query("select book_viewing($1)", [slot]),
        /unavailable/,
      );
      await as(ids.landlord);
      await db.query("update properties set status='active' where id=$1", [
        property,
      ]);
      await db.query("select remove_slot($1)", [slot]);
      await as(ids.student);
      await assert.rejects(
        db.query("select book_viewing($1)", [slot]),
        /unavailable/,
      );
    },
  );
  await t.test(
    "saved properties are private and ownership cannot be spoofed",
    async () => {
      await as(ids.student);
      await db.query(
        "insert into saved_properties(student_id,property_id) values($1,$2)",
        [ids.student, property],
      );
      await assert.rejects(
        db.query(
          "insert into saved_properties(student_id,property_id) values($1,$2)",
          [ids.stranger, property],
        ),
        /row-level security/,
      );
      await as(ids.stranger);
      assert.equal(
        (await db.query("select * from saved_properties")).rows.length,
        0,
      );
    },
  );
  await t.test(
    "completed appointments are immutable and remain in history",
    async () => {
      await as(ids.landlord);
      const s = await createSlot(5);
      await as(ids.student);
      const b = await scalar("select book_viewing($1)", [s]);
      await db.exec("reset role");
      await db.query(
        "update viewing_slots set start_time=now()-interval '2 hours',end_time=now()-interval '1 hour' where id=$1",
        [s],
      );
      await as(ids.student);
      await assert.rejects(
        db.query("select complete_booking($1)", [b]),
        /Only the landlord/,
      );
      await as(ids.landlord);
      await db.query("select complete_booking($1)", [b]);
      await assert.rejects(
        db.query("select remove_slot($1)", [s]),
        /completed appointments/,
      );
      await as(ids.student);
      await assert.rejects(
        db.query("select cancel_booking($1)", [b]),
        /Only upcoming/,
      );
      assert.equal(
        await scalar("select status from bookings where id=$1", [b]),
        "completed",
      );
    },
  );
  await db.close();
});
