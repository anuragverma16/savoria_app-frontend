import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import gsap from 'gsap'
import { FiMapPin } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'
import SavoriaSearchBar from '../../components/savoria/SavoriaSearchBar'
import SavoriaCategoryFilter from '../../components/savoria/SavoriaCategoryFilter'
import SavoriaFoodCard from '../../components/savoria/SavoriaFoodCard'
import SavoriaFoodDetailModal from '../../components/savoria/SavoriaFoodDetailModal'
import SavoriaStickyCartBar from '../../components/savoria/SavoriaStickyCartBar'
import OrderPanelActionBar from '../../components/savoria/OrderPanelActionBar'
import CustomerOrderSteps from '../../components/savoria/CustomerOrderSteps'
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
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SavoriaMenuPage() {
  const mainRef = useRef(null)
  const {
    restaurant,
    menuItems,
    categories,
    menuLoading,
    menuError,
    loadMenu,
    addToCart,
    isAuthenticated,
    userDisplayName,
  } = useSavoriaGuest()
  const { withQuery } = useOrderPanelQuery()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (menuItems || []).filter((item) => {
      const matchCat = category === 'all' || item.category === category
      const desc = (item.description || '').toLowerCase()
      const matchSearch = !q
        || (item.name || '').toLowerCase().includes(q)
        || desc.includes(q)
        || item.tags?.some((t) => String(t).toLowerCase().includes(q))
      return matchCat && matchSearch
    })
  }, [menuItems, search, category])

  useLayoutEffect(() => {
    const el = mainRef.current
    if (!el || menuLoading) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.sv-food-card'),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.42, stagger: 0.04, ease: 'power2.out' },
      )
    }, el)
    return () => ctx.revert()
  }, [filtered.length, menuLoading, category])

  const handleQuickAdd = (item) => {
    if (item.isAvailable === false) {
      toast.error(`${item.name} is currently unavailable`)
      return
    }
    if (addToCart(item, 1)) toast.success(`${item.name} added`)
  }

  return (
    <div className="sv-page pb-32 md:pb-8 min-h-full">
      <div className="sticky top-0 z-20 sv-glass border-b border-[var(--sv-border)]/60">
        <div className="max-w-4xl mx-auto px-4 py-4 md:px-6 space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            {restaurant.logo?.url ? (
              <OptimizedImage
                src={restaurant.logo.url}
                alt=""
                width={52}
                className="w-[3.25rem] h-[3.25rem] rounded-2xl object-cover shrink-0 border border-[var(--sv-border)] ring-2 ring-[var(--sv-accent)]/15"
              />
            ) : (
              <div className="w-[3.25rem] h-[3.25rem] rounded-2xl sv-glass flex items-center justify-center shrink-0 text-2xl ring-2 ring-[var(--sv-accent)]/10">🍽️</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--sv-text-muted)] mb-0.5">
                {isAuthenticated && userDisplayName ? `Hello, ${userDisplayName}` : 'Welcome'}
              </p>
              <h1 className="sv-display font-bold text-xl text-[var(--sv-text)] truncate leading-tight">
                {restaurant?.name || 'Menu'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {restaurant.tableNumber && (
                  <span className="sv-table-chip">
                    <FiMapPin size={11} />
                    Table {restaurant.tableNumber}
                  </span>
                )}
                {!isAuthenticated && (
                  <span className="text-[10px] font-medium text-[var(--sv-text-muted)]">
                    Browse freely · pay at checkout
                  </span>
                )}
              </div>
            </div>
          </div>

          <CustomerOrderSteps step={1} />
          <OrderPanelActionBar active="menu" />
          <SavoriaSearchBar value={search} onChange={setSearch} />
        </div>
      </div>

      <main ref={mainRef} className="px-4 md:px-6 py-5 max-w-4xl mx-auto">
        <div className="mb-5">
          <SavoriaCategoryFilter active={category} onChange={setCategory} categories={categories} />
        </div>

        {menuLoading ? (
          <MenuSkeleton />
        ) : menuError ? (
          <div className="text-center py-16 sv-glass rounded-2xl px-6">
            <p className="text-[var(--sv-text-muted)] mb-4">{menuError}</p>
            <button type="button" onClick={loadMenu} className="sv-btn-primary">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sv-empty-state sv-glass rounded-2xl">
            <div className="sv-empty-state-icon text-2xl">🔍</div>
            <p className="font-semibold text-[var(--sv-text)] mb-1">No dishes match</p>
            <p className="text-sm text-[var(--sv-text-muted)]">Try another category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>
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
