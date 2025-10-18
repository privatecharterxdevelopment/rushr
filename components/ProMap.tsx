'use client'
import dynamic from 'next/dynamic'

type Props = {
  centerZip: string
  category?: string
  radiusMiles: number
  searchCenter?: [number, number]
  onSearchHere?: (center:[number,number]) => void
}

const ProMapInner = dynamic(() => import('./ProMapInner'), { ssr: false })

export default function ProMap(props: Props){
  return <ProMapInner {...props} />
}
