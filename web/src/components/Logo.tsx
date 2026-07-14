export default function Logo({ size = 34 }: { size?: number }) {
  // Uses the shipped app icon (embeds the provided artwork) so the in-app
  // brand mark matches the favicon / PWA / social-preview icons exactly.
  return (
    <img
      src="/favicon.svg"
      width={size}
      height={size}
      alt="챔스노트"
      aria-hidden="true"
      style={{ display: 'block', borderRadius: size * 0.28 }}
    />
  )
}
