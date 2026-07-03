import { FiPlus, FiMinus, FiLock } from 'react-icons/fi'
import { FaLeaf } from 'react-icons/fa'
import { itemPrice } from './MenuItemCard'
import { formatPortionSize } from '../../utils/portionSize'
import OptimizedImage from '../OptimizedImage'
import { IMAGE_FALLBACK } from '../../utils/optimizeImageUrl'

export const MENU_FALLBACK_IMG = IMAGE_FALLBACK

export function menuItemImageUrl(item) {
  if (!item) return MENU_FALLBACK_IMG
  if (typeof item.image === 'string' && item.image) return item.image
  return item.image?.url || MENU_FALLBACK_IMG
}

export default function UserMenuItemCard({
  item,
  onAdd,
  onUpdateQty,
  cartQty = 0,
  compact = false,
  variant,
  showActions = true,
  orderLocked = false,
  onOrderLocked,
}) {
  const cardVariant = variant || (compact ? 'compact' : 'default')
  const inStock = item.isAvailable !== false
  const price = itemPrice(item)
  const imageUrl = menuItemImageUrl(item)
  const portionLabel = formatPortionSize(item)

  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (orderLocked) {
      onOrderLocked?.()
      return
    }
    if (inStock && onAdd) onAdd(item)
  }

  const handleMinus = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onUpdateQty) onUpdateQty(item, cartQty - 1)
  }

  const handlePlus = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (orderLocked) {
      onOrderLocked?.()
      return
    }
    if (!inStock) return
    if (cartQty > 0 && onUpdateQty) onUpdateQty(item, cartQty + 1)
    else if (onAdd) onAdd(item)
  }

  const qtyControls = !inStock ? (
    <span className="text-[10px] text-red-400/80 font-medium px-2">N/A</span>
  ) : orderLocked ? (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOrderLocked?.() }}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white/60 border border-white/10"
    >
      <FiLock size={12} />
      Scan QR
    </button>
  ) : cartQty > 0 ? (
    <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/25 rounded-lg p-0.5">
      <button
        type="button"
        onClick={handleMinus}
        className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-white hover:bg-white/10"
        aria-label="Decrease quantity"
      >
        <FiMinus size={13} />
      </button>
      <span className="text-sm font-bold text-emerald-300 w-5 text-center tabular-nums">{cartQty}</span>
      <button
        type="button"
        onClick={handlePlus}
        className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-400"
        aria-label="Increase quantity"
      >
        <FiPlus size={13} strokeWidth={2.5} />
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={handleAdd}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-400 active:scale-95 transition-all shadow-sm shadow-emerald-500/20"
      aria-label={`Add ${item.name}`}
    >
      <FiPlus size={14} strokeWidth={2.5} />
      Add
    </button>
  )

  if (cardVariant === 'featured' || cardVariant === 'popular') {
    const isPopular = cardVariant === 'popular'
    return (
      <div
        className={`user-menu-card group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 ${
          isPopular ? 'h-[360px] w-full' : ''
        } ${
          inStock
            ? 'bg-white/[0.04] border-white/10 hover:border-emerald-500/35 hover:shadow-lg hover:shadow-emerald-500/10'
            : 'bg-white/[0.02] border-red-500/20 opacity-85'
        }`}
      >
        <div className={`relative overflow-hidden bg-slate-900 shrink-0 ${isPopular ? 'h-[200px]' : 'aspect-[5/4]'}`}>
          <OptimizedImage
            src={imageUrl}
            alt={item.name}
            width={isPopular ? 400 : 320}
            quality={65}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!inStock ? 'grayscale' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          {item.isVeg && (
            <span className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-white/95 flex items-center justify-center shadow-md">
              <FaLeaf className="text-emerald-600" size={14} />
            </span>
          )}
          {isPopular && item.orderCount > 0 && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-amber-500/95 text-[10px] font-bold text-white">
              {item.orderCount} ordered
            </span>
          )}
          {!inStock && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-red-500/90 text-[10px] font-bold uppercase text-white">
              Sold out
            </span>
          )}
          {!isPopular && (
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="font-bold text-white text-lg leading-tight drop-shadow-sm line-clamp-2">{item.name}</h3>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1 min-h-0">
          {isPopular && (
            <h3 className="font-bold text-white text-base leading-snug line-clamp-2 mb-1.5">{item.name}</h3>
          )}
          {item.description && (
            <p className="text-white/45 text-sm leading-relaxed line-clamp-2 mb-2">{item.description}</p>
          )}
          {portionLabel && (
            <p className="text-white/50 text-xs mb-2">{portionLabel}</p>
          )}
          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-xl font-bold text-emerald-400">₹{price}</p>
              {(item.discount || 0) > 0 && (
                <p className="text-white/30 text-xs line-through">₹{item.price}</p>
              )}
            </div>
            {showActions ? qtyControls : (
              <span className="text-xs font-semibold text-emerald-400/80">View menu →</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  const imgCls = cardVariant === 'compact' ? 'w-14 h-14' : 'w-[88px] h-[88px] sm:w-[96px] sm:h-[96px]'

  return (
    <div
      className={`user-menu-card flex items-center gap-3 sm:gap-4 rounded-xl border transition-colors ${
        cardVariant === 'compact' ? 'p-2.5' : 'p-3 sm:p-3.5'
      } ${
        inStock
          ? 'bg-white/[0.04] border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.05]'
          : 'bg-white/[0.02] border-red-500/20 opacity-80'
      }`}
    >
      <div className={`relative shrink-0 ${imgCls} rounded-xl overflow-hidden ring-1 ring-white/10 bg-slate-900`}>
        <OptimizedImage
          src={imageUrl}
          alt={item.name}
          width={cardVariant === 'compact' ? 128 : 160}
          quality={65}
          className={`w-full h-full object-cover ${!inStock ? 'grayscale' : ''}`}
        />
        {!inStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[8px] font-bold uppercase text-red-200 text-center px-0.5">
            Sold out
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className={`font-semibold text-white truncate ${cardVariant === 'compact' ? 'text-xs' : 'text-base'}`}>
            {item.name}
          </h3>
          {item.isVeg && <FaLeaf className="text-emerald-400 shrink-0" size={12} />}
        </div>
        {cardVariant !== 'compact' && item.description && (
          <p className="text-white/40 text-xs sm:text-sm mt-1 line-clamp-2">{item.description}</p>
        )}
        {portionLabel && (
          <p className="text-white/45 text-[11px] sm:text-xs mt-1 font-medium">{portionLabel}</p>
        )}
        <p className={`font-bold text-emerald-400 mt-1.5 ${cardVariant === 'compact' ? 'text-xs' : 'text-base'}`}>
          ₹{price}
          {(item.discount || 0) > 0 && (
            <span className="text-white/30 text-[10px] font-normal line-through ml-1.5">₹{item.price}</span>
          )}
        </p>
      </div>

      <div className="shrink-0">
        {showActions ? qtyControls : (
          <span className="text-[11px] font-semibold text-emerald-400/70">View</span>
        )}
      </div>
    </div>
  )
}
