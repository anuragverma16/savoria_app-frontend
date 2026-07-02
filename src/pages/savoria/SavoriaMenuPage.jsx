import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiArrowLeft, FiShoppingBag } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import SavoriaSearchBar from '../../components/savoria/SavoriaSearchBar'
import SavoriaCategoryFilter from '../../components/savoria/SavoriaCategoryFilter'
import SavoriaFoodCard from '../../components/savoria/SavoriaFoodCard'
import SavoriaFoodDetailModal from '../../components/savoria/SavoriaFoodDetailModal'
import SavoriaStickyCartBar from '../../components/savoria/SavoriaStickyCartBar'
import OptimizedImage from '../../components/OptimizedImage'
import toast from 'react-hot-toast'

function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className="sv-food-card animate-pulse">
          <div className="aspect-[4/3] bg-[var(--sv-border)]/40" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-[var(--sv-border)]/40 rounded w-2/3" />
            <div className="h-3 bg-[var(--sv-border)]/30 rounded w-full" />
            <div className="h-3 bg-[var(--sv-border)]/30 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SavoriaMenuPage() {
  const navigate = useNavigate()
  const {
    restaurant,
    menuItems,
    categories,
    menuLoading,
    menuError,
    loadMenu,
    addToCart,
    totals,
    paths,
  } = useSavoriaGuest()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return menuItems.filter((item) => {
      const matchCat = category === 'all' || item.category === category
      const matchSearch = !q
        || item.name.toLowerCase().includes(q)
        || item.description.toLowerCase().includes(q)
        || item.tags?.some((t) => t.toLowerCase().includes(q))
      return matchCat && matchSearch
    })
  }, [menuItems, search, category])

  const handleQuickAdd = (item) => {
    if (item.isAvailable === false) {
      toast.error(`${item.name} is currently unavailable`)
      return
    }
    if (addToCart(item, 1)) {
      toast.success(`${item.name} added`)
    }
  }

  const handleCartClick = () => {
    navigate(paths.cart)
  }

  return (
    <div className="pb-32 md:pb-8">
      <header className="sticky top-0 z-20 sv-glass px-4 py-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigate(paths.orders)}
              className="sv-btn-ghost py-2 px-3"
            >
              <FiArrowLeft size={18} />
            </button>
            <div className="text-center flex-1 px-2">
              {restaurant.logo?.url && (
                <OptimizedImage
                  src={restaurant.logo.url}
                  alt=""
                  width={40}
                  className="w-10 h-10 rounded-full object-cover mx-auto mb-1 border border-[var(--sv-border)]"
                />
              )}
              <h1 className="sv-display font-bold text-lg text-[var(--sv-text)]">{restaurant.name}</h1>
              {restaurant.tableNumber && (
                <p className="text-xs text-[var(--sv-text-muted)]">Table {restaurant.tableNumber}</p>
              )}
              {restaurant.address?.city && (
                <p className="text-[10px] text-[var(--sv-text-muted)] mt-0.5">{restaurant.address.city}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleCartClick}
              className="relative sv-btn-ghost py-2 px-3"
            >
              <FiShoppingBag size={18} />
              {totals.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--sv-accent)] text-[#1a1510] text-xs font-bold flex items-center justify-center">
                  {totals.itemCount}
                </span>
              )}
            </button>
          </div>
          <SavoriaSearchBar value={search} onChange={setSearch} />
        </div>
      </header>

      <main className="px-4 md:px-6 py-5 max-w-4xl mx-auto">
        <div className="mb-5">
          <SavoriaCategoryFilter active={category} onChange={setCategory} categories={categories} />
        </div>

        {menuLoading ? (
          <MenuSkeleton />
        ) : menuError ? (
          <div className="text-center py-16">
            <p className="text-[var(--sv-text-muted)] mb-4">{menuError}</p>
            <button type="button" onClick={loadMenu} className="sv-btn-primary">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--sv-text-muted)]">No dishes found. Try another search or category.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <SavoriaFoodCard
                  key={item.id}
                  item={item}
                  onSelect={setSelectedItem}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <SavoriaStickyCartBar />
      <SavoriaFoodDetailModal
        item={selectedItem}
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onAdd={addToCart}
      />
    </div>
  )
}
