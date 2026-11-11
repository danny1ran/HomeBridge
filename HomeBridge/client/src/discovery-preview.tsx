import { useState } from "react";
import { PropertyMap } from "./property-map";
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
  MapPin,
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
const [mapSelection, setMapSelection] = useState<string | null>(null);

const homes = properties.slice(0, 6);
const property = homes[detail ? 0 : selected] || homes[0];
const mapHome = homes.find((home) => home.id === mapSelection) || property;

function choose(index: number) {
  setMapSelection(homes[index].id);

  if (detail) {
    navigate(`/properties/${homes[index].id}`);
  } else {
    setSelected(index);
  }
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
            <PropertyMap
        properties={homes}
        selectedId={mapHome.id}
        onSelect={(id) => {
          setMapSelection(id);

          if (!detail) {
            setSelected(
              homes.findIndex((home) => home.id === id),
            );
          }
        }}
        onDetails={(id) => {
          if (detail && id === property.id) {
            document
              .getElementById("property-information")
              ?.scrollIntoView({
                behavior: window.matchMedia(
                  "(prefers-reduced-motion: reduce)",
                ).matches
                  ? "instant"
                  : "smooth",
              });
          } else {
            navigate(`/properties/${id}`);
          }
        }}
      />
    </div>
  );
}
