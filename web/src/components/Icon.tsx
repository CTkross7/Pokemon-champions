import type { SVGProps } from 'react'

const PATHS = {
  home: (
    <>
      <path d="m3 10.6 9-6.85 9 6.85" />
      <path d="M5.5 9.2V20h4.6v-4.6a1.9 1.9 0 0 1 3.8 0V20h4.6V9.2" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.3c-1.6-1.4-3.7-1.9-6.5-1.9v13.4c2.8 0 4.9.5 6.5 1.9 1.6-1.4 3.7-1.9 6.5-1.9V4.4c-2.8 0-4.9.5-6.5 1.9Z" />
      <path d="M12 6.3v13.4" />
    </>
  ),
  calc: (
    <>
      <rect x="4.5" y="3" width="15" height="18" rx="2.5" />
      <path d="M8.2 7.4h7.6" />
      <path d="M8.2 12h.01M12 12h.01M15.8 12h.01M8.2 15.5h.01M12 15.5h.01M15.8 15.5h.01" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.2" r="3.4" />
      <path d="M3.4 19.4c.5-3 2.8-4.6 5.6-4.6s5.1 1.6 5.6 4.6" />
      <circle cx="16.8" cy="9.4" r="2.6" />
      <path d="M16.4 14.9c2.3.3 3.8 1.6 4.3 4" />
    </>
  ),
  zap: <path d="M13 2.5 4.8 13.3h6L9.6 21.5l8.6-11.2h-6L13 2.5Z" />,
  sparkles: (
    <>
      <path d="m12 3.5 1.8 4.9 4.9 1.8-4.9 1.8L12 16.9l-1.8-4.9-4.9-1.8 4.9-1.8L12 3.5Z" />
      <path d="m18.8 15.5.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 8.2h.01" />
      <path d="M12 11.4v4.6" />
    </>
  ),
  chevronRight: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20.4 14.2A8.6 8.6 0 0 1 9.8 3.6a8.6 8.6 0 1 0 10.6 10.6Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2" />
      <path d="M12 3.4a13.6 13.6 0 0 1 0 17.2 13.6 13.6 0 0 1 0-17.2Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.2 5 6v5.2c0 4.4 2.9 7.7 7 9.6 4.1-1.9 7-5.2 7-9.6V6l-7-2.8Z" />
      <path d="m9 11.8 2.2 2.2 3.8-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 12c0-.5-.1-1-.2-1.5l1.7-1.3-1.7-2.9-2 .8a6.6 6.6 0 0 0-2.6-1.5L12.1 3H9.9l-.3 2.6a6.6 6.6 0 0 0-2.6 1.5l-2-.8-1.7 2.9 1.7 1.3a6.7 6.7 0 0 0 0 3l-1.7 1.3 1.7 2.9 2-.8a6.6 6.6 0 0 0 2.6 1.5l.3 2.6h2.2l.3-2.6a6.6 6.6 0 0 0 2.6-1.5l2 .8 1.7-2.9-1.7-1.3c.1-.5.2-1 .2-1.5Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20c.6-3.7 3.5-5.6 7.5-5.6s6.9 1.9 7.5 5.6" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M4 20h16" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12.5" rx="2" />
      <path d="M8.5 20.5h7M12 16.5v4" />
    </>
  ),
  logout: (
    <>
      <path d="M14 5.5H6.5A1.5 1.5 0 0 0 5 7v10a1.5 1.5 0 0 0 1.5 1.5H14" />
      <path d="M17 8.5 20.5 12 17 15.5M20.5 12h-9" />
    </>
  ),
  bell: (
    <>
      <path d="M6.4 9.2a5.6 5.6 0 0 1 11.2 0c0 5 2.1 6.3 2.1 6.3H4.3s2.1-1.3 2.1-6.3Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  heart: <path d="M12 20.3 4.3 12.6a4.6 4.6 0 0 1 6.5-6.5l1.2 1.2 1.2-1.2a4.6 4.6 0 0 1 6.5 6.5Z" />,
  doc: (
    <>
      <path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M13 3v5h5M8.5 13h7M8.5 16.5h7" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-8.5 8.5" />
      <path d="M18 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5.5" />
    </>
  ),
  chat: (
    <path d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V16.5H4.5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a1 1 0 0 1 1-1h9" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  smartphone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.6" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
} as const

export type IconName = keyof typeof PATHS

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export default function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  )
}
