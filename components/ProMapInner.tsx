// components/ProMapInner.tsx
'use client'

import 'leaflet/dist/leaflet.css'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../lib/state'

type Props = {
  items: any[]
  category?: string
  radiusMiles?: number
  searchCenter?: [number, number]
  onSearchHere?: (center: [number, number]) => void
  hasArea?: boolean
  onClearArea?: () => void
  onAreaChange?: (gj: any) => void
}

const CAT_EMOJI: Record<string, string> = {
  Electrical: '⚡',
  HVAC: '❄️',
  Roofing: '🏠',
  Plumbing: '🚿',
  Carpentry: '🪚',
  General: '🧰',
  Landscaping: '🌿',
}

export default function ProMapInner({
  items = [],
  category,
  radiusMiles = 10,
  searchCenter,
  onSearchHere,
  onAreaChange,
  onClearArea,
}: Props) {
  const addToast = useApp()?.addToast

  // --- Data filter ---
  const safeItems = Array.isArray(items) ? items : []
  const pros = useMemo(() => {
    if (!category) return safeItems
    return safeItems.filter((c: any) => Array.isArray(c?.services) && c.services.includes(category))
  }, [safeItems, category])

  // --- Leaflet + map refs ---
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObjRef = useRef<any>(null)
  const LRef = useRef<any>(null) // store Leaflet module
  const layerRef = useRef<any>(null)

  // --- Drawing state ---
  const drawingsLayerRef = useRef<any>(null)
  const tempLineRef = useRef<any>(null)
  const tempPtsRef = useRef<[number, number][]>([])
  const isDrawingRef = useRef(false)
  const [isDrawing, setIsDrawing] = useState(false)

  const clickHandlerRef = useRef<any>(null)
  const mouseMoveHandlerRef = useRef<any>(null)
  const dblHandlerRef = useRef<any>(null)

  const suppressFitRef = useRef(false)

  // ===== Drawing helpers =====
  function disableMapInteractions(map: any) {
    map.dragging?.disable()
    map.doubleClickZoom?.disable()
    map.scrollWheelZoom?.disable()
    map.boxZoom?.disable()
    map.touchZoom?.disable()
    map.keyboard?.disable()
    map._container.style.cursor = 'crosshair'
  }
  function enableMapInteractions(map: any) {
    map.dragging?.enable()
    map.doubleClickZoom?.enable()
    map.scrollWheelZoom?.enable()
    map.boxZoom?.enable()
    map.touchZoom?.enable()
    map.keyboard?.enable()
    map._container.style.cursor = ''
  }

  function startFreshDrawing(L: any, map: any) {
    if (!drawingsLayerRef.current) drawingsLayerRef.current = L.layerGroup().addTo(map)
    tempPtsRef.current = []
    if (tempLineRef.current) {
      try { map.removeLayer(tempLineRef.current) } catch {}
      tempLineRef.current = null
    }
  }

  function clearTempLine(map: any) {
    if (tempLineRef.current) {
      try { map.removeLayer(tempLineRef.current) } catch {}
      tempLineRef.current = null
    }
  }

  function clearAllDrawings(L: any, map: any) {
    tempPtsRef.current = []
    clearTempLine(map)
    if (drawingsLayerRef.current) {
      try { drawingsLayerRef.current.clearLayers() } catch {}
    }
    emitDrawingsGeoJSON()
  }

  function finalizeCurrentIfPossible(L: any, map: any) {
    const pts = tempPtsRef.current
    if (pts.length >= 3) {
      const poly = L.polygon(pts, {
        color: '#10b981',
        weight: 2,
        fillColor: '#10b981',
        fillOpacity: 0.15,
      })
      drawingsLayerRef.current.addLayer(poly)
      emitDrawingsGeoJSON()
    }
    tempPtsRef.current = []
    clearTempLine(map)
  }

  function emitDrawingsGeoJSON() {
    if (!onAreaChange) return
    const fc = { type: 'FeatureCollection', features: [] as any[] }
    if (drawingsLayerRef.current) {
      drawingsLayerRef.current.eachLayer((l: any) => {
        if (typeof l.toGeoJSON === 'function') fc.features.push(l.toGeoJSON())
      })
    }
    onAreaChange(fc)
  }

  function toggleDrawMode(L: any, map: any, turnOn?: boolean) {
    const next = typeof turnOn === 'boolean' ? turnOn : !isDrawingRef.current
    isDrawingRef.current = next
    setIsDrawing(next)

    if (next) {
      disableMapInteractions(map)
      startFreshDrawing(L, map)

      const onClick = (e: any) => {
        tempPtsRef.current.push([e.latlng.lat, e.latlng.lng])
        if (!tempLineRef.current) {
          tempLineRef.current = L.polyline(tempPtsRef.current, { color: '#10b981', weight: 2 }).addTo(map)
        } else {
          tempLineRef.current.setLatLngs(tempPtsRef.current)
        }
      }
      const onMove = (e: any) => {
        if (!tempLineRef.current || tempPtsRef.current.length === 0) return
        const preview = [...tempPtsRef.current, [e.latlng.lat, e.latlng.lng]]
        tempLineRef.current.setLatLngs(preview)
      }
      const onDbl = (e: any) => {
        if (tempPtsRef.current.length >= 2) tempPtsRef.current.push([e.latlng.lat, e.latlng.lng])
        finalizeCurrentIfPossible(L, map)
      }

      map.on('click', onClick)
      map.on('mousemove', onMove)
      map.on('dblclick', onDbl)
      clickHandlerRef.current = onClick
      mouseMoveHandlerRef.current = onMove
      dblHandlerRef.current = onDbl
    } else {
      enableMapInteractions(map)
      if (clickHandlerRef.current) map.off('click', clickHandlerRef.current)
      if (mouseMoveHandlerRef.current) map.off('mousemove', mouseMoveHandlerRef.current)
      if (dblHandlerRef.current) map.off('dblclick', dblHandlerRef.current)
      clickHandlerRef.current = null
      mouseMoveHandlerRef.current = null
      dblHandlerRef.current = null
      clearTempLine(map)
      tempPtsRef.current = []
    }
  }

  // ===== Map init =====
  useEffect(() => {
    let resizeHandler: any
    ;(async () => {
      if (!mapRef.current || mapObjRef.current) return
      try {
        const mod = await import('leaflet')
        const L: any = (mod as any).default ?? mod
        LRef.current = L

        const initialCenter: [number, number] = searchCenter ?? [40.7128, -74.006]
        const map = L.map(mapRef.current, { zoomControl: false }).setView(initialCenter, 11)
        mapObjRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map)

        L.control.zoom({ position: 'topright' }).addTo(map)

        setTimeout(() => map.invalidateSize(), 0)
        resizeHandler = () => map.invalidateSize()
        window.addEventListener('resize', resizeHandler)

        refreshMarkers(L, map, pros, layerRef, category, { fit: true })
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('Leaflet init failed:', e)
      }
    })()

    return () => {
      try {
        const map = mapObjRef.current
        if (map) {
          if (clickHandlerRef.current) map.off('click', clickHandlerRef.current)
          if (mouseMoveHandlerRef.current) map.off('mousemove', mouseMoveHandlerRef.current)
          if (dblHandlerRef.current) map.off('dblclick', dblHandlerRef.current)
          try { if (layerRef.current) map.removeLayer(layerRef.current) } catch {}
          try { if (drawingsLayerRef.current) map.removeLayer(drawingsLayerRef.current) } catch {}
          map.remove()
        }
      } catch {}
      if (resizeHandler) window.removeEventListener('resize', resizeHandler)

      mapObjRef.current = null
      layerRef.current = null
      drawingsLayerRef.current = null
      tempLineRef.current = null
      tempPtsRef.current = []
      isDrawingRef.current = false
      setIsDrawing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recenter/refresh on props change
  useEffect(() => {
    ;(async () => {
      const map = mapObjRef.current
      const L = LRef.current
      if (!map || !L) return
      try {
        if (searchCenter) map.setView(searchCenter, map.getZoom() || 11, { animate: true })
        refreshMarkers(L, map, pros, layerRef, category, { fit: !suppressFitRef.current })
        suppressFitRef.current = false
      } catch {}
    })()
  }, [pros, searchCenter, category])

  // ===== Button handlers (React overlay) =====
  const handleLocate = () => {
    const map = mapObjRef.current
    if (!map) return
    if (!navigator.geolocation) { addToast?.('Geolocation not supported', 'error'); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        map.panTo(ll, { animate: true })
        onSearchHere?.(ll)
        suppressFitRef.current = true
      },
      () => addToast?.('Unable to retrieve your location', 'error'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleSearchHere = () => {
    const map = mapObjRef.current
    if (!map) return
    const c = map.getCenter()
    const ll: [number, number] = [c.lat, c.lng]
    onSearchHere?.(ll)
    suppressFitRef.current = true
  }

  const handleDrawToggleOn = () => {
    const map = mapObjRef.current
    const L = LRef.current
    if (!map || !L) return
    toggleDrawMode(L, map, true)
  }

  const handleAddArea = () => {
    const map = mapObjRef.current
    const L = LRef.current
    if (!map || !L) return
    finalizeCurrentIfPossible(L, map)
    startFreshDrawing(L, map) // stay in draw mode
  }

  const handleEraseLast = () => {
    const map = mapObjRef.current
    if (!map) return
    if (tempPtsRef.current.length > 0) {
      tempPtsRef.current.pop()
      if (tempPtsRef.current.length === 0 && tempLineRef.current) {
        try { map.removeLayer(tempLineRef.current) } catch {}
        tempLineRef.current = null
      } else if (tempLineRef.current) {
        tempLineRef.current.setLatLngs(tempPtsRef.current)
      }
    }
  }

  return (
    <div className="relative">
      {/* Map */}
      <div
        ref={mapRef}
        className="h-[360px] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800"
        style={{ zIndex: 0 }}
      />

      {/* React overlay toolbar (always clickable) */}
      <div
        className="absolute top-3 left-3"
        style={{ zIndex: 10000, pointerEvents: 'auto' }}
      >
        {/* Badges row (legend) */}
        <div
          style={{
            background: 'rgba(255,255,255,.92)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(15,23,42,.08)',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(2,6,23,.08)',
            padding: '6px 10px',
            color: '#0f172a',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-end',
            whiteSpace: 'nowrap'
          }}
        >
          {Object.entries(CAT_EMOJI).map(([label, emoji]) => (
            <div key={label} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div
                style={{
                  width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 9999, background: '#ecfdf5', border: '1px solid rgba(16,185,129,.5)'
                }}
              >
                {/* using plain emoji keeps this simple; swap to twemoji if you want */}
                <span style={{ fontSize: 12, lineHeight: 1 }}>{emoji}</span>
              </div>
              <div style={{ fontSize: 10, lineHeight: 1.1, color: '#334155', textAlign: 'center' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Row 1 buttons */}
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={handleLocate} style={btnStyle(false)}>📍 Locate me</button>
          <button type="button" onClick={handleSearchHere} style={btnStyle(false)}>🔎 Search this area</button>
          <button type="button" onClick={handleDrawToggleOn} style={btnStyle(false)}>✏️ Draw</button>
        </div>

        {/* Row 2 buttons (only in draw mode) */}
        {isDrawing && (
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={handleEraseLast} style={ghostStyle()}>Erase Last</button>
            <button type="button" onClick={handleAddArea} style={btnStyle(true)}>Add Area</button>
          </div>
        )}
      </div>

      {/* Radius pill */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-3 px-2.5 py-1.5 rounded-xl bg-white/90 text-xs border border-slate-200 shadow"
        style={{ zIndex: 1100 }}
      >
        Radius: {radiusMiles} mi {isDrawing ? '• Drawing mode' : ''}
      </div>
    </div>
  )
}

/* ---------- Markers ---------- */
function refreshMarkers(
  L: any,
  map: any,
  itemsIn: any[],
  layerRef: React.MutableRefObject<any>,
  selectedCategory?: string,
  opts?: { fit?: boolean }
) {
  const items = Array.isArray(itemsIn) ? itemsIn : []
  const shouldFit = opts?.fit ?? true

  try {
    if (layerRef.current) {
      layerRef.current.clearLayers?.()
      map.removeLayer?.(layerRef.current)
      layerRef.current = null
    }
  } catch {}

  const group = L.layerGroup()
  items.forEach((c: any) => {
    const lat = Number(c?.loc?.lat)
    const lng = Number(c?.loc?.lng)
    if (!isFinite(lat) || !isFinite(lng)) return

    const svcs: string[] = Array.isArray(c?.services) ? c.services : []
    const svc = selectedCategory && svcs.includes(selectedCategory) ? selectedCategory : svcs[0]
    const emoji = CAT_EMOJI[svc as keyof typeof CAT_EMOJI] ?? '🔧'

    const m = createPinMarker(L, map, [lat, lng], { emoji, data: c })
    m.addTo(group)
  })

  group.addTo(map)
  layerRef.current = group

  if (shouldFit) {
    const pts = group.getLayers().map((l: any) => l.getLatLng && l.getLatLng()).filter(Boolean)
    if (pts.length > 1) {
      const b = L.latLngBounds(pts)
      map.fitBounds(b, { padding: [24, 24], maxZoom: 13 })
    } else if (pts.length === 1) {
      map.setView(pts[0], 12, { animate: false })
    }
  }
}

/* ---------- Icon helpers ---------- */
function createPinMarker(
  L: any,
  map: any,
  latlng: [number, number],
  payload: { emoji: string; data: any }
) {
  const icon = makePinIcon(L, payload)
  const m = L.marker(latlng, { icon, riseOnHover: true }) as any
  ;(m as any)._al = { ...payload }
  ;(m as any)._map = map
  return m
}

function makePinIcon(L: any, opts: { emoji: string; data: any }) {
  const { emoji, data } = opts
  const bubble = 24
  const tipH = 8
  const tipW = 12
  const border = '#10b981'
  const fill = '#d1fae5'

  const imgSize = Math.floor(bubble * 0.7)
  const iconHeight = bubble + tipH + 2

  const name = escapeHtml(String(data?.name ?? 'Contractor'))
  const city = escapeHtml(String(data?.city ?? ''))

  const html = `
    <div style="position:relative; width:${bubble}px; height:${iconHeight}px;">
      <div class="al-pin-bubble" style="
        position:absolute; left:50%; top:0; transform:translateX(-50%);
        width:${bubble}px; height:${bubble}px; background:${fill};
        border:1.5px solid ${border}; border-radius:9999px;
        box-shadow:0 2px 4px rgba(0,0,0,.18); z-index:20;">
        <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
          width:${bubble}px; height:${bubble}px; display:flex; align-items:center; justify-content:center;">
          <div style="font-size:${imgSize}px; line-height:1;">${escapeHtml(emoji)}</div>
        </div>
      </div>
      <div style="
        position:absolute; left:50%; top:${bubble - 1}px; transform:translateX(-50%);
        width:0; height:0; border-left:${tipW/2 + 1}px solid transparent;
        border-right:${tipW/2 + 1}px solid transparent; border-top:${tipH + 2}px solid ${border};
        z-index:16;"></div>
      <div style="
        position:absolute; left:50%; top:${bubble}px; transform:translateX(-50%);
        width:0; height:0; border-left:${tipW/2}px solid transparent;
        border-right:${tipW/2}px solid transparent; border-top:${tipH}px solid ${fill};
        z-index:17;"></div>
    </div>
  `
  return L.divIcon({
    className: 'al-emoji-pin',
    html,
    iconSize: [bubble, iconHeight],
    iconAnchor: [Math.floor(bubble / 2), bubble + tipH + 2],
    popupAnchor: [0, -(bubble / 2)],
  })
}

/* ---------- Tiny UI helpers ---------- */
function btnStyle(primary = false): React.CSSProperties {
  return {
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
    background: primary ? '#10b981' : 'rgba(255,255,255,.95)',
    color: primary ? '#fff' : '#0f172a',
    border: primary ? '1px solid #10b981' : '1px solid rgba(15,23,42,.12)',
    boxShadow: '0 1px 3px rgba(2,6,23,.08)',
  }
}
function ghostStyle(): React.CSSProperties {
  return {
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
    background: '#fff',
    color: '#0f172a',
    border: '1px dashed rgba(15,23,42,.25)',
    boxShadow: '0 1px 3px rgba(2,6,23,.06)',
  }
}

/* ---------- utils ---------- */
function twemojiUrl(emoji: string) {
  const override: Record<string, string> = { '❄️': '2744' }
  const code = override[emoji] ?? toCodePoints(emoji).join('-')
  return `https://twemoji.maxcdn.com/v/latest/svg/${code}.svg`
}
function toCodePoints(str: string) {
  const cps: string[] = []
  for (const ch of Array.from(str)) cps.push(ch.codePointAt(0)!.toString(16))
  return cps
}
function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, m =>
    m === '&' ? '&amp;'
      : m === '<' ? '&lt;'
      : m === '>' ? '&gt;'
      : m === '"' ? '&quot;'
      : '&#39;'
  )
}
