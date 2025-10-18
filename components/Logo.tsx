// components/Logo.tsx
import * as React from 'react'

type Props = React.SVGProps<SVGSVGElement> & { title?: string }

export default function Logo({ className, title = 'Rushr', ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 280 32"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {/* Simple link mark (recolorable) */}
      <g fill="currentColor" transform="translate(2,4)">
        <path d="M20 2a6 6 0 0 0-8.49 0L7.3 6.21a6 6 0 0 0 0 8.49l.71.71a1.5 1.5 0 1 0 2.12-2.12l-.71-.71a3 3 0 0 1 0-4.24L13.63 4.8a3 3 0 0 1 4.24 0l.71.71A1.5 1.5 0 0 0 20.7 3.4L20 2z"/>
        <path d="M23.3 7.79a6 6 0 0 0-8.49 0l-.71.71a1.5 1.5 0 1 0 2.12 2.12l.71-.71a3 3 0 0 1 4.24 0l2.83 2.83a3 3 0 0 1 0 4.24l-.71.71a1.5 1.5 0 1 0 2.12 2.12l.71-.71a6 6 0 0 0 0-8.49L23.3 7.79z"/>
      </g>

      {/* Wordmark (uses system font; replace later with your exact path if you have one) */}
      <text
        x="48" y="22"
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji'"
        fontWeight="600"
        fontSize="18"
        fill="currentColor"
      >
        Rushr
      </text>
    </svg>
  )
}
