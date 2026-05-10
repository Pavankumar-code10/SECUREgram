export function Logo({ size = 64 }: { size?: number }) {
  return (
    <div
      className="relative inline-flex items-center justify-center rounded-3xl gradient-primary shadow-elev"
      style={{ width: size, height: size }}
      aria-label="SecureGram logo"
    >
      <svg viewBox="0 0 64 64" width={size * 0.62} height={size * 0.62} fill="none">
        <path
          d="M32 6 L52 14 V32 C52 44 42 54 32 58 C22 54 12 44 12 32 V14 Z"
          fill="oklch(1 0 0 / 0.18)"
          stroke="white"
          strokeWidth="2.5"
        />
        <path
          d="M32 22 C26 28 24 36 30 44 C36 38 38 30 32 22 Z"
          fill="white"
        />
        <circle cx="32" cy="44" r="2.2" fill="white" />
      </svg>
    </div>
  );
}
