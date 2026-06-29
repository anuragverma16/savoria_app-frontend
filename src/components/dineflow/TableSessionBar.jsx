import { Link } from 'react-router-dom'
import { FiLink, FiRefreshCw } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { buildUserTablesPath } from '../../utils/tableQueryParams'

export default function TableSessionBar({ restaurantId, tableNumber, tableLabel, className = '' }) {
  if (!restaurantId || !tableNumber) return null

  const tablesPath = `${buildUserTablesPath(restaurantId)}?change=1`
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`sticky top-0 z-30 px-4 py-3 border-b border-emerald-500/20 bg-slate-950/85 backdrop-blur-xl ${className}`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30">
            <FiLink className="text-emerald-400" size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">
              Table #{tableNumber}
              {tableLabel && tableLabel !== String(tableNumber) ? (
                <span className="text-white/40 font-normal ml-1.5">· {tableLabel}</span>
              ) : null}
            </p>
            <p className="text-emerald-400/70 text-[10px] uppercase tracking-widest font-semibold">
              Dine-in session active
            </p>
          </div>
        </div>
        <Link
          to={tablesPath}
          className="inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-200 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
        >
          <FiRefreshCw size={12} /> Change table
        </Link>
      </div>
    </motion.div>
  )
}
