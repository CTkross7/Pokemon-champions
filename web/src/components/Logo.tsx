export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dcfc51" />
          <stop offset="100%" stopColor="#b8db10" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="19" fill="url(#logo-bg)" />
      <circle cx="32" cy="32" r="16.5" fill="none" stroke="#0a0a0a" strokeWidth="4.5" />
      <path d="M15.5 32H26" stroke="#0a0a0a" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M38 32h10.5" stroke="#0a0a0a" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="5.5" fill="#0a0a0a" />
    </svg>
  )
}
