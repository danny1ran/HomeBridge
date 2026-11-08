import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, CalendarDays, Pencil, Trash2, Upload } from "lucide-react";
import type { Property, Slot } from "../../shared/types";
import {
  api,
  dateTime,
  Loading,
  message,
  money,
  Notice,
  supabase,
  useAuth,
  useLoad,
} from "./lib";
import { DashboardNav, Empty } from "./components";
import { propertySchema } from "../../shared/validation";
export function Listings() {
  const { data, error, loading } = useLoad(
    () => api<Property[]>("/listings"),
    [],
  );
  return (
    <div className="page">
      <DashboardNav />
      <div className="section-heading">
        <div>
          <p className="eyebrow">SPACES FOR FRESH STARTS</p>
          <h1>Your properties.</h1>
        </div>
        <Link className="button" to="/listings/new">
          <Plus size={17} />
          Create a listing
        </Link>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <Notice error>{error}</Notice>
      ) : data?.length ? (
        <div className="listing-grid">
          {data.map((p) => (
            <article className="listing-card" key={p.id}>
              <img
                src={p.property_images[0]?.image_url || "/room.svg"}
                alt={p.title}
              />
              <div>
                <span className="tag">{p.status}</span>
                <h3>{p.title}</h3>
                <p>
                  {money(p.monthly_rent)} / month · {p.city}
                </p>
                <div className="listing-actions">
                  <Link className="text-link" to={`/listings/${p.id}/edit`}>
                    <Pencil size={15} />
                    Edit listing
                  </Link>
                  <Link
                    className="text-link"
                    to={`/listings/${p.id}/availability`}
                  >
                    <CalendarDays size={15} />
                    Viewing times
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="Your first listing starts here."
          link="/listings/new"
          label="Create a listing"
        >
          Give students a clear picture of the space you have to offer.
        </Empty>
      )}
    </div>
  );
}
export function PropertyForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profile } = useAuth();
  const { data, loading, error, reload } = useLoad(
    () =>
      id
        ? api<Property[]>("/listings").then(
            (p) => p.find((x) => x.id === id) || null,
          )
        : Promise.resolve(null),
    [id],
  );
  const [busy, setBusy] = useState(false),
    [formError, setFormError] = useState(""),
    [feedback, setFeedback] = useState(""),
    [files, setFiles] = useState<File[]>([]),
    [remove, setRemove] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setFormError("");
    setFeedback("");
    let savedId = id;
    try {
      const values = propertySchema.parse({
        ...Object.fromEntries(f),
        amenities: String(f.get("amenities"))
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      });
      const p = await api<Property>(id ? `/properties/${id}` : "/properties", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(values),
      });
      savedId = p.id;
      for (const file of files) {
        const ext =
          file.type === "image/png"
            ? "png"
            : file.type === "image/webp"
              ? "webp"
              : "jpg";
        const path = `${profile!.id}/${p.id}/${crypto.randomUUID()}.${ext}`;
        const upload = await supabase!.storage
          .from("property-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upload.error) throw upload.error;
        try {
          await api(`/properties/${p.id}/images`, {
            method: "POST",
            body: JSON.stringify({ storage_path: path }),
          });
        } catch (e) {
          await supabase!.storage.from("property-images").remove([path]);
          throw e;
        }
      }
      setFiles([]);
      if (!id) nav(`/listings/${p.id}/availability`);
      else {
        setFeedback("Listing saved.");
        reload();
      }
    } catch (e) {
      setFormError(message(e));
      if (!id && savedId) {
        nav(`/listings/${savedId}/edit`);
        setFormError(
          "Listing created, but an image upload failed. Please upload your images again.",
        );
      }
    } finally {
      setBusy(false);
    }
  }
  async function deleteImage(imageId: string) {
    setBusy(true);
    try {
      await api(`/images/${imageId}`, { method: "DELETE" });
      setRemove("");
      reload();
    } catch (e) {
      setFormError(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error) return <Notice error>{error}</Notice>;
  if (id && !data)
    return (
      <div className="page">
        <Empty
          title="Listing not found."
          link="/listings"
          label="Your listings"
        >
          You can only edit properties you own.
        </Empty>
      </div>
    );
  return (
    <div className="page">
      <DashboardNav />
      <div className="narrow left wide">
        <p className="eyebrow">MAKE A GOOD FIRST IMPRESSION</p>
        <h1>{id ? "Edit your listing." : "A home worth sharing."}</h1>
        <p className="subtitle">
          Add clear details, honest photos, and a little personality.
        </p>
        <form className="form-stack panel" onSubmit={submit}>
          <label>
            Listing title
            <input
              name="title"
              required
              minLength={5}
              maxLength={120}
              defaultValue={data?.title}
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              required
              minLength={20}
              maxLength={5000}
              rows={5}
              defaultValue={data?.description}
            />
          </label>
          <div className="form-grid">
            <label>
              City
              <input
                name="city"
                required
                defaultValue={data?.city || "Peterborough"}
              />
            </label>
            <label>
              Province
              <input
                name="province"
                required
                defaultValue={data?.province || "Ontario"}
              />
            </label>
            <label>
              Nearby university
              <select name="university" defaultValue={data?.university || ""}>
                <option value="">Not specified</option>
                <option>Trent University</option>
                <option>Fleming College</option>
              </select>
            </label>
            <label>
              Address
              <input
                name="address"
                required
                minLength={5}
                defaultValue={data?.address}
              />
              <small>Shown publicly in your listing.</small>
            </label>
            <label>
              Monthly rent (CAD)
              <input
                name="monthly_rent"
                type="number"
                min={1}
                max={50000}
                required
                defaultValue={data?.monthly_rent}
              />
            </label>
            <label>
              Room type
              <select
                name="room_type"
                defaultValue={data?.room_type || "Private room"}
              >
                {[
                  "Private room",
                  "Shared room",
                  "Studio",
                  "Entire apartment",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Bedrooms
              <input
                name="bedrooms"
                type="number"
                min={0}
                max={20}
                required
                defaultValue={data?.bedrooms ?? 1}
              />
            </label>
            <label>
              Bathrooms
              <input
                name="bathrooms"
                type="number"
                min={0.5}
                max={20}
                step={0.5}
                required
                defaultValue={data?.bathrooms ?? 1}
              />
            </label>
            <label>
              Available from
              <input
                name="available_from"
                type="date"
                required
                defaultValue={data?.available_from}
              />
            </label>
            <label>
              Listing status
              <select name="status" defaultValue={data?.status || "active"}>
                <option value="active">Active — visible in search</option>
                <option value="unavailable">
                  Unavailable — hidden from search
                </option>
              </select>
            </label>
          </div>
          <label>
            Amenities (comma separated)
            <input
              name="amenities"
              defaultValue={data?.amenities.join(", ") || "Wi-Fi, Laundry"}
              placeholder="Wi-Fi, Laundry, Furnished"
            />
          </label>
          <Notice>
            Making a listing unavailable prevents new bookings. Existing
            appointments remain on your calendar; cancel them individually if
            needed.
          </Notice>
          <label className="upload-label">
            <Upload size={22} />
            Property photos
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (
                  selected.some((f) => f.size > 5 * 1024 * 1024) ||
                  selected.length > 8
                ) {
                  setFormError("Choose at most 8 images, each under 5 MB.");
                  e.target.value = "";
                  setFiles([]);
                  return;
                }
                setFiles(selected);
                setFormError("");
              }}
            />
            <small>
              JPEG, PNG, or WebP · up to 5 MB each · {files.length} selected
            </small>
          </label>
          {data?.property_images.length ? (
            <div className="image-editor">
              {data.property_images.map((i) => (
                <div key={i.id}>
                  <img src={i.image_url} alt="Uploaded property photo" />
                  {remove === i.id ? (
                    <>
                      <span>Remove photo?</span>
                      <button
                        type="button"
                        className="text-button"
                        disabled={busy}
                        onClick={() => deleteImage(i.id)}
                      >
                        Confirm removal
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setRemove("")}
                      >
                        Keep
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setRemove(i.id)}
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          {formError && <Notice error>{formError}</Notice>}
          {feedback && <Notice>{feedback}</Notice>}
          <div className="form-actions">
            <button className="button" disabled={busy}>
              {busy
                ? "Saving your listing…"
                : id
                  ? "Save changes"
                  : "Create listing & add viewings"}
            </button>
            <Link className="text-link" to="/listings">
              Back to listings
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
const localInput = (value: string) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export function Availability() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { data, error, loading, reload } = useLoad(
    () => api<Slot[]>(`/listings/${id}/slots`),
    [id],
  );
  const [editing, setEditing] = useState<Slot | null>(null),
    [pending, setPending] = useState(""),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(""),
    [success, setSuccess] = useState("");
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    setBusy(true);
    setActionError("");
    setSuccess("");
    try {
      await api(editing ? `/slots/${editing.id}` : "/slots", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          property_id: id,
          start_time: new Date(String(f.get("start"))).toISOString(),
          end_time: new Date(String(f.get("end"))).toISOString(),
          viewing_type: f.get("type"),
          meeting_url: f.get("url"),
        }),
      });
      setEditing(null);
      form.reset();
      setSuccess("Viewing availability saved.");
      reload();
    } catch (e) {
      setActionError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setActionError("");
    try {
      await api(`/slots/${pending}`, { method: "DELETE" });
      setPending("");
      reload();
    } catch (e) {
      setActionError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <DashboardNav />
      <p className="eyebrow">OPEN YOUR CALENDAR</p>
      <h1>Make time for a viewing.</h1>
      <p className="subtitle">
        Publish times students can reserve for this property.
      </p>
      <div className="availability-grid">
        <form
          className="form-stack panel"
          key={editing?.id || "new"}
          onSubmit={submit}
        >
          <h2>{editing ? "Edit viewing time" : "Add a viewing time"}</h2>
          <Notice>
            Enter times in your device’s time zone:{" "}
            <strong>{browserZone}</strong>. They are saved as UTC instants and
            shown to students in their own time zones.
          </Notice>
          <label>
            Starts
            <input
              type="datetime-local"
              name="start"
              required
              defaultValue={editing ? localInput(editing.start_time) : ""}
            />
          </label>
          <label>
            Ends
            <input
              type="datetime-local"
              name="end"
              required
              defaultValue={editing ? localInput(editing.end_time) : ""}
            />
            <small>Maximum viewing length: 4 hours.</small>
          </label>
          <label>
            Viewing type
            <select
              name="type"
              defaultValue={editing?.viewing_type || "virtual"}
            >
              <option value="virtual">Virtual</option>
              <option value="in-person">In person</option>
            </select>
          </label>
          <label>
            Meeting URL (optional)
            <input
              name="url"
              type="url"
              pattern="https://.*"
              placeholder="https://…"
              defaultValue={editing?.meeting_url || ""}
            />
            <small>
              Only visible to you and the student after a reservation.
            </small>
          </label>
          {actionError && <Notice error>{actionError}</Notice>}
          {success && <Notice>{success}</Notice>}
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : editing ? "Update time" : "Add available time"}
          </button>
          {editing && (
            <button
              type="button"
              className="text-button"
              onClick={() => setEditing(null)}
            >
              Cancel edit
            </button>
          )}
        </form>
        <div>
          <h2>Your published times</h2>
          <p className="muted">
            Displayed in {profile?.preferred_timezone}. Reserved or past times
            cannot be edited.
          </p>
          {loading ? (
            <Loading />
          ) : error ? (
            <Notice error>{error}</Notice>
          ) : data?.length ? (
            <div className="slot-list">
              {data.map((s) => (
                <div className="panel slot-row" key={s.id}>
                  <strong>
                    {dateTime(s.start_time, profile!.preferred_timezone)}
                  </strong>
                  <p>
                    Until {dateTime(s.end_time, profile!.preferred_timezone)} ·{" "}
                    {s.viewing_type}
                  </p>
                  {Date.parse(s.start_time) > Date.now() && (
                    <div className="form-actions">
                      <button
                        className="text-button"
                        onClick={() => {
                          setEditing(s);
                          setActionError("");
                        }}
                      >
                        Edit
                      </button>
                      {pending === s.id ? (
                        <>
                          <span>Remove this time?</span>
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={remove}
                          >
                            Confirm
                          </button>
                          <button
                            className="text-button"
                            onClick={() => setPending("")}
                          >
                            Keep
                          </button>
                        </>
                      ) : (
                        <button
                          className="text-button"
                          onClick={() => setPending(s.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty title="Your calendar is ready.">
              Add your first available time using the form.
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
