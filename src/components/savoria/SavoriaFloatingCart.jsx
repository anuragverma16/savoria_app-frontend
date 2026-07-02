import { useLocation, useNavigate } from 'react-router-dom'
import { FiShoppingBag } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'

export default function SavoriaFloatingCart() {
  const { totals, paths } = useSavoriaGuest()
  const navigate = useNavigate()
  const location = useLocation()

  if (totals.itemCount === 0) return null
  if (location.pathname.includes('/cart') || location.pathname.includes('/checkout')) return null

  return (
    <button
      type="button"
      onClick={() => navigate(paths.cart)}
      className="sv-floating-cart"
      aria-label={`View cart, ${totals.itemCount} items`}
    >
      <FiShoppingBag size={22} />
      <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-[#1a1510] text-white text-xs font-bold flex items-center justify-center">
        {totals.itemCount}
      </span>
    </button>
  )
}
