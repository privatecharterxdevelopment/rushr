// app/api/geo/zips/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as turf from '@turf/turf'
import type { BBox, Feature, FeatureCollection, Geometry } from 'geojson'

/**
 * Replace this with a real source of ZCTA polygons:
 *  - PostGIS table
 *  - Static GeoJSON tileset / file (stream & filter by bbox)
 *  - External geo API
 *
 * NOTE: typed to return GeoJSON Features so TS is happy in callers.
 */
async function loadZctaPolys(_bbox?: BBox): Promise<Feature<Geometry>[]> {
  // TODO: query your DB or tiles by bbox for speed. Throw for now so you don’t forget.
  throw new Error('Wire me to a ZCTA dataset (Census TIGER/Line).')
}

export async function POST(req: NextRequest) {
  try {
    const { geometry } = await req.json()
    if (!geometry) return NextResponse.json({ zips: [] })

    // Normalize input to a FeatureCollection
    const fc: FeatureCollection =
      geometry?.type === 'FeatureCollection'
        ? (geometry as FeatureCollection)
        : turf.featureCollection([geometry as Feature]) as FeatureCollection

    // Compute bbox for efficient ZCTA query
    const bbox = turf.bbox(fc) as BBox

    // Load candidate ZCTAs intersecting the bbox
    const zctas: Feature<Geometry>[] = await loadZctaPolys(bbox)

    // Merge/dissolve incoming shapes (union) to reduce intersection checks
    const merged: Feature<Geometry> =
      fc.features.length > 1
        ? (fc.features as Feature<Geometry>[]).reduce((acc, f, i) =>
            i === 0 ? f : (turf.union(acc as any, f as any) as Feature<Geometry>)
          )
        : (fc.features[0] as Feature<Geometry>)

    // Intersect ZCTAs with merged geometry and collect ZIP codes
    const candidates: string[] = []
    for (const f of zctas) {
      try {
        if (turf.booleanIntersects(f as any, merged as any)) {
          const zip =
            (f.properties as any)?.ZCTA5CE10 ||
            (f.properties as any)?.ZIP ||
            (f.properties as any)?.ZCTA
          if (zip) candidates.push(String(zip))
        }
      } catch {
        // Skip malformed geometries safely
      }
    }

    // unique + sorted
    const zips = Array.from(new Set(candidates)).sort()
    return NextResponse.json({ zips })
  } catch (e: any) {
    return NextResponse.json(
      { zips: [], error: e?.message ?? 'zip-lookup-failed' },
      { status: 500 }
    )
  }
}
