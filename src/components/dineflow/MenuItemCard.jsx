import { FiPlus } from 'react-icons/fi'
import { FaLeaf } from 'react-icons/fa'
import { formatPortionSize } from '../../utils/portionSize'
import OptimizedImage from '../OptimizedImage'
import { IMAGE_FALLBACK } from '../../utils/optimizeImageUrl'

export function itemPrice(item) {
  return item.price - (item.price * (item.discount || 0) / 100)
}

export default function MenuItemCard({ item, onAdd, compact = false, layout = 'horizontal' }) {
  const inStock = item.isAvailable !== false
  const price = itemPrice(item)
  const portionLabel = formatPortionSize(item)
  const imgSize = compact ? 'w-16 h-16' : 'w-20 h-20'

  const cardCls = `relative flex gap-3 rounded-2xl border transition-colors ${
    compact ? 'p-4' : 'p-3 sm:p-4'
  } ${
    inStock
      ? 'bg-white/5 border-white/10 hover:border-emerald-500/20'
      : 'bg-white/[0.03] border-red-500/25 opacity-90'
  } ${layout === 'vertical' ? 'flex-col' : ''}`

  return (
    <div className={cardCls}>
      {!inStock && (
        <span className="absolute top-3 right-3 z-10 text-[9px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
          Out of Stock
        </span>
      )}

      <div className={`relative shrink-0 ${imgSize} rounded-xl overflow-hidden bg-white/5`}>
        <OptimizedImage
          src={item.image?.url || IMAGE_FALLBACK}
          alt={item.name}
          width={compact ? 128 : 160}
          quality={65}
          className={`w-full h-full object-cover ${!inStock ? 'grayscale-[0.6]' : ''}`}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2 pr-16">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-medium truncate ${compact ? 'text-sm' : 'text-sm sm:text-base'}`}>{item.name}</h3>
              {item.isVeg && <FaLeaf className="text-green-400 shrink-0" size={12} />}
            </div>
            {item.isVeg === false && (
              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Non-veg</span>
            )}
          </div>
        </div>

        <p className={`text-white/40 line-clamp-2 mt-1 ${compact ? 'text-xs' : 'text-xs'}`}>{item.description}</p>
        {portionLabel && (
          <p className="text-white/50 text-[11px] mt-1 font-medium">{portionLabel}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className={`font-semibold ${inStock ? 'text-emerald-400' : 'text-white/40'} ${compact ? 'text-sm' : 'text-sm'}`}>
            ₹{price}
          </span>
          {onAdd && inStock ? (
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors"
              aria-label={`Add ${item.name}`}
            >
              <FiPlus size={16} />
            </button>
          ) : onAdd && !inStock ? (
            <span className="text-[10px] text-red-400/80 font-medium">Unavailable</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
