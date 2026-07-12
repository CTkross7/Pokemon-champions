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
