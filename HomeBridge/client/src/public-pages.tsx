import { useState, type FormEvent } from "react";
import {
  Link,
  useSearchParams,
  useParams,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Search,
  Globe,
  CalendarDays,
  Check,
  Video,
  House,
  SlidersHorizontal,
  BedDouble,
  Bath,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { demoProperties } from "../../shared/demo";
import type { Property, Slot } from "../../shared/types";
import {
  api,
  configured,
  dateTime,
  Loading,
  message,
  money,
  Notice,
  useAuth,
  useLoad,
} from "./lib";
import {
  DemoBanner,
  Empty,
  features,
  PropertyCard,
  PropertyImage,
} from "./components";
import { FaqItem } from "./motion";
import { ViewingWalkthrough } from "./viewing-walkthrough";
import { DiscoveryPreview } from "./discovery-preview";

const types = ["Private room", "Shared room", "Studio", "Entire apartment"];
export function SearchBar() {
  const navigate = useNavigate();
  return (
    <form
      className="hero-search"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const p = new URLSearchParams();
        for (const [k, v] of f) if (v) p.set(k, String(v));
        navigate(`/browse?${p}`);
      }}
    >
      <label>
        <span>
          <MapPin size={14} />
          WHERE TO?
        </span>
        <select name="city" defaultValue="Peterborough">
          <option>Peterborough</option>
          <option value="">All cities</option>
        </select>
      </label>
      <label>
        <span>MONTHLY BUDGET</span>
        <select name="max">
          <option value="">Any budget</option>
          <option value="800">Up to $800</option>
          <option value="1200">Up to $1,200</option>
          <option value="1800">Up to $1,800</option>
        </select>
      </label>
      <label>
        <span>YOUR SPACE</span>
        <select name="room_type">
          <option value="">Any room type</option>
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <button className="button search-submit">
        <Search size={18} />
        Find a home
      </button>
    </form>
  );
}
export function Home() {
  const { data, error, loading } = useLoad(
    () =>
      configured
        ? api<Property[]>("/properties?sort=newest")
        : Promise.resolve(demoProperties),
    [],
  );
  return (
    <>
      <section className="saas-hero discovery-hero">
        <div className="saas-intro">
          <div className="launch-pill">
            <span className="status-dot" />A better way to find student housing{" "}
            <ArrowUpRight size={12} />
          </div>
          <h1>
            A new chapter. A place to belong.
            <br />
            <span>Find it before you arrive.</span>
          </h1>
          <p>
            Discover student-friendly rentals in Canada, meet landlords, and
            book a viewing. One place to plan your next chapter.
          </p>
          <div className="hero-ctas">
            <Link className="button" to="/browse">
              Find a home <ArrowRight size={16} />
            </Link>
            <Link className="button secondary" to="/register?role=landlord">
              List your property <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="saas-reassurance">
            <span>
              <Check size={13} />
              Virtual & in-person viewings
            </span>
            <span>
              <Check size={13} />
              Your time zone, your schedule
            </span>
          </div>
        </div>
        <div className="discovery-stage">
          {loading ? (
            <Loading />
          ) : error ? (
            <Notice error>{error}</Notice>
          ) : data?.length ? (
            <DiscoveryPreview properties={data} />
          ) : (
            <Empty title="New homes are on the horizon.">
              Check back soon for student-friendly rentals.
            </Empty>
          )}
        </div>
        <div className="landing-search">
          <div>
            <span className="eyebrow">MAKE YOURSELF AT HOME</span>
            <h2>Your space. Your budget. Your next chapter.</h2>
          </div>
          <SearchBar />
        </div>
        <div className="campus-strip">
          <span>Starting in Peterborough. Built for students near</span>
          <strong>Trent University</strong>
          <i />
          <strong>Fleming College</strong>
        </div>
      </section>
      <DemoBanner />
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A SPACE THAT FEELS LIKE YOU</p>
            <h2>Find your kind of home.</h2>
            <p>
              Comfortable spaces. Fresh starts. Explore student rentals in
              Peterborough.
            </p>
          </div>
          <Link className="text-link" to="/browse">
            Explore all rentals <ArrowUpRight size={18} />
          </Link>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <Notice error>{error}</Notice>
        ) : (
          <div className="property-grid">
            {data?.slice(0, 3).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
      <section className="steps-section">
        <div className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                LESS BACK-AND-FORTH. MORE LOOKING FORWARD.
              </p>
              <h2>From browsing to “this is the one.”</h2>
            </div>
            <span className="steps-caption">
              Your home search, made a little simpler.
            </span>
          </div>
          <div className="steps-grid">
            {[
              {
                icon: Search,
                title: "Find your fit",
                text: "Explore places that match your budget, your campus, and your way of living.",
              },
              {
                icon: CalendarDays,
                title: "Pick a time",
                text: "Book an available virtual or in-person viewing in your own time zone.",
              },
              {
                icon: House,
                title: "Picture your new beginning",
                text: "Meet the landlord, ask your questions, and find a space that feels right.",
              },
            ].map((v, i) => (
              <div className="step" key={v.title}>
                <div className="step-top">
                  <v.icon size={25} />
                  <span>0{i + 1}</span>
                </div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section benefits">
        <div>
          <p className="eyebrow">A LITTLE CLOSER TO HOME</p>
          <h2>
            Moving countries is big.
            <br />
            Finding a home can be simpler.
          </h2>
          <p className="muted">
            Made for the questions, time zones, and fresh starts that come with
            studying abroad.
          </p>
          <Link className="text-link" to="/about">
            Get to know HomeBridge <ArrowRight size={17} />
          </Link>
        </div>
        <div>
          {features.map((f) => (
            <div className="benefit" key={f.title}>
              <span>
                <f.icon size={23} />
              </span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="landlord-banner">
        <div>
          <p className="eyebrow">GOOD HOMES. GREAT CONNECTIONS.</p>
          <h2>Have a space for a new beginning?</h2>
          <p>
            Share your property, set your availability, and meet your next
            student tenant.
          </p>
        </div>
        <Link className="button light" to="/register?role=landlord">
          List your property <ArrowUpRight size={18} />
        </Link>
      </section>
      <section className="section faq-section">
        <div>
          <p className="eyebrow">BEFORE YOU MAKE YOUR MOVE</p>
          <h2>Frequently asked questions</h2>
          <Link className="safety-link" to="/safety">
            <span>Rent smart. Stay informed.</span>
            <p>Learn the warning signs and questions to ask.</p>
            <span className="text-link">
              Read our rental safety guide <ArrowUpRight size={17} />
            </span>
          </Link>
        </div>
        <div className="faq">
          {[
            [
              "Can I view a home before arriving in Canada?",
              "Yes. Choose a virtual viewing from the times a landlord has made available. Your appointment displays in your preferred time zone.",
            ],
            [
              "Are properties and landlords verified?",
              "No. HomeBridge does not verify landlords or guarantee listings. Always check the property, the person offering it, and the terms before making a commitment.",
            ],
            [
              "Do I pay rent through HomeBridge?",
              "No. HomeBridge is for discovering properties and booking viewings. We do not collect rent, deposits, or other rental payments.",
            ],
            [
              "Can I cancel a viewing?",
              "Yes. You can cancel an upcoming confirmed appointment from My viewings. The slot becomes available for other students.",
            ],
          ].map(([q, a]) => (
            <FaqItem key={q} question={q} answer={a} />
          ))}
        </div>
      </section>
    </>
  );
}
export function Browse() {
  const [params, setParams] = useSearchParams();
  const [filterError, setFilterError] = useState("");
  const key = params.toString();
  const filterNames: Record<string, string> = {
    city: "City",
    university: "University",
    min: "Min rent",
    max: "Max rent",
    room_type: "Room type",
    bedrooms: "Bedrooms",
    available: "Available by",
  };
  const activeFilters = Array.from(params.entries()).filter(
    ([name, value]) => filterNames[name] && value,
  );
  function removeFilter(name?: string) {
    const next = new URLSearchParams(params);
    if (name) next.delete(name);
    else for (const key of Object.keys(filterNames)) next.delete(key);
    setFilterError("");
    setParams(next);
  }
  function filterValue(name: string, value: string) {
    if (name === "min" || name === "max") return money(Number(value));
    if (name === "bedrooms" && value === "0") return "Studio";
    return value;
  }
  const { data, error, loading } = useLoad(() => {
    if (configured) return api<Property[]>(`/properties?${key}`);
    let list = demoProperties.filter(
      (p) =>
        (!params.get("city") ||
          p.city.toLowerCase() === params.get("city")!.toLowerCase()) &&
        (!params.get("university") ||
          p.university === params.get("university")) &&
        (!params.get("min") || p.monthly_rent >= Number(params.get("min"))) &&
        (!params.get("max") || p.monthly_rent <= Number(params.get("max"))) &&
        (!params.get("room_type") || p.room_type === params.get("room_type")) &&
        (!params.get("bedrooms") ||
          p.bedrooms === Number(params.get("bedrooms"))) &&
        (!params.get("available") ||
          p.available_from <= params.get("available")!),
    );
    list = [...list].sort((a, b) =>
      params.get("sort") === "price-low"
        ? a.monthly_rent - b.monthly_rent
        : params.get("sort") === "price-high"
          ? b.monthly_rent - a.monthly_rent
          : b.created_at.localeCompare(a.created_at),
    );
    return Promise.resolve(list);
  }, [key]);
  function filter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      p = new URLSearchParams();
    for (const [k, v] of f) if (v) p.set(k, String(v));
    if (Number(p.get("min") || 0) > Number(p.get("max") || Infinity)) {
      setFilterError("Minimum rent cannot exceed maximum rent.");
      return;
    }
    setFilterError("");
    setParams(p);
  }
  return (
    <>
      <DemoBanner />
      <div className="page">
        <p className="eyebrow">YOUR NEW CHAPTER STARTS WITH A SEARCH</p>
        <h1>Find a place to belong.</h1>
        <p className="subtitle">
          Explore student-friendly spaces, on your terms.
        </p>
        <form key={key} className="filter-panel" onSubmit={filter}>
          <label>
            City
            <input
              name="city"
              placeholder="Any city"
              defaultValue={params.get("city") || ""}
            />
          </label>
          <label>
            University
            <select
              name="university"
              defaultValue={params.get("university") || ""}
            >
              <option value="">All universities</option>
              <option>Trent University</option>
              <option>Fleming College</option>
            </select>
          </label>
          <label>
            Min rent (CAD)
            <input
              name="min"
              type="number"
              min="0"
              defaultValue={params.get("min") || ""}
              placeholder="No minimum"
            />
          </label>
          <label>
            Max rent (CAD)
            <input
              name="max"
              type="number"
              min={params.get("min") || 0}
              defaultValue={params.get("max") || ""}
              placeholder="No maximum"
            />
          </label>
          <label>
            Room type
            <select
              name="room_type"
              defaultValue={params.get("room_type") || ""}
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Bedrooms
            <select name="bedrooms" defaultValue={params.get("bedrooms") || ""}>
              <option value="">Any</option>
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Studio" : n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Available by
            <input
              name="available"
              type="date"
              defaultValue={params.get("available") || ""}
            />
          </label>
          <label>
            Sort by
            <select name="sort" defaultValue={params.get("sort") || "newest"}>
              <option value="newest">Newest first</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
          <div className="filter-actions">
            <button className="button">
              <SlidersHorizontal size={16} />
              Apply filters
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setFilterError("");
                setParams({});
              }}
            >
              Reset
            </button>
          </div>
        </form>
        {filterError && <Notice error>{filterError}</Notice>}
        {activeFilters.length > 0 && (
          <div className="active-filters" aria-label="Active search filters">
            {activeFilters.map(([name, value]) => (
              <button
                key={name}
                className="filter-chip"
                aria-label={`Remove ${filterNames[name]} filter: ${filterValue(name, value)}`}
                onClick={() => removeFilter(name)}
              >
                <span>
                  {filterNames[name]}:{" "}
                  <strong>{filterValue(name, value)}</strong>
                </span>
                <X size={13} aria-hidden="true" />
              </button>
            ))}
            <button className="text-button" onClick={() => removeFilter()}>
              Clear filters
            </button>
          </div>
        )}
        <div
          className="results-heading"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <strong>
            {loading
              ? "Finding your next home…"
              : error
                ? "Search unavailable"
                : `${data?.length || 0} ${data?.length === 1 ? "home" : "homes"} to explore`}
          </strong>
          <span>Prices in Canadian dollars / month</span>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <Notice error>{error}</Notice>
        ) : data?.length ? (
          <div className="property-grid">
            {data.map((p) => (
              <PropertyCard property={p} key={p.id} />
            ))}
          </div>
        ) : (
          <div className="search-empty">
            <Empty title="No homes match just yet.">
              Try a wider budget, a different room type, or fewer filters.
            </Empty>
            {activeFilters.length > 0 && (
              <button className="button" onClick={() => removeFilter()}>
                Clear filters & explore homes <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
export function PropertyDetails() {
  const { id } = useParams();
  const { profile } = useAuth();
  const nav = useNavigate();
  const [viewing, setViewing] = useState("virtual"),
    [selected, setSelected] = useState(""),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const {
    data: p,
    error: loadError,
    loading,
  } = useLoad(
    () =>
      configured
        ? api<Property>(`/properties/${id}`)
        : Promise.resolve(demoProperties.find((p) => p.id === id) || null),
    [id],
  );
  const {
    data: slots,
    reload,
    error: slotsError,
    loading: slotsLoading,
  } = useLoad(
    () =>
      configured ? api<Slot[]>(`/properties/${id}/slots`) : Promise.resolve([]),
    [id],
  );
  const tz =
    profile?.preferred_timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  async function book() {
    setBusy(true);
    setError("");
    try {
      await api("/bookings", {
        method: "POST",
        body: JSON.stringify({ slot_id: selected }),
      });
      nav("/bookings?booked=1");
    } catch (e) {
      setError(message(e));
      setConfirm(false);
      setSelected("");
      reload();
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (loadError)
    return (
      <div className="page">
        <Notice error>{loadError}</Notice>
      </div>
    );
  if (!p) return <NotFound />;
  return (
    <>
      <DemoBanner />
      <div className="property-discover-page">
        <DiscoveryPreview
          key={p.id}
          detail
          properties={[
            p,
            ...(p.is_demo
              ? demoProperties.filter((home) => home.id !== p.id)
              : []),
          ]}
        />
        <div className="detail-columns" id="property-information">
          <article>
            <p className="eyebrow">PROPERTY INFORMATION</p>
            <h2>{p.title}</h2>
            <p className="muted">{p.address}</p>
            {p.property_images.length > 1 && (
              <div className="detail-thumbnails">
                {p.property_images.map((image) => (
                  <PropertyImage
                    key={image.id}
                    src={image.image_url}
                    alt={`${p.title} — property photo`}
                  />
                ))}
              </div>
            )}
            <div className="detail-features">
              <span>
                <BedDouble /> {p.bedrooms || "Studio"}{" "}
                {p.bedrooms === 1 ? "bedroom" : p.bedrooms ? "bedrooms" : ""}
              </span>
              <span>
                <Bath /> {p.bathrooms} bathrooms
              </span>
              <span>
                <House /> {p.room_type}
              </span>
            </div>
            <h2>A place for your next chapter.</h2>
            <p className="description">{p.description}</p>
            <h3>What this home offers</h3>
            <div className="amenities">
              {p.amenities.map((a) => (
                <span key={a}>
                  <Check size={16} />
                  {a}
                </span>
              ))}
            </div>
            <h3>The details</h3>
            <p>
              Available from {p.available_from} · Near{" "}
              {p.university || "local campuses"}
            </p>
            <Notice>
              HomeBridge does not verify listings or landlords.{" "}
              <Link to="/safety">Read the rental safety guide</Link> before
              making any commitment.
            </Notice>
            <section
              className="owner-ratings"
              aria-labelledby="owner-ratings-title"
            >
              <div className="owner-rating-heading">
                <span className="owner-avatar">
                  <UserRound size={20} />
                </span>
                <div>
                  <p className="eyebrow">KNOW WHO YOU RENT FROM</p>
                  <h3 id="owner-ratings-title">Owner ratings</h3>
                </div>
                <span className="tag">No reviews yet</span>
              </div>
              <div className="owner-rating-summary">
                <div className="owner-stars" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={18} />
                  ))}
                </div>
                <strong>Not rated yet</strong>
                <span>No customer reviews are available for this owner.</span>
              </div>
              <dl className="owner-rating-categories">
                {[
                  "Communication",
                  "Listing accuracy",
                  "Viewing experience",
                ].map((category) => (
                  <div key={category}>
                    <dt>{category}</dt>
                    <dd>Not rated</dd>
                  </div>
                ))}
              </dl>
              <p className="owner-review-note">
                Review collection isn’t available yet. When reviews are
                supported, this section will help students compare owner
                experiences. Ratings will not replace checking a listing
                yourself.
              </p>
              <Link className="text-link" to="/safety">
                What to check before renting <ArrowUpRight size={14} />
              </Link>
            </section>
          </article>
          <aside className="booking-panel" id="viewing-times" tabIndex={-1}>
            <div className="price">
              <strong>{money(p.monthly_rent)}</strong>
              <span> CAD / month</span>
            </div>
            <h3>Come take a look.</h3>
            <p>Choose how you’d like to visit.</p>
            <div className="segmented">
              {["virtual", "in-person"].map((t) => (
                <button
                  key={t}
                  aria-pressed={viewing === t}
                  className={viewing === t ? "active" : ""}
                  onClick={() => {
                    setViewing(t);
                    setSelected("");
                    setConfirm(false);
                  }}
                >
                  {t === "virtual" ? <Video size={16} /> : <MapPin size={16} />}{" "}
                  {t === "virtual" ? "Virtual" : "In person"}
                </button>
              ))}
            </div>
            <p className="timezone">
              <Globe size={14} /> Times in {tz}
            </p>
            {slotsError && <Notice error>{slotsError}</Notice>}
            {slotsLoading && configured && <Loading />}
            {!configured ? (
              <ViewingWalkthrough
                key={`${p.id}-${viewing}`}
                title={p.title}
                viewing={viewing}
                timezone={tz}
              />
            ) : slots?.filter((s) => s.viewing_type === viewing).length ? (
              <div className="slots">
                {slots
                  .filter((s) => s.viewing_type === viewing)
                  .map((s) => (
                    <button
                      key={s.id}
                      aria-pressed={selected === s.id}
                      className={selected === s.id ? "selected" : ""}
                      onClick={() => {
                        setSelected(s.id);
                        setConfirm(false);
                      }}
                    >
                      {dateTime(s.start_time, tz)}
                    </button>
                  ))}
              </div>
            ) : (
              <p className="empty-small">
                No {viewing} viewings available right now. Please check back.
              </p>
            )}
            {error && <Notice error>{error}</Notice>}
            {configured &&
              (confirm ? (
                <div className="confirmation">
                  <h4>Confirm your viewing?</h4>
                  <p>
                    {dateTime(
                      slots!.find((s) => s.id === selected)!.start_time,
                      tz,
                    )}{" "}
                    · {viewing}
                  </p>
                  <button
                    className="button full"
                    disabled={busy}
                    onClick={book}
                  >
                    {busy ? "Reserving…" : "Confirm reservation"}
                  </button>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => setConfirm(false)}
                  >
                    Go back
                  </button>
                </div>
              ) : (
                <button
                  className="button full"
                  disabled={
                    !configured || !selected || profile?.role === "landlord"
                  }
                  onClick={() =>
                    profile
                      ? setConfirm(true)
                      : nav(
                          `/login?next=${encodeURIComponent(`/properties/${id}`)}`,
                        )
                  }
                >
                  Book a viewing <ArrowRight size={17} />
                </button>
              ))}
            <p className="booking-footnote">
              No payment required. Just a new possibility.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}
export function About() {
  return (
    <div className="page narrow prose">
      <p className="eyebrow">WELCOME TO HOMEBRIDGE</p>
      <h1>
        A bridge to your
        <br />
        next beginning.
      </h1>
      <p className="lead">
        Finding a place to live should be one less unknown when you move to a
        new country.
      </p>
      <p>
        HomeBridge connects international students with rental housing in
        Canada, starting with Peterborough and students attending Trent
        University and Fleming College. We are an independent platform, not
        affiliated with either institution.
      </p>
      <h2>See the space. Meet the person.</h2>
      <p>
        Browse homes, compare the details, and reserve a time to meet the
        landlord virtually or in person. Every appointment is displayed in your
        selected time zone, wherever you are starting from.
      </p>
      {features.map((f) => (
        <section key={f.title}>
          <f.icon />
          <h3>{f.title}</h3>
          <p>{f.text}</p>
        </section>
      ))}
      <h2>A clearer calendar for landlords.</h2>
      <p>
        Create a listing, upload photos, and publish viewing times. Students
        reserve those times directly, and the same reservation appears on both
        dashboards.
      </p>
      <Notice>
        HomeBridge does not verify listings or landlords, collect rental
        payments, or guarantee tenancy.
      </Notice>
      <Link className="button" to="/browse">
        Find your next home <ArrowRight size={17} />
      </Link>
    </div>
  );
}
export function Safety() {
  return (
    <div className="page narrow prose">
      <p className="eyebrow">A CONFIDENT START</p>
      <h1>
        Rent smart.
        <br />
        Stay informed.
      </h1>
      <p className="lead">
        A practical starting point for your Ontario housing search.
      </p>
      <Notice>
        HomeBridge does not guarantee that listings or landlords are verified.
        This guide is general education, not legal advice. We do not collect
        rent or deposits.
      </Notice>
      <h2>Slow down when something feels off.</h2>
      <ul>
        <li>
          A price far below similar rentals, pressure to send money immediately,
          or a landlord who refuses a viewing can be warning signs.
        </li>
        <li>
          Compare the same listing across sites. Inconsistent names, copied
          photos, and conflicting addresses deserve a closer look.
        </li>
        <li>
          Do not share identity documents or banking details until you
          understand who is requesting them and why.
        </li>
      </ul>
      <h2>See the property before paying.</h2>
      <p>
        Arrange a live viewing, ideally in person or with someone you trust.
        During a virtual tour, ask to see the rooms and exterior in real time. A
        viewing alone does not prove the person has authority to rent the
        property: check that separately, and review the written lease before
        sending money.
      </p>
      <h2>Bring a few good questions.</h2>
      <ul>
        <li>
          Who owns or manages the property, and how can I confirm your authority
          to rent it?
        </li>
        <li>
          What is included in rent? Ask about utilities, internet, laundry,
          furniture, and parking.
        </li>
        <li>
          What are the lease dates, guest rules, maintenance arrangements, and
          shared spaces?
        </li>
        <li>Can I review the lease and all requested deposits in writing?</li>
      </ul>
      <h2>Know where your rights start.</h2>
      <p>
        Ontario’s Residential Tenancies Act covers most private residential
        rental units, but some arrangements have exceptions. For example,
        sharing a kitchen or bathroom with the owner may affect whether the Act
        applies. Check the rules for your specific situation with an official
        source or a community legal clinic.
      </p>
      <p>
        Most covered private tenancies use Ontario’s standard lease. Rules
        govern deposits, repairs, rent increases, and ending a tenancy; read the
        current guidance before signing.
      </p>
      <h2>Go to the source.</h2>
      <div className="source-links">
        <a
          href="https://www.ontario.ca/page/renting-ontario-your-rights"
          target="_blank"
          rel="noreferrer"
        >
          Ontario: Renting and your rights <ArrowUpRight size={17} />
        </a>
        <a
          href="https://tribunalsontario.ca/ltb/"
          target="_blank"
          rel="noreferrer"
        >
          Landlord and Tenant Board <ArrowUpRight size={17} />
        </a>
        <a
          href="https://www.communitysafety.utoronto.ca/fraud-prevention/types-of-frauds-and-scams/rental-and-landlord-scams/"
          target="_blank"
          rel="noreferrer"
        >
          University of Toronto: Rental scam guidance <ArrowUpRight size={17} />
        </a>
      </div>
      <p className="muted">
        Guide reviewed November 2026. Check official sources for changes.
      </p>
    </div>
  );
}
export function NotFound() {
  return (
    <div className="page">
      <Empty
        title="This door doesn’t lead anywhere."
        link="/browse"
        label="Explore homes"
      >
        We couldn’t find that page. Let’s get you back to your home search.
      </Empty>
    </div>
  );
}
