import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Heart,
  House,
  Globe,
  Video,
  MapPin,
  Plus,
} from "lucide-react";
import {
  api,
  configured,
  dateTime,
  Loading,
  message,
  Notice,
  supabase,
  useAuth,
  useLoad,
} from "./lib";
import { DashboardNav, Empty, PropertyCard } from "./components";
import type { Appointment, Property, Profile } from "../../shared/types";
export function AuthPage({ register = false }: { register?: boolean }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  const next = params.get("next");
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) {
      setError(
        "Supabase setup is required before creating accounts. Follow README.md in the source project.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    const f = new FormData(e.currentTarget);
    try {
      if (register) {
        const { data, error } = await supabase.auth.signUp({
          email: String(f.get("email")),
          password: String(f.get("password")),
          options: {
            data: { full_name: f.get("full_name"), role: f.get("role") },
            emailRedirectTo: `${location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        if (data.session) navigate(safeNext);
        else
          setSuccess("Check your email to confirm your account, then log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: String(f.get("email")),
          password: String(f.get("password")),
        });
        if (error) throw error;
        navigate(safeNext);
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (session && profile)
    return (
      <div className="page narrow">
        <h1>You’re already at home here.</h1>
        <Link className="button" to={safeNext}>
          Continue to your account <ArrowRight size={17} />
        </Link>
      </div>
    );
  return (
    <div className="auth-page">
      <div className="auth-story">
        <p className="eyebrow">YOUR NEXT CHAPTER IS CALLING</p>
        <h1>
          A new city.
          <br />A fresh start.
          <br />
          <em>A place for you.</em>
        </h1>
        <p>Find your next home, before you arrive.</p>
        <div>
          <Globe size={18} /> Built for students crossing borders.
        </div>
      </div>
      <div className="auth-form-wrap">
        <p className="eyebrow">WELCOME {register ? "TO HOMEBRIDGE" : "BACK"}</p>
        <h2>
          {register ? "Let’s make yourself at home." : "Good to see you again."}
        </h2>
        <p className="muted">
          {register
            ? "Your housing search starts with a connection."
            : "Log in to your homes, viewings, and next steps."}
        </p>
        {!configured && (
          <Notice>
            Sample browsing is available. Account access will work once Supabase
            and the API are configured.
          </Notice>
        )}
        <form className="form-stack" onSubmit={submit}>
          {register && (
            <>
              <label>
                Full name
                <input
                  name="full_name"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </label>
              <label>
                I’m joining as
                <select
                  name="role"
                  defaultValue={
                    params.get("role") === "landlord" ? "landlord" : "student"
                  }
                >
                  <option value="student">A student looking for a home</option>
                  <option value="landlord">
                    A landlord listing a property
                  </option>
                </select>
              </label>
            </>
          )}
          <label>
            Email address
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={8}
              maxLength={128}
              required
            />
            {register && <small>Use at least 8 characters.</small>}
          </label>
          {error && <Notice error>{error}</Notice>}
          {success && <Notice>{success}</Notice>}
          <button className="button full" disabled={busy}>
            {busy ? "Please wait…" : register ? "Create account" : "Log in"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Already have an account?" : "New to HomeBridge?"}{" "}
          <Link
            to={`${register ? "/login" : "/register"}?next=${encodeURIComponent(safeNext)}`}
          >
            {register ? "Log in" : "Join us"}
          </Link>
        </p>
      </div>
    </div>
  );
}
export function Dashboard() {
  const { profile } = useAuth();
  const landlord = profile?.role === "landlord";
  const { data, error, loading } = useLoad(
    async () => ({
      appointments: await api<Appointment[]>("/bookings"),
      items: landlord
        ? await api<Property[]>("/listings")
        : await api<{ property_id: string }[]>("/saved"),
    }),
    [landlord],
  );
  const upcoming =
    data?.appointments.filter(
      (a) => a.status === "confirmed" && Date.parse(a.start_time) > Date.now(),
    ) || [];
  return (
    <div className="page">
      <DashboardNav />
      <p className="eyebrow">YOUR HOMEBRIDGE</p>
      <div className="section-heading">
        <div>
          <h1>Welcome home, {profile?.full_name.split(" ")[0]}.</h1>
          <p className="subtitle">
            {landlord
              ? "Good connections start with a little planning."
              : "Your next chapter is taking shape."}
          </p>
        </div>
        <Link className="button" to={landlord ? "/listings/new" : "/browse"}>
          {landlord ? <Plus size={17} /> : <House size={17} />}{" "}
          {landlord ? "Create a listing" : "Explore homes"}
        </Link>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <Notice error>{error}</Notice>
      ) : (
        <>
          <div className="stats-grid">
            <Link to="/bookings">
              <CalendarDays />
              <strong>{upcoming.length}</strong>
              <span>Upcoming viewings</span>
            </Link>
            <Link to={landlord ? "/listings" : "/saved"}>
              {landlord ? <House /> : <Heart />}
              <strong>{data?.items.length || 0}</strong>
              <span>{landlord ? "Your properties" : "Saved homes"}</span>
            </Link>
            <Link to="/profile">
              <Globe />
              <strong className="stat-zone">
                {profile?.preferred_timezone
                  .split("/")
                  .pop()
                  ?.replaceAll("_", " ")}
              </strong>
              <span>Your selected time zone</span>
            </Link>
          </div>
          <h2>What’s coming up</h2>
          {upcoming.length ? (
            <div className="appointment-list">
              {upcoming.slice(0, 3).map((a) => (
                <div className="appointment-card" key={a.id}>
                  <CalendarDays />
                  <div>
                    <h3>{a.title}</h3>
                    <p>{dateTime(a.start_time, profile!.preferred_timezone)}</p>
                    <span className="muted">{a.viewing_type} viewing</span>
                  </div>
                  <Link className="text-link" to="/bookings">
                    View details <ArrowRight size={17} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="A fresh calendar, full of possibilities."
              link={landlord ? "/listings" : "/browse"}
              label={
                landlord ? "Manage your listings" : "Find your first viewing"
              }
            >
              {landlord
                ? "Add viewing availability to your properties to let students reserve a time."
                : "Find a home you like and choose a time to take a look."}
            </Empty>
          )}
        </>
      )}
    </div>
  );
}
export function Bookings() {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const { data, error, loading, reload } = useLoad(
    () => api<Appointment[]>("/bookings"),
    [],
  );
  const [tab, setTab] = useState("upcoming"),
    [pending, setPending] = useState(""),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState("");
  async function action(id: string, type: string) {
    setBusy(true);
    setActionError("");
    try {
      await api(`/bookings/${id}/${type}`, { method: "PATCH" });
      setPending("");
      reload();
    } catch (e) {
      setActionError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const filtered = data?.filter((a) =>
    tab === "upcoming"
      ? a.status === "confirmed" && Date.parse(a.end_time) > Date.now()
      : a.status !== "confirmed" || Date.parse(a.end_time) <= Date.now(),
  );
  return (
    <div className="page">
      <DashboardNav />
      <p className="eyebrow">MAKE TIME FOR YOUR NEXT CHAPTER</p>
      <h1>
        {profile?.role === "landlord" ? "Your appointments." : "Your viewings."}
      </h1>
      <p className="subtitle">
        All times shown in {profile?.preferred_timezone}.
      </p>
      {params.has("booked") && (
        <Notice>
          Your viewing is confirmed and saved. The landlord can see this same
          reservation in their dashboard.
        </Notice>
      )}
      <div className="tabs">
        {["upcoming", "past"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t === "upcoming" ? "Upcoming" : "Past & cancelled"}
          </button>
        ))}
      </div>
      {actionError && <Notice error>{actionError}</Notice>}
      {loading ? (
        <Loading />
      ) : error ? (
        <Notice error>{error}</Notice>
      ) : filtered?.length ? (
        <div className="appointment-list">
          {filtered.map((a) => (
            <article className="appointment-card" key={a.id}>
              <div className="appointment-icon">
                {a.viewing_type === "virtual" ? <Video /> : <MapPin />}
              </div>
              <div className="appointment-info">
                <span className={`tag ${a.status}`}>{a.status}</span>
                <h3>
                  <Link to={`/properties/${a.property_id}`}>{a.title}</Link>
                </h3>
                <p>
                  {dateTime(a.start_time, profile!.preferred_timezone)} →{" "}
                  {dateTime(a.end_time, profile!.preferred_timezone)}
                </p>
                <p>
                  {a.viewing_type === "virtual" ? "Virtual viewing" : a.address}
                </p>
                {profile?.role === "landlord" && (
                  <p>
                    Student: {a.student_name} · {a.student_email}
                  </p>
                )}
                {a.meeting_url && a.status !== "cancelled" && (
                  <a
                    className="text-link"
                    href={a.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open meeting link <ArrowRight size={16} />
                  </a>
                )}
                {a.viewing_type === "virtual" &&
                  !a.meeting_url &&
                  a.status === "confirmed" && (
                    <p className="muted">
                      No meeting link was attached to this viewing.
                    </p>
                  )}
              </div>
              <div className="appointment-actions">
                {a.status === "confirmed" &&
                  Date.parse(a.start_time) > Date.now() &&
                  (pending === a.id ? (
                    <>
                      <p>Cancel this viewing?</p>
                      <button
                        className="button danger"
                        disabled={busy}
                        onClick={() => action(a.id, "cancel")}
                      >
                        Yes, cancel
                      </button>
                      <button
                        className="text-button"
                        onClick={() => setPending("")}
                        disabled={busy}
                      >
                        Keep viewing
                      </button>
                    </>
                  ) : (
                    <button
                      className="text-button"
                      onClick={() => setPending(a.id)}
                    >
                      Cancel viewing
                    </button>
                  ))}
                {profile?.role === "landlord" &&
                  a.status === "confirmed" &&
                  Date.parse(a.end_time) <= Date.now() && (
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => action(a.id, "complete")}
                    >
                      Mark completed
                    </button>
                  )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title={
            tab === "upcoming"
              ? "No upcoming viewings yet."
              : "No viewing history yet."
          }
          link={profile?.role === "student" ? "/browse" : "/listings"}
          label={
            profile?.role === "student" ? "Explore homes" : "Manage listings"
          }
        >
          Your appointments will appear here once a viewing is reserved.
        </Empty>
      )}
    </div>
  );
}
export function Saved() {
  const { data, error, loading, reload } = useLoad(
    () => api<{ property_id: string; properties: Property | null }[]>("/saved"),
    [],
  );
  return (
    <div className="page">
      <DashboardNav />
      <p className="eyebrow">KEEP YOUR POSSIBILITIES CLOSE</p>
      <h1>Your saved homes.</h1>
      <p className="subtitle">A shortlist for your next beginning.</p>
      {loading ? (
        <Loading />
      ) : error ? (
        <Notice error>{error}</Notice>
      ) : data?.some((s) => s.properties) ? (
        <div className="property-grid">
          {data
            .filter((s) => s.properties)
            .map((s) => (
              <PropertyCard
                key={s.property_id}
                property={s.properties!}
                saved
                onSave={reload}
              />
            ))}
        </div>
      ) : (
        <Empty
          title="A little room for favourites."
          link="/browse"
          label="Explore homes"
        >
          Tap the heart on a property to keep it here. Unavailable listings may
          no longer appear.
        </Empty>
      )}
    </div>
  );
}
export function ProfileSettings() {
  const { profile, refresh } = useAuth();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const zones = Intl.supportedValuesOf("timeZone");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const f = new FormData(e.currentTarget);
    try {
      await api<Profile>("/profile", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(f)),
      });
      await refresh();
      setSuccess(
        "Your profile is updated. All viewing times use your selected time zone.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <DashboardNav />
      <div className="narrow left">
        <p className="eyebrow">MAKE YOURSELF AT HOME</p>
        <h1>Your profile.</h1>
        <form className="form-stack panel" onSubmit={submit}>
          <label>
            Full name
            <input
              name="full_name"
              defaultValue={profile?.full_name}
              required
              maxLength={100}
            />
          </label>
          <label>
            Email address
            <input value={profile?.email || ""} disabled />
            <small>Your account email is managed by Supabase Auth.</small>
          </label>
          <label>
            Account type
            <input value={profile?.role || ""} disabled />
          </label>
          <label>
            Preferred time zone
            <select
              name="preferred_timezone"
              defaultValue={profile?.preferred_timezone}
            >
              {Array.from(
                new Set(["UTC", profile!.preferred_timezone, ...zones]),
              ).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <small>
              Bookings are stored in UTC and displayed in this time zone.
            </small>
          </label>
          {error && <Notice error>{error}</Notice>}
          {success && <Notice>{success}</Notice>}
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
