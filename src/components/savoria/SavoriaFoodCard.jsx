import { useState } from 'react'
import { motion } from 'framer-motion'
import OptimizedImage from '../OptimizedImage'
import { FiStar, FiPlus, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { GiChiliPepper } from 'react-icons/gi'
import { SV_INGREDIENT_CHIP_CLASS, SV_INGREDIENT_CHIP_CLASS_SM } from '../../data/menuCardGradients'

export default function SavoriaFoodCard({ item, onSelect, onQuickAdd }) {
  const [showIngredients, setShowIngredients] = useState(false)
  const unavailable = item.isAvailable === false
  const hasIngredients = Boolean(item.ingredients?.length)
  const prepLabel = String(item.prepTime || '').includes('min') ? item.prepTime : `${item.prepTime} min`

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`sv-food-card group cursor-pointer ${unavailable ? 'opacity-70' : ''}`}
      onClick={() => onSelect(item)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <OptimizedImage
          src={item.image}
          alt={item.name}
          width={480}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {unavailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="sv-badge bg-red-500/90 text-white">Unavailable</span>
          </div>
        )}
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
          disabled={unavailable}
          onClick={(e) => { e.stopPropagation(); if (!unavailable) onQuickAdd?.(item) }}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[var(--sv-accent)] text-[#1a1510] flex items-center justify-center sv-quick-add opacity-100 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all shadow-lg"
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
        {item.description ? (
          <p className={`text-xs text-[var(--sv-text-muted)] mb-2 ${showIngredients ? '' : 'line-clamp-2'}`}>
            {item.description}
          </p>
        ) : null}
        {hasIngredients && !showIngredients && (
          <div className="flex flex-wrap gap-1 mb-2 max-h-5 overflow-hidden">
            {item.ingredients.slice(0, 4).map((ing) => (
              <span key={ing} className={SV_INGREDIENT_CHIP_CLASS_SM}>
                {ing}
              </span>
            ))}
            {item.ingredients.length > 4 && (
              <span className="text-[9px] text-[var(--sv-text-muted)]">+{item.ingredients.length - 4}</span>
            )}
          </div>
        )}
        {hasIngredients && (
          <div className="mb-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowIngredients((v) => !v)
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--sv-accent)] hover:underline"
            >
              {showIngredients ? (
                <>View less <FiChevronUp size={14} /></>
              ) : (
                <>View more · ingredients <FiChevronDown size={14} /></>
              )}
            </button>
            {showIngredients && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2"
              >
                <ul className="flex flex-wrap gap-1.5">
                  {item.ingredients.map((ing) => (
                    <li key={ing} className={SV_INGREDIENT_CHIP_CLASS}>
                      {ing}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-[var(--sv-text-muted)]">
          <span className="flex items-center gap-0.5 text-amber-500">
            <FiStar size={12} fill="currentColor" />
            {item.rating}
          </span>
          <span>·</span>
          <span>{prepLabel}</span>
        </div>
      </div>
    </motion.article>
  )
}
