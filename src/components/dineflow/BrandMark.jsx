import SpoonLogo from './SpoonLogo'

const WRAP = {
  sm: 'p-1 rounded-xl',
  md: 'p-1.5 rounded-2xl',
  lg: 'p-2 rounded-2xl',
  xl: 'p-2.5 rounded-3xl',
}

export default function BrandMark({ size = 'md', className = '' }) {
  return (
    <div
      className={`lp-logo-wrap bg-gradient-to-br from-white/95 to-orange-50 shadow-lg shadow-orange-500/25 ring-1 ring-orange-200/60 ${WRAP[size] || WRAP.md} ${className}`}
    >
      <SpoonLogo size={size} />
    </div>
  )
}
