import { gsapPress } from '../../utils/gsapPress'

const COLOR_ACTIVE = {
  orange: 'bg-orange-500/35 border-orange-400/70 text-orange-50 shadow-md shadow-orange-500/25 ring-1 ring-orange-400/40',
  blue: 'bg-blue-500/35 border-blue-400/70 text-blue-50 shadow-md shadow-blue-500/25 ring-1 ring-blue-400/40',
  green: 'bg-green-500/35 border-green-400/70 text-green-50 shadow-md shadow-green-500/25 ring-1 ring-green-400/40',
  violet: 'bg-violet-500/30 border-violet-400/60 text-violet-100 shadow-md shadow-violet-500/20 ring-1 ring-violet-400/30',
  emerald: 'bg-emerald-500/30 border-emerald-400/60 text-emerald-100 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/30',
  amber: 'bg-amber-500/30 border-amber-400/60 text-amber-100 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/30',
  cyan: 'bg-cyan-500/30 border-cyan-400/60 text-cyan-100 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/30',
  red: 'bg-red-500/30 border-red-400/60 text-red-100 shadow-md shadow-red-500/20 ring-1 ring-red-400/30',
  tomato: 'bg-red-600/35 border-red-400/65 text-red-50 shadow-md shadow-red-600/25 ring-1 ring-red-400/40',
  gold: 'bg-amber-500/35 border-yellow-400/65 text-amber-50 shadow-md shadow-amber-500/25 ring-1 ring-yellow-400/40',
  slate: 'bg-zinc-700/50 border-zinc-500/50 text-zinc-100 shadow-md shadow-black/20',
}

const INACTIVE = {
  light: 'bg-white border-slate-200 text-slate-500 hover:border-[var(--df-accent)]/50 hover:text-slate-800 hover:bg-slate-50',
  dark: 'bg-black/40 border-white/10 text-white/45 hover:border-[var(--df-accent)]/40 hover:text-white/80 hover:bg-white/5',
}

export function ToggleButton({
  active,
  onClick,
  children,
  color = 'orange',
  variant = 'light',
  className = '',
  type = 'button',
  title,
}) {
  const handleClick = (e) => {
    gsapPress(e.currentTarget)
    onClick?.(e)
  }

  return (
    <button
      type={type}
      title={title}
      onClick={handleClick}
      className={`df-btn-press rounded-xl text-xs font-semibold border transition-all duration-200 ${
        active ? COLOR_ACTIVE[color] || COLOR_ACTIVE.orange : INACTIVE[variant] || INACTIVE.light
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function ToggleGroup({ children, className = '' }) {
  return <div className={`flex flex-wrap gap-2 ${className}`}>{children}</div>
}

export function StockToggle({ inStock, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl text-xs font-bold uppercase tracking-wide border transition-all duration-200 px-3 py-2 ${
        inStock
          ? 'bg-green-500/25 border-green-400/50 text-green-300 hover:bg-green-500/35'
          : 'bg-red-500/25 border-red-400/50 text-red-300 hover:bg-red-500/35'
      } ${className}`}
    >
      {inStock ? 'In Stock' : 'Out of Stock'}
    </button>
  )
}

export function StatusSwitch({ active, onClick, activeLabel = 'Active', inactiveLabel = 'Inactive' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
        active
          ? 'bg-green-500/25 border-green-400/50 text-green-300 hover:bg-green-500/35'
          : 'bg-black/40 border-white/10 text-white/50 hover:border-[var(--df-accent)]/40'
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </button>
  )
}
