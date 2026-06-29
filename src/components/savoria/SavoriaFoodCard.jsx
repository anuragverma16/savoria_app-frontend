import { motion } from 'framer-motion'
import { FiStar, FiPlus } from 'react-icons/fi'
import { GiChiliPepper } from 'react-icons/gi'

export default function SavoriaFoodCard({ item, onSelect, onQuickAdd }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="sv-food-card group cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {item.tags?.[0] && (
          <span className="absolute top-3 left-3 sv-badge">{item.tags[0]}</span>
        )}
        {item.spicy && (
          <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-500/90 flex items-center justify-center">
            <GiChiliPepper className="text-white" size={14} />
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onQuickAdd?.(item) }}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-[var(--sv-accent)] text-[#1a1510] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-lg"
          aria-label={`Add ${item.name}`}
        >
          <FiPlus size={18} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-[var(--sv-text)] leading-tight">{item.name}</h3>
          <span className="font-bold text-[var(--sv-accent)] whitespace-nowrap">₹{item.price}</span>
        </div>
        <p className="text-xs text-[var(--sv-text-muted)] line-clamp-2 mb-2">{item.description}</p>
        <div className="flex items-center gap-2 text-xs text-[var(--sv-text-muted)]">
          <span className="flex items-center gap-0.5 text-amber-500">
            <FiStar size={12} fill="currentColor" />
            {item.rating}
          </span>
          <span>·</span>
          <span>{item.prepTime} min</span>
        </div>
      </div>
    </motion.article>
  )
}
