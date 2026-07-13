import { useState } from 'react'
import { motion } from 'framer-motion'
import OptimizedImage from '../OptimizedImage'
import { FiStar, FiPlus, FiMinus, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { GiChiliPepper } from 'react-icons/gi'
import { SV_INGREDIENT_CHIP_CLASS, SV_INGREDIENT_CHIP_CLASS_SM } from '../../data/menuCardGradients'
import { formatMenuRating } from '../../utils/menuRating'

export default function SavoriaFoodCard({
  item,
  cartQty = 0,
  onQuickAdd,
  onUpdateQty,
}) {
  const [showIngredients, setShowIngredients] = useState(false)
  const unavailable = item.isAvailable === false
  const hasIngredients = Boolean(item.ingredients?.length)
  const prepLabel = String(item.prepTime || '').includes('min') ? item.prepTime : `${item.prepTime} min`
  const ratingDisplay = item.hasReviews
    ? formatMenuRating(item.ratingAverage, item.ratingCount)
    : null

  const handleMinus = (e) => {
    e.stopPropagation()
    if (cartQty > 0) onUpdateQty?.(item, cartQty - 1)
  }

  const handlePlus = (e) => {
    e.stopPropagation()
    if (unavailable) return
    if (cartQty > 0) onUpdateQty?.(item, cartQty + 1)
    else onQuickAdd?.(item)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`sv-food-card group ${unavailable ? 'opacity-70' : ''} ${cartQty > 0 ? 'ring-1 ring-[var(--sv-accent)]/25' : ''}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden pointer-events-none select-none">
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
        {cartQty > 0 && (
          <span className="absolute top-3 right-3 min-w-[1.5rem] h-7 px-2 rounded-full bg-[var(--sv-accent)] text-[#1a1510] text-xs font-bold flex items-center justify-center shadow-md">
            {cartQty}
          </span>
        )}
        {item.spicy && !cartQty && (
          <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-500/90 flex items-center justify-center">
            <GiChiliPepper className="text-white" size={14} />
          </span>
        )}
        {item.spicy && cartQty > 0 && (
          <span className="absolute top-12 right-3 w-7 h-7 rounded-full bg-red-500/90 flex items-center justify-center">
            <GiChiliPepper className="text-white" size={14} />
          </span>
        )}
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
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-2 text-xs text-[var(--sv-text-muted)] min-w-0">
            {ratingDisplay?.hasReviews ? (
              <>
                <span className="flex items-center gap-0.5 text-amber-500 shrink-0">
                  <FiStar size={12} fill="currentColor" />
                  {ratingDisplay.label}
                </span>
                <span className="text-[10px] shrink-0">({ratingDisplay.count})</span>
                <span>·</span>
              </>
            ) : null}
            <span>{prepLabel}</span>
          </div>

          {!unavailable && (
            cartQty > 0 ? (
              <div
                className="flex items-center gap-0.5 bg-[var(--sv-accent-glow)] border border-[var(--sv-accent)]/30 rounded-xl p-0.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleMinus}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--sv-text)] hover:bg-[var(--sv-accent)]/15"
                  aria-label="Decrease quantity"
                >
                  <FiMinus size={15} />
                </button>
                <span className="w-7 text-center text-sm font-bold text-[var(--sv-accent)]">{cartQty}</span>
                <button
                  type="button"
                  onClick={handlePlus}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--sv-text)] hover:bg-[var(--sv-accent)]/15"
                  aria-label="Increase quantity"
                >
                  <FiPlus size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onQuickAdd?.(item) }}
                className="w-9 h-9 rounded-xl bg-[var(--sv-accent)] text-[#1a1510] flex items-center justify-center shrink-0 shadow-md hover:scale-105 transition-transform"
                aria-label={`Add ${item.name}`}
              >
                <FiPlus size={18} />
              </button>
            )
          )}
        </div>
      </div>
    </motion.article>
  )
}
