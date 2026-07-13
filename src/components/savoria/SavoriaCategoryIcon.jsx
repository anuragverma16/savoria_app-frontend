import SpoonLogo from '../dineflow/SpoonLogo'

/** Branded Savoria logo icon for menu category pills */
export default function SavoriaCategoryIcon({ size = 18, className = '' }) {
  return (
    <span className={`sv-category-icon ${className}`} aria-hidden>
      <SpoonLogo size={size} />
    </span>
  )
}
