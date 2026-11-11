import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Property } from "../../shared/types";
import { money } from "./lib";

export function PropertyMap({
  properties,
  selectedId,
  onSelect,
  onDetails,
}: {
  properties: Property[];
  selectedId: string;
  onSelect: (id: string) => void;
  onDetails: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const callbacks = useRef({ onSelect, onDetails });
  callbacks.current = { onSelect, onDetails };

  const [tileError, setTileError] = useState(false);

  const mapped = properties.filter(
    (p) =>
      Number.isFinite(p.latitude) &&
      Number.isFinite(p.longitude) &&
      Math.abs(p.latitude!) <= 90 &&
      Math.abs(p.longitude!) <= 180,
  );

  const signature = JSON.stringify(
    mapped.map((p) => [
      p.id,
      p.latitude,
      p.longitude,
      p.title,
      p.city,
      p.monthly_rent,
      p.is_demo,
    ]),
  );

  const animate = () =>
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!container.current || !mapped.length) return;

    const reduced = !animate();

    const instance = L.map(container.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      zoomAnimation: false,
      fadeAnimation: !reduced,
      markerZoomAnimation: false,
      inertia: !reduced,
    }).setView([mapped[0].latitude!, mapped[0].longitude!], 12);

    map.current = instance;

    L.control.zoom({ position: "bottomleft" }).addTo(instance);

    const tileUrl =
      import.meta.env.VITE_MAP_TILE_URL ||
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution =
      import.meta.env.VITE_MAP_ATTRIBUTION ||
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      maxNativeZoom: 19,
      detectRetina: true,
      attribution,
    }).addTo(instance);

    tiles.on("tileerror", () => setTileError(true));
    tiles.on("tileload", () => setTileError(false));

    for (const home of mapped) {
      const price = document.createElement("span");
      price.textContent = money(home.monthly_rent);

      const marker = L.marker(
        [home.latitude!, home.longitude!],
        {
          icon: L.divIcon({
            className: "home-map-pin",
            html: price,
            iconSize: [78, 36],
            iconAnchor: [39, 36],
            popupAnchor: [0, -38],
          }),
          title: `${home.title} — ${home.city}${
            home.is_demo ? " (sample location)" : ""
          }`,
          keyboard: true,
        },
      ).addTo(instance);

      const content = document.createElement("div");
      content.className = "home-map-popup";

      const title = document.createElement("strong");
      title.textContent = home.title;

      const description = document.createElement("p");
      description.textContent =
        `${home.city} · ${money(home.monthly_rent)} CAD / month`;

      const note = document.createElement("small");
      note.textContent = home.is_demo
        ? "Approximate sample pin, not a real rental address."
        : "Listing location supplied by the owner.";

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Show home details";
      button.addEventListener("click", () =>
        callbacks.current.onDetails(home.id),
      );

      content.append(title, description, note, button);

      marker.bindPopup(content, {
        maxWidth: 230,
        minWidth: 160,
        autoPanPadding: [20, 35],
      });

      marker.on("click", () =>
        callbacks.current.onSelect(home.id),
      );

      markers.current.set(home.id, marker);
    }

    const observer = new ResizeObserver(() =>
      instance.invalidateSize({ pan: false }),
    );

    observer.observe(container.current);

    return () => {
      observer.disconnect();
      instance.remove();
      markers.current.clear();
      map.current = null;
    };
  }, [signature]);

  function focusHome(id: string) {
    const marker = markers.current.get(id);
    if (!map.current || !marker) return;

    map.current.stop();
    map.current.setView(marker.getLatLng(), 13, {
      animate: animate(),
      duration: 0.3,
    });
    marker.openPopup();
  }

  useEffect(() => {
    for (const [id, marker] of markers.current) {
      marker
        .getElement()
        ?.classList.toggle("is-selected", id === selectedId);

      marker
        .getElement()
        ?.setAttribute("aria-pressed", String(id === selectedId));

      marker.setZIndexOffset(id === selectedId ? 1000 : 0);
    }

    focusHome(selectedId);
  }, [selectedId, signature]);

  function fitArea(city?: string) {
    if (!map.current) return;

    const homes = mapped.filter((p) => !city || p.city === city);
    if (!homes.length) return;

    map.current.stop();
    map.current.closePopup();
    map.current.fitBounds(
      L.latLngBounds(
        homes.map(
          (p) =>
            [p.latitude!, p.longitude!] as [number, number],
        ),
      ),
      {
        padding: [45, 55],
        maxZoom: 13,
        animate: animate(),
        duration: 0.3,
      },
    );
  }

  return (
    <section
      className="geographic-map"
      aria-label="Rental locations map"
    >
      <div
        className="geographic-map-toolbar"
        aria-label="Map area controls"
      >
        {Array.from(new Set(mapped.map((p) => p.city))).map(
          (city) => (
            <button
              type="button"
              key={city}
              onClick={() => fitArea(city)}
            >
              {city}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => fitArea()}
          disabled={!mapped.length}
        >
          All homes
        </button>

        <button
          type="button"
          onClick={() => focusHome(selectedId)}
          disabled={
            !markers.current.has(selectedId) &&
            !mapped.some((p) => p.id === selectedId)
          }
        >
          Center selected
        </button>
      </div>

      {mapped.length ? (
        <div
          ref={container}
          className="geographic-map-canvas"
          aria-label="Interactive map. Drag to pan, use plus and minus to zoom, or focus the map and use arrow keys."
        />
      ) : (
        <p className="geographic-map-note">
          No coordinates have been added for these homes yet.
        </p>
      )}

      {tileError && (
        <p className="geographic-map-note" role="status">
          Map tiles could not load. Check your connection; the
          home list below still works.
        </p>
      )}

      <p className="geographic-map-note">
        Drag to explore · + / − to zoom · pinch on touch screens.
        <br />
        {mapped.some((p) => p.is_demo)
          ? "Demo pins show approximate areas, not real rental addresses."
          : "Locations are supplied by listing owners."}
      </p>

      <div
        className="map-home-picker"
        aria-label="Choose a mapped home"
      >
        {properties.map((home) => (
          <button
            type="button"
            key={home.id}
            aria-pressed={selectedId === home.id}
            onClick={() => {
              onSelect(home.id);
              if (home.id === selectedId) focusHome(home.id);
            }}
          >
            <span>{home.title}</span>
            <small>
              {home.city} · {money(home.monthly_rent)}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}