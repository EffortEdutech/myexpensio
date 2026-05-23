import { useEffect, useRef } from "react";

export type LatLng = [number, number];

export type RouteGeometry = {
  coordinates: [number, number][];
  type: "LineString";
};

export type RouteMapRoute = {
  distanceM: number;
  durationS: number;
  geometry: RouteGeometry;
  id: string;
  summary: string;
};

type RouteMapProps = {
  destinationLatLng: LatLng | null;
  mode: "pinning" | "routing";
  onDestinationSet: (latLng: LatLng) => void;
  onOriginSet: (latLng: LatLng) => void;
  onRouteClick: (index: number) => void;
  originLatLng: LatLng | null;
  routes: RouteMapRoute[];
  selectedIndex: number | null;
};

const DEFAULT_CENTER: LatLng = [4.2105, 101.9758];
const DEFAULT_ZOOM = 6;
const SELECTED_COLORS = ["#2563eb", "#d97706", "#16a34a"];
const DIM_COLORS = ["#93c5fd", "#fcd34d", "#86efac"];

export function RouteMap({
  destinationLatLng,
  mode,
  onDestinationSet,
  onOriginSet,
  onRouteClick,
  originLatLng,
  routes,
  selectedIndex
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const originMarkerRef = useRef<unknown>(null);
  const destinationMarkerRef = useRef<unknown>(null);
  const polylinesRef = useRef<unknown[]>([]);
  const initializedRef = useRef(false);
  const originRef = useRef(originLatLng);
  const destinationRef = useRef(destinationLatLng);
  const modeRef = useRef(mode);
  const onOriginSetRef = useRef(onOriginSet);
  const onDestinationSetRef = useRef(onDestinationSet);
  const onRouteClickRef = useRef(onRouteClick);

  useEffect(() => {
    originRef.current = originLatLng;
  }, [originLatLng]);

  useEffect(() => {
    destinationRef.current = destinationLatLng;
  }, [destinationLatLng]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    onOriginSetRef.current = onOriginSet;
  }, [onOriginSet]);

  useEffect(() => {
    onDestinationSetRef.current = onDestinationSet;
  }, [onDestinationSet]);

  useEffect(() => {
    onRouteClickRef.current = onRouteClick;
  }, [onRouteClick]);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) {
      return;
    }

    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || initializedRef.current || !containerRef.current) {
        return;
      }

      if (!document.querySelector('link[href*="leaflet@1.9"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })
        ._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
      });

      const map = L.map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          'Leaflet | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);

      map.on("click", (event: { latlng: { lat: number; lng: number } }) => {
        if (modeRef.current !== "pinning") {
          return;
        }

        const latLng: LatLng = [event.latlng.lat, event.latlng.lng];

        if (!originRef.current) {
          onOriginSetRef.current(latLng);
        } else if (!destinationRef.current) {
          onDestinationSetRef.current(latLng);
        }
      });

      initializedRef.current = true;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
        originMarkerRef.current = null;
        destinationMarkerRef.current = null;
        polylinesRef.current = [];
        initializedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    void import("leaflet").then((L) => {
      const map = mapRef.current as L.Map | null;
      if (!map) {
        return;
      }

      if (!originLatLng) {
        if (originMarkerRef.current) {
          (originMarkerRef.current as L.Marker).remove();
          originMarkerRef.current = null;
        }
        return;
      }

      const icon = L.divIcon({
        className: "",
        html:
          '<div style="background:#16a34a;border:3px solid #fff;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.25);height:22px;width:22px"></div>',
        iconAnchor: [11, 11],
        iconSize: [22, 22]
      });

      if (originMarkerRef.current) {
        (originMarkerRef.current as L.Marker).setLatLng(originLatLng);
      } else {
        const marker = L.marker(originLatLng, {
          draggable: true,
          icon,
          title: "Origin"
        }).addTo(map);

        marker.on("dragend", (event) => {
          const point = event.target.getLatLng();
          onOriginSetRef.current([point.lat, point.lng]);
        });

        originMarkerRef.current = marker;
      }

      if (!destinationLatLng) {
        map.setView(originLatLng, 14, { animate: true });
      }
    });
  }, [destinationLatLng, originLatLng]);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    void import("leaflet").then((L) => {
      const map = mapRef.current as L.Map | null;
      if (!map) {
        return;
      }

      if (!destinationLatLng) {
        if (destinationMarkerRef.current) {
          (destinationMarkerRef.current as L.Marker).remove();
          destinationMarkerRef.current = null;
        }
        return;
      }

      const icon = L.divIcon({
        className: "",
        html:
          '<div style="background:#dc2626;border:3px solid #fff;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.25);height:22px;width:22px"></div>',
        iconAnchor: [11, 11],
        iconSize: [22, 22]
      });

      if (destinationMarkerRef.current) {
        (destinationMarkerRef.current as L.Marker).setLatLng(
          destinationLatLng
        );
      } else {
        const marker = L.marker(destinationLatLng, {
          draggable: true,
          icon,
          title: "Destination"
        }).addTo(map);

        marker.on("dragend", (event) => {
          const point = event.target.getLatLng();
          onDestinationSetRef.current([point.lat, point.lng]);
        });

        destinationMarkerRef.current = marker;
      }

      if (originLatLng) {
        map.fitBounds([originLatLng, destinationLatLng], {
          animate: true,
          maxZoom: 15,
          padding: [60, 60]
        });
      } else {
        map.setView(destinationLatLng, 14, { animate: true });
      }
    });
  }, [destinationLatLng, originLatLng]);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    void import("leaflet").then((L) => {
      const map = mapRef.current as L.Map | null;
      if (!map) {
        return;
      }

      polylinesRef.current.forEach((polyline) =>
        (polyline as L.Polyline).remove()
      );
      polylinesRef.current = [];

      const boundsPoints: LatLng[] = [];
      routes.forEach((route, index) => {
        const selected = index === selectedIndex;
        const latLngs: LatLng[] = route.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );
        const polyline = L.polyline(latLngs, {
          color: selected
            ? SELECTED_COLORS[index % SELECTED_COLORS.length]
            : DIM_COLORS[index % DIM_COLORS.length],
          opacity: selected ? 0.95 : 0.5,
          weight: selected ? 7 : 3
        }).addTo(map);

        polyline.on("click", () => onRouteClickRef.current(index));
        polyline.bindTooltip(
          `${route.summary} · ${(route.distanceM / 1000).toFixed(2)} km · ${Math.round(route.durationS / 60)} min`,
          { direction: "top", sticky: true }
        );

        polylinesRef.current.push(polyline);
        latLngs.forEach((point) => boundsPoints.push(point));
      });

      if (boundsPoints.length > 0) {
        map.fitBounds(boundsPoints, {
          animate: true,
          maxZoom: 14,
          padding: [50, 50]
        });
      }
    });
  }, [routes, selectedIndex]);

  const instruction = !originLatLng
    ? "Tap map to set origin"
    : !destinationLatLng
      ? "Tap map to set destination"
      : "Both pins set - drag to adjust";

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{
          backgroundColor: "#f1f5f9",
          border: "1.5px solid #e2e8f0",
          borderRadius: 14,
          cursor:
            mode === "pinning" && (!originLatLng || !destinationLatLng)
              ? "crosshair"
              : "grab",
          height: 320,
          overflow: "hidden",
          width: "100%"
        }}
      />
      {mode === "pinning" ? (
        <div
          style={{
            backgroundColor: "rgba(15,23,42,0.84)",
            borderRadius: 20,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            left: "50%",
            padding: "6px 14px",
            pointerEvents: "none",
            position: "absolute",
            top: 10,
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            zIndex: 999
          }}
        >
          {instruction}
        </div>
      ) : null}
    </div>
  );
}
