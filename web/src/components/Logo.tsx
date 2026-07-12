export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#26262b" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="19" fill="url(#logo-bg)" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="18.25" fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="16.5" fill="none" stroke="#fff" strokeWidth="4.5" />
      <path d="M15.5 32H26" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M38 32h10.5" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="5.5" fill="#fff" />
    </svg>
  )
}
