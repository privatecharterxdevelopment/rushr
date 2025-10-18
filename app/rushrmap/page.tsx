'use client'

import ProMapExplorer from '../../components/ProMapExplorer'

export default function RushrMapPage() {
  return (
    <div className="w-full overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      <ProMapExplorer />
    </div>
  )
}
