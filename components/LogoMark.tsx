import * as React from 'react'

export default function LogoMark({
  className,
  title = 'Rushr',
}: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 804 611"  // matches your PNG dimensions
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id="al-mark-mask" maskUnits="userSpaceOnUse">
          <image href="/housecall-logo.png" width="804" height="611" />
        </mask>
      </defs>
      <rect width="804" height="611" fill="currentColor" mask="url(#al-mark-mask)" />
    </svg>
  )
}
