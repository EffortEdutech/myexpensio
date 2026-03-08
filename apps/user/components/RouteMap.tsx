'use client'
// apps/user/components/RouteMap.tsx
//
// Leaflet map — tap-to-pin + drag-to-adjust + route drawing.
//
// Modes:
//   'pinning'  → map click drops origin/destination pins in sequence
//                dragging either pin calls onPinMoved to update parent
//   'routing'  → shows route polylines, pin dragging still allowed
//
// Pin sequence (pinning mode):
//   No pins      → click sets origin  (🟢)
//   Origin only  → click sets dest    (🔴)
//   Both set     → clicks ignored (user drags to adjust)
//
// Props:
//   mode            'pinning' | 'routing'
//   originLatLng    [lat,lng] | null
//   destLatLng      [lat,lng] | null
//   routes          RouteAlternativeMapData[]
//   selectedIndex   number | null
//   onOriginSet     (ll: LatLng) => void   — tap set or drag end
//   onDestSet       (ll: LatLng) => void   — tap set or drag end
//   onRouteClick    (index: number) => void

import { useEffect, useRef } from 'react'

export type LatLng = [number, number]  // [lat, lng]

export type RouteGeometry = {
  type:        'LineString'
  coordinates: [number, number][]  // OSRM [lng,lat] — swapped inside component
}

export type RouteAlternativeMapData = {
  route_id:   string
  distance_m: number
  duration_s: number
  summary:    string
  geometry:   RouteGeometry
}

type Props = {
  mode:           'pinning' | 'routing'
  originLatLng:   LatLng | null
  destLatLng:     LatLng | null
  routes:         RouteAlternativeMapData[]
  selectedIndex:  number | null
  onOriginSet:    (ll: LatLng) => void
  onDestSet:      (ll: LatLng) => void
  onRouteClick:   (index: number) => void
}

const SELECTED_COLORS = ['#2563eb', '#d97706', '#16a34a']
const DIM_COLORS      = ['#93c5fd', '#fcd34d', '#86efac']

// Malaysia default center
const DEFAULT_CENTER: LatLng = [4.2105, 101.9758]
const DEFAULT_ZOOM           = 6

export default function RouteMap({
  mode, originLatLng, destLatLng,
  routes, selectedIndex,
  onOriginSet, onDestSet, onRouteClick,
}: Props) {
  const containerRef    = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<unknown>(null)
  const originMarkerRef = useRef<unknown>(null)
  const destMarkerRef   = useRef<unknown>(null)
  const polylinesRef    = useRef<unknown[]>([])
  const initializedRef  = useRef(false)
  // Keep callbacks in refs so map event listeners don't go stale
  const onOriginSetRef  = useRef(onOriginSet)
  const onDestSetRef    = useRef(onDestSet)
  const onRouteClickRef = useRef(onRouteClick)
  const originLatLngRef = useRef(originLatLng)
  const destLatLngRef   = useRef(destLatLng)
  const modeRef         = useRef(mode)

  // Sync refs on every render
  useEffect(() => { onOriginSetRef.current  = onOriginSet  }, [onOriginSet])
  useEffect(() => { onDestSetRef.current    = onDestSet    }, [onDestSet])
  useEffect(() => { onRouteClickRef.current = onRouteClick }, [onRouteClick])
  useEffect(() => { originLatLngRef.current = originLatLng }, [originLatLng])
  useEffect(() => { destLatLngRef.current   = destLatLng   }, [destLatLng])
  useEffect(() => { modeRef.current         = mode         }, [mode])

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return

    import('leaflet').then(L => {
      if (initializedRef.current || !containerRef.current) return

      // Leaflet CSS
      if (!document.querySelector('link[href*="leaflet@1.9"]')) {
        const link = document.createElement('link')
        link.rel  = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Fix webpack icon path issue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (L as any).map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom:   DEFAULT_ZOOM,
      })
      mapRef.current = map

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(L as any).tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }
      ).addTo(map)

      // ── Map click handler — tap to place pins ──────────────────────────
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        if (modeRef.current !== 'pinning') return

        const ll: LatLng = [e.latlng.lat, e.latlng.lng]

        if (!originLatLngRef.current) {
          // First tap → set origin
          onOriginSetRef.current(ll)
        } else if (!destLatLngRef.current) {
          // Second tap → set destination
          onDestSetRef.current(ll)
        }
        // Both set → ignore taps (user drags to fine-tune)
      })

      initializedRef.current = true
    })

    return () => {
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mapRef.current as any).remove()
        mapRef.current        = null
        originMarkerRef.current = null
        destMarkerRef.current   = null
        polylinesRef.current    = []
        initializedRef.current  = false
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sync origin marker ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!initializedRef.current) return
    import('leaflet').then(L => {
      const map = mapRef.current
      if (!map) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const makeOriginIcon = () => (L as any).divIcon({
        html:      '<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">🟢</div>',
        className: '',
        iconSize:  [28, 28],
        iconAnchor:[14, 14],
      })

      if (originLatLng) {
        if (originMarkerRef.current) {
          // Move existing marker
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(originMarkerRef.current as any).setLatLng(originLatLng)
        } else {
          // Create draggable origin marker
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const marker = (L as any).marker(originLatLng, {
            icon:      makeOriginIcon(),
            draggable: true,
            title:     'Origin — drag to adjust',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }).addTo(map as any)

          marker.bindTooltip('Origin', { permanent: false, direction: 'top', offset: [0, -10] })

          marker.on('dragend', (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
            const ll = e.target.getLatLng()
            onOriginSetRef.current([ll.lat, ll.lng])
          })

          originMarkerRef.current = marker
        }
        // Pan to origin if it's the first point set
        if (!destLatLng) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(map as any).setView(originLatLng, 14, { animate: true })
        }
      } else {
        // Remove marker if cleared
        if (originMarkerRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(originMarkerRef.current as any).remove()
          originMarkerRef.current = null
        }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originLatLng])

  // ── Sync destination marker ────────────────────────────────────────────────
  useEffect(() => {
    if (!initializedRef.current) return
    import('leaflet').then(L => {
      const map = mapRef.current
      if (!map) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const makeDestIcon = () => (L as any).divIcon({
        html:      '<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">🔴</div>',
        className: '',
        iconSize:  [28, 28],
        iconAnchor:[14, 28],
      })

      if (destLatLng) {
        if (destMarkerRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(destMarkerRef.current as any).setLatLng(destLatLng)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const marker = (L as any).marker(destLatLng, {
            icon:      makeDestIcon(),
            draggable: true,
            title:     'Destination — drag to adjust',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }).addTo(map as any)

          marker.bindTooltip('Destination', { permanent: false, direction: 'top', offset: [0, -10] })

          marker.on('dragend', (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
            const ll = e.target.getLatLng()
            onDestSetRef.current([ll.lat, ll.lng])
          })

          destMarkerRef.current = marker
        }
        // Fit both pins in view
        if (originLatLng) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(map as any).fitBounds([originLatLng, destLatLng], { padding: [60, 60], maxZoom: 15, animate: true })
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(map as any).setView(destLatLng, 14, { animate: true })
        }
      } else {
        if (destMarkerRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(destMarkerRef.current as any).remove()
          destMarkerRef.current = null
        }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destLatLng])

  // ── Sync route polylines ───────────────────────────────────────────────────
  useEffect(() => {
    if (!initializedRef.current) return
    import('leaflet').then(L => {
      const map = mapRef.current
      if (!map) return

      // Clear old polylines
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      polylinesRef.current.forEach(p => (p as any).remove())
      polylinesRef.current = []

      if (routes.length === 0) return

      const boundsPoints: LatLng[] = []

      routes.forEach((route, i) => {
        const isSelected = i === selectedIndex
        // OSRM coords are [lng, lat] — swap to [lat, lng] for Leaflet
        const latlngs: LatLng[] = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const polyline = (L as any).polyline(latlngs, {
          color:   isSelected ? SELECTED_COLORS[i % 3] : DIM_COLORS[i % 3],
          weight:  isSelected ? 7 : 3,
          opacity: isSelected ? 0.95 : 0.5,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).addTo(map as any)

        polyline.on('click', () => onRouteClickRef.current(i))
        polyline.bindTooltip(
          `${route.summary} · ${(route.distance_m / 1000).toFixed(2)} km · ${Math.round(route.duration_s / 60)} min`,
          { sticky: true, direction: 'top' }
        )

        polylinesRef.current.push(polyline)
        latlngs.forEach(p => boundsPoints.push(p))
      })

      // Fit all routes in view
      if (boundsPoints.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(map as any).fitBounds(boundsPoints, { padding: [50, 50], maxZoom: 14, animate: true })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, selectedIndex])

  // ── Cursor style hint based on mode ───────────────────────────────────────
  const cursorStyle = mode === 'pinning' && (!originLatLng || !destLatLng)
    ? 'crosshair'
    : 'grab'

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        style={{
          height:          360,
          width:           '100%',
          borderRadius:    14,
          overflow:        'hidden',
          border:          '1.5px solid #e2e8f0',
          backgroundColor: '#f1f5f9',
          cursor:          cursorStyle,
        }}
      />
      {/* Pinning instruction overlay */}
      {mode === 'pinning' && (
        <div style={{
          position:        'absolute',
          top:             10,
          left:            '50%',
          transform:       'translateX(-50%)',
          backgroundColor: 'rgba(15,23,42,0.82)',
          color:           '#fff',
          fontSize:        12,
          fontWeight:      600,
          padding:         '6px 14px',
          borderRadius:    20,
          pointerEvents:   'none',
          whiteSpace:      'nowrap',
          backdropFilter:  'blur(4px)',
          zIndex:          999,
        }}>
          {!originLatLng
            ? '👆 Tap map to set origin'
            : !destLatLng
            ? '👆 Tap map to set destination'
            : '✓ Both pins set — drag to adjust'}
        </div>
      )}
    </div>
  )
}
