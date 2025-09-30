// components/DrawCoverage.tsx
'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import * as turf from '@turf/turf'

type Props = {
  title?: string
  initialCenter?: [number, number]            // [lng, lat]
  initialZoom?: number
  onChange?: (stats: { areaSqKm: number; perimeterKm: number; count: number }) => void
  onSave?: (result: { geojson: GeoJSON.FeatureCollection }) => void
  onClose?: () => void
}

export default function DrawCoverage({
  title = 'Draw search area',
  initialCenter = [-74.006, 40.7128],
  initialZoom = 11,
  onChange,
  onSave,
  onClose,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: initialCenter,
      zoom: initialZoom,
    })
    mapRef.current = map

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
    })
    drawRef.current = draw
    // Cast to MapLibre's IControl to satisfy TS
    map.addControl(draw as unknown as maplibregl.IControl, 'top-left')

    const update = () => {
      if (!drawRef.current) return
      const data = drawRef.current.getAll() as GeoJSON.FeatureCollection
      setGeojson(data)

      if (onChange) {
        let area = 0
        let perim = 0
        for (const f of data.features) {
          try {
            area += turf.area(f as any) / 1_000_000 // m² → km²
            const line = turf.polygonToLine(f as any)
            perim += turf.length(line as any, { units: 'kilometers' })
          } catch { /* ignore */ }
        }
        onChange({
          areaSqKm: Math.round(area * 100) / 100,
          perimeterKm: Math.round(perim * 100) / 100,
          count: data.features.length,
        })
      }
    }

    map.on('draw.create', update)
    map.on('draw.update', update)
    map.on('draw.delete', update)

    // Ensure proper sizing after mount
    setTimeout(() => map.resize(), 0)

    return () => {
      try {
        map.off('draw.create', update)
        map.off('draw.update', update)
        map.off('draw.delete', update)
        try { map.removeControl(draw as unknown as maplibregl.IControl) } catch {}
        map.remove()
      } catch {}
      mapRef.current = null
      drawRef.current = null
    }
  }, [initialCenter, initialZoom, onChange])

  // Render the modal into a portal so it sits above Leaflet (or anything else)
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/35"
        style={{ zIndex: 100000 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-start justify-center p-3 sm:p-6"
        style={{ zIndex: 100001 }}
      >
        <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div ref={mapContainerRef} className="h-[420px] w-full" />

          <div className="flex items-center gap-2 border-t px-4 py-2">
            <button
              onClick={() => {
                if (geojson && onSave) onSave({ geojson })
                onClose?.()
              }}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white"
            >
              Save
            </button>
            <button
              onClick={() => {
                if (drawRef.current) {
                  drawRef.current.deleteAll()
                  setGeojson(null)
                }
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Safety: make sure any embedded MapLibre controls within this modal sit above page maps */}
      <style>{`
        .maplibregl-control-container { z-index: 100002; }
      `}</style>
    </>,
    document.body
  )
}
