import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import {
  FiShoppingBag, FiClock, FiArrowRight, FiMapPin, FiPackage, FiUser, FiPlus, FiStar,
} from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../../hooks/useOrderPanelQuery'
import SavoriaQrScanModal from '../../components/savoria/SavoriaQrScanModal'
import SavoriaBrandedQrScanCard from '../../components/savoria/SavoriaBrandedQrScanCard'
import SavoriaCategoryFilter from '../../components/savoria/SavoriaCategoryFilter'
import SavoriaFoodDetailModal from '../../components/savoria/SavoriaFoodDetailModal'
import SavoriaStickyCartBar from '../../components/savoria/SavoriaStickyCartBar'
import SavoriaOrderTracker from '../../components/savoria/SavoriaOrderTracker'
import OptimizedImage from '../../components/OptimizedImage'

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'accepted', 'preparing', 'ready'])

function MenuSkeleton() {
  return (
    <div className="sv-dash-menu-grid">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className="sv-dash-menu-card animate-pulse">
          <div className="sv-dash-menu-card__img bg-[var(--sv-border)]/40" />
          <div className="sv-dash-menu-card__body space-y-2">
            <div className="h-3.5 bg-[var(--sv-border)]/40 rounded w-3/4" />
            <div className="h-3 bg-[var(--sv-border)]/30 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SavoriaUserDashboard() {
  const navigate = useNavigate()
  const {
    restaurant,
    session,
    totals,
    orders,
    isAuthenticated,
    userDisplayName,
    refreshSession,
    paths,
    menuItems,
    categories,
    menuLoading,
    menuError,
    loadMenu,
    addToCart,
  } = useSavoriaGuest()
  const { withQuery } = useOrderPanelQuery()
  const [scanOpen, setScanOpen] = useState(false)
  const [category, setCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const heroRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(heroRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55 })
      .fromTo(contentRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45 }, '-=0.25')
  }, [])

  const hasTable = Boolean(session.qrLinked || session.tableToken || session.tableId)
  const menuPath = withQuery(paths.menu)
  const cartPath = withQuery(paths.cart)
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.has(o.status))
  const latestActive = activeOrders[0]

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => (
      category === 'all' || item.category === category
    ))
  }, [menuItems, category])

  const availableCount = useMemo(
    () => menuItems.filter((i) => i.isAvailable !== false).length,
    [menuItems],
  )

  const handleQuickAdd = (item) => {
    if (item.isAvailable === false) {
      toast.error(`${item.name} is unavailable`)
      return
    }
    if (addToCart(item, 1)) {
      toast.success(`${item.name} added`)
    }
  }

  return (
    <div className="sv-user-dashboard pb-28 md:pb-10">
      <div ref={heroRef} className="sv-dash-hero">
        <div className="sv-dash-hero__inner">
          <div className="sv-dash-hero__brand">
            {restaurant?.logo?.url ? (
              <OptimizedImage
                src={restaurant.logo.url}
                alt=""
                width={72}
                className="sv-dash-hero__logo"
              />
            ) : (
              <div className="sv-dash-hero__logo sv-dash-hero__logo--placeholder">
                {(restaurant?.name || 'S').charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="sv-badge mb-2 inline-block">
                {isAuthenticated ? 'Member' : 'Guest'}
              </span>
              <h1 className="sv-display text-2xl sm:text-3xl font-bold text-[var(--sv-text)] leading-tight">
                {isAuthenticated ? `Hello, ${userDisplayName}` : 'Welcome'}
              </h1>
              <p className="text-sm text-[var(--sv-text-muted)] mt-1">
                {hasTable
                  ? `Ordering at ${restaurant?.name || session.restaurantName || 'your table'}`
                  : 'Scan your table QR to open the menu'}
              </p>
            </div>
          </div>

          {hasTable && (
            <div className="sv-dash-hero__meta">
              <div className="sv-dash-chip">
                <FiMapPin size={14} />
                <span>Table {restaurant?.tableNumber || session.tableNumber || '—'}</span>
              </div>
              {restaurant?.address?.city && (
                <div className="sv-dash-chip">
                  <span>{restaurant.address.city}</span>
                </div>
              )}
              <div className="sv-dash-chip sv-dash-chip--accent">
                <FiShoppingBag size={14} />
                <span>{availableCount} dishes</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div ref={contentRef} className="sv-dash-content max-w-6xl mx-auto px-4 sm:px-6">
        {!hasTable && (
          <div className="mb-6">
            <SavoriaBrandedQrScanCard
              restaurantName={restaurant?.name || 'Savoria'}
              hint="Tap to scan your table QR"
              onClick={() => setScanOpen(true)}
            />
          </div>
        )}

        <div className="sv-dash-stats">
          <button type="button" onClick={() => navigate(hasTable ? menuPath : '/scan')} className="sv-dash-stat">
            <FiShoppingBag className="text-[var(--sv-accent)]" size={20} />
            <div>
              <p className="sv-dash-stat__label">Cart</p>
              <p className="sv-dash-stat__value">{totals.itemCount} · ₹{totals.total}</p>
            </div>
          </button>
          <button type="button" onClick={() => navigate(withQuery('/order/active'))} className="sv-dash-stat">
            <FiPackage className="text-[var(--sv-accent)]" size={20} />
            <div>
              <p className="sv-dash-stat__label">Active</p>
              <p className="sv-dash-stat__value">{activeOrders.length} orders</p>
            </div>
          </button>
          <button type="button" onClick={() => navigate(withQuery('/order/history'))} className="sv-dash-stat">
            <FiClock className="text-[var(--sv-accent)]" size={20} />
            <div>
              <p className="sv-dash-stat__label">History</p>
              <p className="sv-dash-stat__value">{orders.length} total</p>
            </div>
          </button>
          <button type="button" onClick={() => navigate(withQuery('/order/settings'))} className="sv-dash-stat">
            <FiUser className="text-[var(--sv-accent)]" size={20} />
            <div>
              <p className="sv-dash-stat__label">Profile</p>
              <p className="sv-dash-stat__value">Settings</p>
            </div>
          </button>
        </div>

        {latestActive && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="sv-dash-section-title">Live order</h2>
              <button
                type="button"
                onClick={() => navigate(withQuery('/order/active'))}
                className="text-xs font-semibold text-[var(--sv-accent)] inline-flex items-center gap-1"
              >
                View all <FiArrowRight size={14} />
              </button>
            </div>
            <SavoriaOrderTracker order={latestActive} live />
          </section>
        )}

        {hasTable && (
          <section className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="sv-dash-section-title">Menu</h2>
                <p className="text-xs text-[var(--sv-text-muted)] mt-0.5">
                  Real dishes from {restaurant?.name || 'this restaurant'} — add to cart without signing in
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(menuPath)}
                className="sv-btn-primary text-sm py-2.5 px-5 self-start sm:self-auto"
              >
                Full menu <FiArrowRight size={16} />
              </button>
            </div>

            <div className="mb-4">
              <SavoriaCategoryFilter active={category} onChange={setCategory} categories={categories} />
            </div>

            {menuLoading ? (
              <MenuSkeleton />
            ) : menuError ? (
              <div className="sv-glass rounded-2xl p-8 text-center">
                <p className="text-[var(--sv-text-muted)] mb-4">{menuError}</p>
                <button type="button" onClick={loadMenu} className="sv-btn-primary">
                  Retry
                </button>
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="sv-glass rounded-2xl p-8 text-center text-[var(--sv-text-muted)] text-sm">
                No dishes in this category yet.
              </div>
            ) : (
              <div className="sv-dash-menu-grid">
                {filteredMenu.map((item) => {
                  const unavailable = item.isAvailable === false
                  return (
                    <article
                      key={item.id}
                      className={`sv-dash-menu-card group ${unavailable ? 'is-unavailable' : ''}`}
                      onClick={() => setSelectedItem(item)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedItem(item)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="sv-dash-menu-card__img-wrap">
                        <OptimizedImage
                          src={item.image}
                          alt={item.name}
                          width={320}
                          className="sv-dash-menu-card__img"
                        />
                        {unavailable && (
                          <span className="sv-dash-menu-card__badge">Sold out</span>
                        )}
                        {!unavailable && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleQuickAdd(item) }}
                            className="sv-dash-menu-card__add"
                            aria-label={`Add ${item.name}`}
                          >
                            <FiPlus size={16} />
                          </button>
                        )}
                      </div>
                      <div className="sv-dash-menu-card__body">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm text-[var(--sv-text)] leading-snug line-clamp-2">
                            {item.name}
                          </h3>
                          <span className="font-bold text-sm text-[var(--sv-accent)] shrink-0">₹{item.price}</span>
                        </div>
                        <p className="text-[11px] text-[var(--sv-text-muted)] line-clamp-2 mt-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--sv-text-muted)]">
                          <span className="inline-flex items-center gap-0.5 text-amber-500">
                            <FiStar size={10} fill="currentColor" />
                            {item.rating}
                          </span>
                          <span>·</span>
                          <span>{item.prepTime} min</span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {filteredMenu.length > 0 && (
              <button
                type="button"
                onClick={() => navigate(menuPath)}
                className="w-full mt-5 sv-glass rounded-2xl py-4 text-sm font-semibold text-[var(--sv-text)] hover:border-[var(--sv-accent)] transition-colors inline-flex items-center justify-center gap-2"
              >
                Browse full menu with search
                <FiArrowRight className="text-[var(--sv-accent)]" />
              </button>
            )}
          </section>
        )}

        {totals.itemCount > 0 && (
          <button
            type="button"
            onClick={() => navigate(cartPath)}
            className="hidden md:flex w-full sv-glass rounded-2xl p-4 items-center justify-between hover:border-[var(--sv-accent)] transition-colors mb-6"
          >
            <div className="text-left">
              <p className="font-semibold text-[var(--sv-text)]">Ready to checkout?</p>
              <p className="text-xs text-[var(--sv-text-muted)]">
                {totals.itemCount} items · ₹{totals.total} — sign in only when you pay
              </p>
            </div>
            <span className="sv-btn-primary text-sm py-2 px-5">View cart</span>
          </button>
        )}
      </div>

      <SavoriaStickyCartBar />
      <SavoriaFoodDetailModal
        item={selectedItem}
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onAdd={addToCart}
      />
      <SavoriaQrScanModal open={scanOpen} onClose={() => setScanOpen(false)} />
    </div>
  )
}
