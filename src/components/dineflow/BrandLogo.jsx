export default function BrandLogo({ className = 'text-lg', accentClass = 'text-orange-500', showSaas = true }) {
  return (
    <span className={`lp-brand-title font-bold leading-none ${className}`}>
      <span className="tracking-tight">Savoria</span>
      {showSaas && (
        <span className={`lp-brand-saas ml-1.5 ${accentClass}`}>SaaS</span>
      )}
    </span>
  )
}
