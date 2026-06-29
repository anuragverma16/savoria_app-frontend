import { FiMinus, FiPlus, FiX } from 'react-icons/fi'
import { menuItemImageUrl } from './UserMenuItemCard'

export default function CartLineItem({ item, onDecrease, onIncrease, onRemove, large = false }) {
  const lineTotal = (Number(item.price) || 0) * (Number(item.qty) || 1)

  return (
    <div className={`flex gap-4 rounded-2xl bg-white/[0.04] border border-white/8 hover:border-emerald-500/25 transition-colors ${
      large ? 'p-4 lg:p-5' : 'p-3'
    }`}>
      <div className={`relative shrink-0 rounded-xl overflow-hidden ring-1 ring-white/10 bg-slate-900 ${
        large ? 'w-24 h-24 lg:w-28 lg:h-28' : 'w-20 h-20 sm:w-24 sm:h-24'
      }`}>
        <img
          src={menuItemImageUrl(item)}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute bottom-1 right-1 min-w-[1.25rem] h-5 px-1 rounded-md bg-black/70 text-[10px] font-bold text-white flex items-center justify-center">
          ×{item.qty}
        </span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`font-semibold text-white leading-snug line-clamp-2 ${large ? 'text-base lg:text-lg' : 'text-sm sm:text-base'}`}>{item.name}</p>
            <p className={`text-emerald-400/90 font-medium mt-1 ${large ? 'text-sm lg:text-base' : 'text-xs sm:text-sm'}`}>₹{item.price} each</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-white/25 hover:text-red-400 p-1 -mt-0.5"
            aria-label="Remove item"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-black/30 rounded-xl p-1 border border-white/10">
            <button
              type="button"
              onClick={onDecrease}
              className={`rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 text-white ${
                large ? 'w-9 h-9' : 'w-8 h-8'
              }`}
              aria-label="Decrease quantity"
            >
              <FiMinus size={14} />
            </button>
            <span className={`font-bold text-white text-center tabular-nums ${large ? 'text-base w-8' : 'text-sm w-7'}`}>{item.qty}</span>
            <button
              type="button"
              onClick={onIncrease}
              className={`rounded-lg bg-emerald-500/25 text-emerald-300 flex items-center justify-center hover:bg-emerald-500/35 ${
                large ? 'w-9 h-9' : 'w-8 h-8'
              }`}
              aria-label="Increase quantity"
            >
              <FiPlus size={14} />
            </button>
          </div>
          <p className={`font-bold text-emerald-400 tabular-nums ${large ? 'text-lg lg:text-xl' : 'text-base sm:text-lg'}`}>₹{lineTotal}</p>
        </div>
      </div>
    </div>
  )
}
