import {
  useEffect,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Menu,
  X,
  Sun,
  Moon,
  Heart,
  MapPin,
  BedDouble,
  Bath,
  ArrowRight,
  House,
  ShieldCheck,
  Globe,
  CalendarDays,
  GraduationCap,
} from "lucide-react";
import type { Property } from "../../shared/types";
import {
  api,
  configured,
  message,
  money,
  Notice,
  supabase,
  useAuth,
} from "./lib";
import { BackToTop, PageMotion } from "./motion";
import { ChatAssistant } from "./chat-assistant";

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="HomeBridge home">
      <span className="logo-mark">
        <House size={21} />
      </span>
      home<span>bridge</span>
      <i />
    </Link>
  );
}
export function Layout({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      document.documentElement.dataset.motionReady = "true";
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const [menu, setMenu] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    setMenu(false);
  }, [pathname]);
  useEffect(() => {
    if (!menu) return;
    const dismiss = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenu(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [menu]);
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === "dark",
  );
  function toggle() {
    const d = !dark;
    setDark(d);
    document.documentElement.dataset.theme = d ? "dark" : "light";
    document.documentElement.style.colorScheme = d ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", d ? "#14213D" : "#F4EDE0");
    try {
      localStorage.setItem("homebridge-theme", d ? "dark" : "light");
    } catch {
      /* Theme switching still works when browser storage is disabled. */
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header" ref={headerRef}>
        <div className="nav-wrap">
          <Logo />
          <nav
            id="primary-navigation"
            className={menu ? "nav open" : "nav"}
            aria-label="Main navigation"
            onClick={() => setMenu(false)}
          >
            <NavLink to="/browse">Find a home</NavLink>
            <NavLink to="/about">How it works</NavLink>
            <NavLink to="/safety">
              Rental safety <ArrowUpRight size={13} />
            </NavLink>
            <Link
              className="mobile-nav-action"
              to={
                profile?.role === "landlord"
                  ? "/listings/new"
                  : "/register?role=landlord"
              }
            >
              List your property <ArrowUpRight size={15} />
            </Link>
            {session && (
              <button
                className="mobile-nav-action text-button"
                onClick={() => supabase?.auth.signOut()}
              >
                Log out
              </button>
            )}
          </nav>
          <div className="nav-actions">
            <button
              className="icon-button theme-toggle"
              onClick={toggle}
              aria-label={dark ? "Use light mode" : "Use dark mode"}
              title={dark ? "Switch to light theme" : "Switch to dark theme"}
              aria-pressed={dark}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {session ? (
              <>
                <Link className="login-link" to="/dashboard">
                  {profile?.full_name.split(" ")[0] || "Dashboard"}
                </Link>
                <button
                  className="text-button logout"
                  onClick={() => supabase?.auth.signOut()}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link className="login-link" to="/login">
                Log in
              </Link>
            )}
            <Link
              className="button small nav-cta"
              to={
                profile?.role === "landlord"
                  ? "/listings/new"
                  : "/register?role=landlord"
              }
            >
              List your property <ArrowUpRight size={16} />
            </Link>
            <button
              ref={menuButtonRef}
              aria-controls="primary-navigation"
              className="icon-button mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="Toggle navigation"
              aria-expanded={menu}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <BackToTop />
      <ChatAssistant />
      <main id="main" tabIndex={-1}>
        <PageMotion>{children}</PageMotion>
      </main>
      <footer>
        <div className="footer-grid">
          <div>
            <Logo />
            <p>
              Find your next home,
              <br />
              before you arrive.
            </p>
            <span className="footer-location">
              <MapPin size={14} /> Starting in Peterborough, Ontario
            </span>
          </div>
          <div>
            <h3>Make yourself at home</h3>
            <Link to="/browse">Explore rentals</Link>
            <Link to="/about">About HomeBridge</Link>
            <Link to="/safety">Rental safety guide</Link>
          </div>
          <div>
            <h3>For our community</h3>
            <Link to="/register?role=student">Join as a student</Link>
            <Link to="/register?role=landlord">Become a landlord</Link>
            <Link to="/bookings">My viewings</Link>
          </div>
          <div className="footer-note">
            <Globe size={25} />
            <p>
              A new chapter. A new city.
              <br />A place to call yours.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} HomeBridge</span>
          <span>
            Listings and landlords are not verified. No payments are collected.
          </span>
        </div>
      </footer>
    </>
  );
}
// Keep image failures from leaving broken image icons or collapsing the layout.
export function PropertyImage({
  src,
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  return (
    <img
      {...props}
      src={failed || !src ? "/room.svg" : src}
      alt={failed || !src ? "Property photo unavailable" : alt}
      loading={
        props.loading ?? (props.fetchPriority === "high" ? "eager" : "lazy")
      }
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
export function PropertyCard({
  property: p,
  saved = false,
  onSave,
}: {
  property: Property;
  saved?: boolean;
  onSave?: () => void;
}) {
  const { profile, savedIds, refreshSaved } = useAuth();
  saved = saved || savedIds.includes(p.id);
  const nav = useNavigate();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save() {
    if (!profile) {
      nav("/login?next=/saved");
      return;
    }
    setBusy(true);
    try {
      await api(`/saved/${p.id}`, { method: saved ? "DELETE" : "POST" });
      await refreshSaved();
      onSave?.();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="property-card">
      <div className="property-image">
        <Link to={`/properties/${p.id}`}>
          <PropertyImage
            src={p.property_images[0]?.image_url || "/room.svg"}
            alt={`${p.room_type} interior${p.is_demo ? " — illustrative sample photo" : ""}`}
            loading="lazy"
          />
        </Link>
        <span className="image-tag">{p.room_type}</span>
        {profile?.role !== "landlord" && (
          <button
            className={`save-button ${saved ? "saved" : ""}`}
            disabled={busy}
            onClick={save}
            aria-label={`${saved ? "Remove saved property" : "Save property"}: ${p.title}`}
            aria-pressed={saved}
          >
            <Heart size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <div className="property-body">
        <div className="property-location">
          <MapPin size={13} />
          {p.city}, ON{p.is_demo && <span className="sample-tag">SAMPLE</span>}
        </div>
        <Link className="property-title" to={`/properties/${p.id}`}>
          {p.title}
        </Link>
        {p.university && (
          <p className="campus-label">
            <GraduationCap size={15} aria-hidden="true" />
            Near {p.university}
          </p>
        )}
        <p className="property-meta">
          <span>
            <BedDouble size={15} />
            {p.bedrooms === 0
              ? "Studio"
              : `${p.bedrooms} bed${p.bedrooms > 1 ? "s" : ""}`}
          </span>
          <span>
            <Bath size={15} />
            {p.bathrooms} bath
          </span>
          <span>
            {p.amenities.includes("Furnished") ? "Furnished" : "Unfurnished"}
          </span>
        </p>
        <div className="property-bottom">
          <div>
            <strong>{money(p.monthly_rent)}</strong>
            <span> / month</span>
          </div>
          <Link
            to={`/properties/${p.id}`}
            aria-label={`View ${p.title}`}
            className="round-link"
          >
            <ArrowUpRight size={19} />
          </Link>
        </div>
        {error && <Notice error>{error}</Notice>}
      </div>
    </article>
  );
}
export function DemoBanner() {
  return !configured ? (
    <div className="demo-banner">
      <span className="status-dot" />
      Sample browsing · Fictional rentals, illustrative photos. Accounts and
      bookings require Supabase setup.
    </div>
  ) : null;
}
export function Empty({
  title,
  children,
  link,
  label,
}: {
  title: string;
  children: ReactNode;
  link?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <House size={36} />
      <h2>{title}</h2>
      <p>{children}</p>
      {link && (
        <Link className="button" to={link}>
          {label}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function DashboardNav() {
  const { profile } = useAuth();
  return (
    <nav className="dashboard-nav" aria-label="Account navigation">
      <NavLink end to="/dashboard">
        Overview
      </NavLink>
      {profile?.role === "landlord" ? (
        <>
          <NavLink to="/listings">My listings</NavLink>
          <NavLink to="/bookings">Appointments</NavLink>
        </>
      ) : (
        <>
          <NavLink to="/bookings">My viewings</NavLink>
          <NavLink to="/saved">Saved homes</NavLink>
        </>
      )}
      <NavLink to="/profile">Profile settings</NavLink>
    </nav>
  );
}
export const features = [
  {
    icon: Globe,
    title: "Visit from anywhere",
    text: "Tour your next place virtually, even before your flight is booked.",
  },
  {
    icon: CalendarDays,
    title: "Your time, your viewing",
    text: "Choose an available time. Reserve it in a few simple steps.",
  },
  {
    icon: ShieldCheck,
    title: "Start with confidence",
    text: "Practical rental guidance to help you ask the right questions.",
  },
];
