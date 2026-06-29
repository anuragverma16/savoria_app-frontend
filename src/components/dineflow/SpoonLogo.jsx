const SIZES = {
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
}

export default function SpoonLogo({ size = 'md', className = '' }) {
  const px = typeof size === 'number' ? size : SIZES[size] || SIZES.md

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`lp-spoon-logo shrink-0 ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="spoonGradA" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="0.45" stopColor="#f97316" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="spoonGradB" x1="56" y1="4" x2="8" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#22c55e" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
        <filter id="spoonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#f97316" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#spoonGradA)" opacity="0.12" />
      <circle cx="32" cy="32" r="30" stroke="url(#spoonGradA)" strokeWidth="1.5" opacity="0.35" />
      {/* Left spoon */}
      <g filter="url(#spoonGlow)" transform="rotate(-28 32 32)">
        <ellipse cx="32" cy="14" rx="5.5" ry="7" fill="url(#spoonGradA)" />
        <path
          d="M28 20 C27 28 26.5 38 27 48 C27.5 54 30 58 32 58 C34 58 36.5 54 37 48 C37.5 38 37 28 36 20 Z"
          fill="url(#spoonGradA)"
        />
        <path d="M30 22 C31 32 31 42 32 52" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.35" strokeLinecap="round" />
      </g>
      {/* Right spoon */}
      <g filter="url(#spoonGlow)" transform="rotate(28 32 32)">
        <ellipse cx="32" cy="14" rx="5.5" ry="7" fill="url(#spoonGradB)" />
        <path
          d="M28 20 C27 28 26.5 38 27 48 C27.5 54 30 58 32 58 C34 58 36.5 54 37 48 C37.5 38 37 28 36 20 Z"
          fill="url(#spoonGradB)"
        />
        <path d="M30 22 C31 32 31 42 32 52" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.35" strokeLinecap="round" />
      </g>
    </svg>
  )
}
