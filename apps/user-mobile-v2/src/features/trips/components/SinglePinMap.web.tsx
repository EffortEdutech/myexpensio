/**
 * SinglePinMap (web) — Leaflet loaded from CDN via script injection.
 * Single draggable pin. Tap anywhere to move it.
 */
import { useEffect, useRef } from "react";

export type LatLng = [number, number];

type SinglePinMapProps = {
  center: LatLng | null;
  onPinSet: (latLng: LatLng) => void;
  pinLatLng: LatLng | null;
};

declare global {
  interface Window {
    L: {
      map: (el: HTMLElement, opts?: object) => LeafletMap;
      tileLayer: (url: string, opts?: object) => { addTo: (m: LeafletMap) => void };
      marker: (latlng: [number, number], opts?: object) => LeafletMarker;
      divIcon: (opts: object) => object;
    };
  }
}

interface LeafletMap {
  setView: (latlng: [number, number], zoom: number) => LeafletMap;
  on: (event: string, fn: (e: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
}

interface LeafletMarker {
  addTo: (m: LeafletMap) => LeafletMarker;
  setLatLng: (latlng: [number, number]) => void;
  getLatLng: () => { lat: number; lng: number };
  on: (event: string, fn: (e: { target: LeafletMarker }) => void) => void;
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const DEFAULT_CENTER: LatLng = [4.2105, 101.9758];

function ensureLeaflet(): Promise<void> {
  return new Promise((resolve) => {
    if (window.L) { resolve(); return; }
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.onload = () => resolve();
      document.head.appendChild(script);
    } else {
      // script tag exists but L may not be ready yet
      const interval = setInterval(() => {
        if (window.L) { clearInterval(interval); resolve(); }
      }, 50);
    }
  });
}

export function SinglePinMap({ center, onPinSet, pinLatLng }: SinglePinMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const pinRef = useRef<LeafletMarker | null>(null);
  const onPinSetRef = useRef(onPinSet);

  useEffect(() => { onPinSetRef.current = onPinSet; }, [onPinSet]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    void ensureLeaflet().then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const L = window.L;
      const initialCenter = center ?? pinLatLng ?? DEFAULT_CENTER;
      const zoom = (center ?? pinLatLng) ? 15 : 6;
      const m = L.map(containerRef.current, { zoomControl: true }).setView(initialCenter, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OSM contributors",
        maxZoom: 19
      }).addTo(m);
      mapRef.current = m;

      function placePin(lat: number, lng: number) {
        if (pinRef.current) {
          pinRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], {
            draggable: true,
            icon: L.divIcon({
              className: "",
              html: '<div style="background:#1d4ed8;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.35);width:24px;height:24px;cursor:pointer;"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          }).addTo(m);
          marker.on("dragend", (e) => {
            const ll = e.target.getLatLng();
            onPinSetRef.current([ll.lat, ll.lng]);
          });
          pinRef.current = marker;
        }
        onPinSetRef.current([lat, lng]);
      }

      m.on("click", (e) => placePin(e.latlng.lat, e.latlng.lng));

      // Plant existing pin if provided
      const startPin = center ?? pinLatLng;
      if (startPin) placePin(startPin[0], startPin[1]);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      pinRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to new center when geocode result arrives
  useEffect(() => {
    if (!center || !mapRef.current) return;
    // Re-initialize map view and move pin
    const L = window.L;
    if (!L) return;
    mapRef.current.setView(center, 16);
    if (pinRef.current) {
      pinRef.current.setLatLng(center);
    } else {
      const marker = L.marker(center, {
        draggable: true,
        icon: L.divIcon({
          className: "",
          html: '<div style="background:#1d4ed8;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.35);width:24px;height:24px;cursor:pointer;"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(mapRef.current);
      marker.on("dragend", (e) => {
        const ll = e.target.getLatLng();
        onPinSetRef.current([ll.lat, ll.lng]);
      });
      pinRef.current = marker;
    }
    onPinSet(center);
  }, [center?.[0], center?.[1]]);

  return (
    <div
      ref={containerRef}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        borderRadius: 10,
        height: 220,
        overflow: "hidden",
        width: "100%",
        border: "1px solid #e2e8f0"
      }}
    />
  );
}
