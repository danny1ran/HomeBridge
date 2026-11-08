import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { z } from "zod";
import {
  filtersSchema,
  propertySchema,
  profileSchema,
  slotSchema,
  uuid,
} from "../../shared/validation.js";
type AuthRequest = Request & { db: SupabaseClient; user: User };
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function result<T>(r: {
  data: T;
  error: { code?: string; message: string } | null;
}): T {
  if (r.error) {
    const e = r.error;
    throw new HttpError(
      e.code === "23505" ? 409 : e.code === "42501" ? 403 : 400,
      e.code === "23505"
        ? "That slot or record already exists. Please refresh."
        : e.code === "42501"
          ? "You do not have permission for this action."
          : e.code === "P0001"
            ? e.message
            : "Unable to save or load this request. Check your entries and try again.",
    );
  }
  return r.data;
}
export function createApp(config: {
  url: string;
  key: string;
  origins: string[];
}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.origins }));
  app.use(express.json({ limit: "100kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  const client = (token?: string) =>
    createClient(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined,
    });
  const auth = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      if (!token) throw new HttpError(401, "Please log in.");
      const db = client(token);
      const { data, error } = await db.auth.getUser(token);
      if (error || !data.user)
        throw new HttpError(401, "Your session expired. Please log in again.");
      Object.assign(req, { db, user: data.user });
      next();
    } catch (e) {
      next(e);
    }
  };
  const role =
    (required: string) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const r = req as unknown as AuthRequest;
        const p = result(
          await r.db
            .from("profiles")
            .select("role")
            .eq("id", r.user.id)
            .single(),
        );
        if (p?.role !== required)
          throw new HttpError(403, `${required} account required.`);
        next();
      } catch (e) {
        next(e);
      }
    };
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/properties", async (req, res) => {
    const f = filtersSchema.parse(req.query);
    let q = client()
      .from("properties")
      .select("*,property_images(*)")
      .eq("status", "active");
    if (f.city) q = q.ilike("city", f.city.replace(/[%_]/g, ""));
    if (f.university) q = q.eq("university", f.university);
    if (f.min !== undefined) q = q.gte("monthly_rent", f.min);
    if (f.max !== undefined) q = q.lte("monthly_rent", f.max);
    if (f.room_type) q = q.eq("room_type", f.room_type);
    if (f.bedrooms !== undefined) q = q.eq("bedrooms", f.bedrooms);
    if (f.available) q = q.lte("available_from", f.available);
    q =
      f.sort === "newest"
        ? q.order("created_at", { ascending: false })
        : q.order("monthly_rent", { ascending: f.sort === "price-low" });
    res.json(result(await q.limit(200)));
  });
  app.get("/api/properties/:id", async (req, res) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const p = result(
      await client(token)
        .from("properties")
        .select("*,property_images(*)")
        .eq("id", uuid.parse(req.params.id))
        .maybeSingle(),
    );
    if (!p) throw new HttpError(404, "Property not found.");
    res.json(p);
  });
  app.get("/api/properties/:id/slots", async (req, res) =>
    res.json(
      result(
        await client().rpc("available_slots", {
          p_property: uuid.parse(req.params.id),
        }),
      ),
    ),
  );
  app.use("/api", auth);
  app.get("/api/profile", async (req, res) => {
    const r = req as unknown as AuthRequest;
    res.json(
      result(
        await r.db.from("profiles").select("*").eq("id", r.user.id).single(),
      ),
    );
  });
  app.patch("/api/profile", async (req, res) => {
    const r = req as unknown as AuthRequest;
    res.json(
      result(
        await r.db
          .from("profiles")
          .update(profileSchema.parse(req.body))
          .eq("id", r.user.id)
          .select()
          .single(),
      ),
    );
  });
  app.get("/api/listings", role("landlord"), async (req, res) => {
    const r = req as unknown as AuthRequest;
    res.json(
      result(
        await r.db
          .from("properties")
          .select("*,property_images(*)")
          .eq("landlord_id", r.user.id)
          .order("created_at", { ascending: false }),
      ),
    );
  });
  app.post("/api/properties", role("landlord"), async (req, res) => {
    const r = req as unknown as AuthRequest;
    res.status(201).json(
      result(
        await r.db
          .from("properties")
          .insert({ ...propertySchema.parse(req.body), landlord_id: r.user.id })
          .select()
          .single(),
      ),
    );
  });
  app.patch("/api/properties/:id", role("landlord"), async (req, res) => {
    const r = req as unknown as AuthRequest;
    res.json(
      result(
        await r.db
          .from("properties")
          .update(propertySchema.parse(req.body))
          .eq("id", uuid.parse(req.params.id))
          .eq("landlord_id", r.user.id)
          .select()
          .single(),
      ),
    );
  });
  app.post("/api/properties/:id/images", role("landlord"), async (req, res) => {
    const r = req as unknown as AuthRequest;
    const p = uuid.parse(req.params.id);
    const { storage_path } = z
      .object({ storage_path: z.string().max(300) })
      .parse(req.body);
    if (
      !storage_path.startsWith(`${r.user.id}/${p}/`) ||
      storage_path.includes("..")
    )
      throw new HttpError(403, "Invalid image path.");
    const { data } = r.db.storage
      .from("property-images")
      .getPublicUrl(storage_path);
    res
      .status(201)
      .json(
        result(
          await r.db
            .from("property_images")
            .insert({ property_id: p, image_url: data.publicUrl, storage_path })
            .select()
            .single(),
        ),
      );
  });
  app.delete("/api/images/:id", role("landlord"), async (req, res) => {
    const r = req as unknown as AuthRequest;
    const img = result(
      await r.db
        .from("property_images")
        .select("*,properties!inner(landlord_id)")
        .eq("id", uuid.parse(req.params.id))
        .single(),
    );
    if (img.properties.landlord_id !== r.user.id)
      throw new HttpError(403, "Not your image.");
    if (img.storage_path)
      result(
        await r.db.storage.from("property-images").remove([img.storage_path]),
      );
    result(await r.db.from("property_images").delete().eq("id", img.id));
    res.status(204).end();
  });
  app.get("/api/listings/:id/slots", role("landlord"), async (req, res) => {
    const r = req as unknown as AuthRequest;
    res.json(
      result(
        await r.db
          .from("viewing_slots")
          .select("*")
          .eq("property_id", uuid.parse(req.params.id))
          .eq("landlord_id", r.user.id)
          .eq("removed", false)
          .order("start_time"),
      ),
    );
  });
  const saveSlot = async (req: Request, res: Response) => {
    const r = req as unknown as AuthRequest;
    const s = slotSchema.parse(req.body);
    res.json({
      id: result(
        await r.db.rpc("manage_slot", {
          p_property: s.property_id,
          p_start: s.start_time,
          p_end: s.end_time,
          p_type: s.viewing_type,
          p_url: s.meeting_url || null,
          p_slot: req.params.id ? uuid.parse(req.params.id) : null,
        }),
      ),
    });
  };
  app.post("/api/slots", role("landlord"), saveSlot);
  app.patch("/api/slots/:id", role("landlord"), saveSlot);
  app.delete("/api/slots/:id", role("landlord"), async (req, res) => {
    result(
      await (req as unknown as AuthRequest).db.rpc("remove_slot", {
        p_slot: uuid.parse(req.params.id),
      }),
    );
    res.status(204).end();
  });
  app.get("/api/bookings", async (req, res) =>
    res.json(
      result(await (req as unknown as AuthRequest).db.rpc("my_appointments")),
    ),
  );
  app.post("/api/bookings", role("student"), async (req, res) =>
    res
      .status(201)
      .json({
        id: result(
          await (req as unknown as AuthRequest).db.rpc("book_viewing", {
            p_slot: uuid.parse(req.body.slot_id),
          }),
        ),
      }),
  );
  app.patch("/api/bookings/:id/cancel", async (req, res) => {
    result(
      await (req as unknown as AuthRequest).db.rpc("cancel_booking", {
        p_booking: uuid.parse(req.params.id),
      }),
    );
    res.status(204).end();
  });
  app.patch(
    "/api/bookings/:id/complete",
    role("landlord"),
    async (req, res) => {
      result(
        await (req as unknown as AuthRequest).db.rpc("complete_booking", {
          p_booking: uuid.parse(req.params.id),
        }),
      );
      res.status(204).end();
    },
  );
  app.get("/api/saved", role("student"), async (req, res) => {
    const r = req as unknown as AuthRequest;
    res.json(
      result(
        await r.db
          .from("saved_properties")
          .select("property_id,properties(*,property_images(*))")
          .eq("student_id", r.user.id),
      ),
    );
  });
  app.post("/api/saved/:id", role("student"), async (req, res) => {
    const r = req as unknown as AuthRequest;
    result(
      await r.db
        .from("saved_properties")
        .insert({
          student_id: r.user.id,
          property_id: uuid.parse(req.params.id),
        }),
    );
    res.status(201).end();
  });
  app.delete("/api/saved/:id", role("student"), async (req, res) => {
    const r = req as unknown as AuthRequest;
    result(
      await r.db
        .from("saved_properties")
        .delete()
        .eq("student_id", r.user.id)
        .eq("property_id", uuid.parse(req.params.id)),
    );
    res.status(204).end();
  });
  app.use((_req, res) =>
    res.status(404).json({ error: "Endpoint not found." }),
  );
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof z.ZodError) {
      res
        .status(400)
        .json({
          error: err.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        });
      return;
    }
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(
      "Request failed",
      err instanceof Error ? err.name : "unknown",
    );
    res.status(500).json({ error: "Something went wrong. Please try again." });
  });
  return app;
}
