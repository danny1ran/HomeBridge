import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Bath,
  BedDouble,
  CalendarDays,
  Compass,
  Heart,
  House,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  Video,
} from "lucide-react";
import type { Property } from "../../shared/types";
import { PropertyImage } from "./components";
import { money } from "./lib";

export function DiscoveryPreview({
  properties,
  detail = false,
}: {
  properties: Property[];
  detail?: boolean;
}) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const homes = properties.slice(0, 5);
  const property = homes[detail ? 0 : selected] || homes[0];
  function choose(index: number) {
    if (detail) navigate(`/properties/${homes[index].id}`);
    else setSelected(index);
  }
  if (!property) return null;
  return (
    <div
      className="discovery-window"
      aria-label={
        detail ? "Discover student homes" : "Interactive housing preview"
      }
    >
      <aside className="discovery-sidebar">
        <Link to="/" className="discovery-brand">
          <House size={20} />
          <span>
            home<b>bridge</b>
            <small>YOUR NEXT CHAPTER</small>
          </span>
        </Link>
        <nav aria-label="Housing preview navigation">
          <Link to="/dashboard">
            <House size={18} />
            My dashboard
          </Link>
          <a href="#discover-preview" className="selected">
            <Compass size={18} />
            Discover
          </a>
          <Link to="/saved">
            <Heart size={18} />
            Saved homes
          </Link>
          <Link to="/bookings">
            <CalendarDays size={18} />
            My viewings
          </Link>
        </nav>
        <div className="sidebar-invite">
          <span className="invite-icon">
            <House size={35} />
          </span>
          <h3>
            A new city.
            <br />A place that's yours.
          </h3>
          <p>Start your next chapter with a space that fits.</p>
          <Link to="/browse">
            Explore homes <ArrowUpRight size={15} />
          </Link>
        </div>
        <span className="sidebar-foot">
          <ShieldCheck size={14} />
          Made for your next move
        </span>
      </aside>
      <div className="discovery-detail" id="discover-preview">
        <div className="discovery-breadcrumb">
          <span>Discover</span>
          <span>/</span>
          <strong>Your next home</strong>
          <span className="preview-label">
            {detail ? "Property details" : "Interactive preview"}
          </span>
        </div>
        <div className="discovery-title">
          <div>
            <p className="eyebrow">{property.room_type}</p>
            {detail ? <h1>{property.title}</h1> : <h2>{property.title}</h2>}
            <p>
              <MapPin size={12} />
              {property.city}, {property.province}
            </p>
          </div>
          <strong>
            {money(property.monthly_rent)}
            <small>CAD / month</small>
          </strong>
        </div>
        <Link
          className="discovery-photo"
          to={`/properties/${property.id}`}
          aria-label={`Explore ${property.title}`}
        >
          <PropertyImage
            src={property.property_images[0]?.image_url}
            fetchPriority="high"
            alt={`${property.title}${property.is_demo ? " — illustrative sample photo" : ""}`}
          />
          <span>
            {property.is_demo ? "Fictional sample rental" : "Explore this home"}
          </span>
          <span className="photo-arrow">
            <ArrowUpRight size={20} />
          </span>
        </Link>
        <div className="discovery-meta">
          <div className="home-thumbnails" aria-label="Choose a property">
            {homes.slice(0, 3).map((home, index) => (
              <button
                key={home.id}
                aria-label={`Preview ${home.title}`}
                aria-pressed={property.id === home.id}
                onClick={() => choose(index)}
              >
                <PropertyImage
                  src={home.property_images[0]?.image_url}
                  alt=""
                />
              </button>
            ))}
          </div>
          <div className="home-facts">
            <span>
              <BedDouble size={18} />
              {property.bedrooms || "Studio"}
              {property.bedrooms ? " bed" : ""}
            </span>
            <span>
              <Bath size={18} />
              {property.bathrooms} bath
            </span>
          </div>
        </div>
        <div className="discovery-overview">
          <h3>Overview</h3>
          <span>
            <Video size={14} />
            See it before you arrive
          </span>
        </div>
        <p className="discovery-description">
          {detail
            ? property.description
            : "A space for studying, settling in, and everything in between. Explore the details and find a viewing that works for you."}
        </p>
        <div className="discovery-actions">
          <Link to="/browse" className="button secondary">
            Compare homes
          </Link>
          {detail ? (
            <a href="#viewing-times" className="button">
              Book a viewing <ArrowRight size={15} />
            </a>
          ) : (
            <Link to={`/properties/${property.id}`} className="button">
              View this home <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
      <div className="neighbourhood-preview">
        <svg
          className="neighbourhood-art"
          viewBox="0 0 500 700"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="500" height="700" fill="var(--map-land)" />
          <g fill="var(--map-park)">
            <path d="M370 0h130v165l-65 20-45-55z" />
            <path d="M0 420l90-15 55 65-40 95H0z" />
            <path d="M290 570l100-40 70 100-15 70H300z" />
          </g>
          <path
            d="M350-30C170 130 390 250 240 400S260 620 140 730"
            fill="none"
            stroke="var(--map-water)"
            strokeWidth="55"
          />
          <g fill="none" stroke="var(--map-road)" strokeWidth="9">
            <path d="M-60 110L520 640M-90 240L470 750M-40-50L520 460M90-50L540 310M-80 410L380-40M-60 570L520 20M-10 710L550 180M180 730L550 370" />
            <path d="M80 0v180l100 90-70 130 60 130-50 170" />
          </g>
          <path
            d="M-30 650L110 505Q150 460 195 475T290 430L530 185"
            fill="none"
            stroke="var(--map-road)"
            strokeWidth="23"
          />
          <path
            d="M-30 650L110 505Q150 460 195 475T290 430L530 185"
            fill="none"
            stroke="#fbca5a"
            strokeWidth="12"
          />
        </svg>
        <div className="map-location">
          <span>
            <Map size={19} />
          </span>
          <div>
            <Search size={15} />
            {property.city}, ON
          </div>
        </div>
        <span className="map-area area-one">A NEW NEIGHBOURHOOD</span>
        <span className="map-area area-two">A FRESH START</span>
        <div className="map-property">
          <PropertyImage src={property.property_images[0]?.image_url} alt="" />
          <div>
            <strong>
              {money(property.monthly_rent)}
              <small> / mo</small>
            </strong>
            <p>{property.room_type}</p>
            {detail ? (
              <a href="#property-information">
                Show details <ArrowUpRight size={12} />
              </a>
            ) : (
              <Link to={`/properties/${property.id}`}>
                Show details <ArrowUpRight size={12} />
              </Link>
            )}
          </div>
        </div>
        <span className="map-selected-dot" aria-hidden="true" />
        {homes.map((home, index) => (
          <button
            key={home.id}
            className={`map-home map-home-${index} ${property.id === home.id ? "chosen" : ""}`}
            aria-label={`Show ${home.title} on preview`}
            aria-pressed={property.id === home.id}
            onClick={() => choose(index)}
          >
            <PropertyImage src={home.property_images[0]?.image_url} alt="" />
            <span>{money(home.monthly_rent)}</span>
          </button>
        ))}
        <div className="map-disclaimer">
          <MapPin size={13} />
          Illustrative map · not property locations
        </div>
      </div>
    </div>
  );
}
