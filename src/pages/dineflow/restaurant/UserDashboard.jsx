import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiMapPin, FiClock, FiShoppingBag, FiArrowRight, FiPackage, FiSearch, FiFilter, FiLink, FiHome,
} from 'react-icons/fi'
import { publicAPI, restaurantAPI } from '../../../api/dineflow'
import UserMenuItemCard from '../../../components/dineflow/UserMenuItemCard'
import UserOrderHistoryList from '../../../components/dineflow/UserOrderHistoryList'
import { menuItemId } from '../../../store/slices/cartSlice'
import { loadUserTableSession, hasQrTableSession } from '../../../utils/userTableSession'
import { useOrderPanelPaths } from '../../../utils/orderPanelPaths'
import SavoriaBrandedQrScanCard from '../../../components/savoria/SavoriaBrandedQrScanCard'
import SavoriaQrScanModal from '../../../components/savoria/SavoriaQrScanModal'

const ROLE_PLACEHOLDER_NAMES = /^(staff|admin|user|superadmin|manager|waiter|chef|cashier|customer|custom)$/i

function displayName(user, session) {
  const guest = String(session?.guestName ?? '').trim()
  if (guest) return guest.split(/\s+/)[0]

  const fullName = String(user?.name ?? '').trim()
  const emailPart = String(user?.email ?? '').split('@')[0]?.trim() || ''
  if (fullName && !ROLE_PLACEHOLDER_NAMES.test(fullName)) return fullName.split(/\s+/)[0]
  if (emailPart) return emailPart.charAt(0).toUpperCase() + emailPart.slice(1)
  return 'there'
}

function initials(user, session) {
  const name = session?.guestName?.trim() || displayName(user, session)
  return name.slice(0, 2).toUpperCase()
}

function MenuSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.03] animate-pulse">
          <div className="w-24 h-24 rounded-xl bg-white/5 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-white/5 rounded w-2/3" />
            <div className="h-3 bg-white/5 rounded w-full" />
            <div className="h-3 bg-white/5 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function UserDashboard() {
  const [searchParams] = useSearchParams()
  const { user } = useSelector((s) => s.auth)
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const [scanOpen, setScanOpen] = useState(() => searchParams.get('scan') === '1')
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [popularPicks, setPopularPicks] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [orders, setOrders] = useState([])
  const [ordersPreview, setOrdersPreview] = useState(false)
  const [tableSession, setTableSession] = useState(null)
  const panelPaths = useOrderPanelPaths()
  const rid = panelPaths.rid || activeRestaurant?._id
  const tablesPath = panelPaths.tables
  const menuPath = panelPaths.menu

  useEffect(() => {
    if (!rid) return
    setTableSession(loadUserTableSession(rid))
  }, [rid])

  useEffect(() => {
    if (!activeRestaurant?.slug) return
    setMenuLoading(true)
    Promise.all([
      publicAPI.getMenu(activeRestaurant.slug),
      publicAPI.getPopularItems(activeRestaurant.slug),
    ])
      .then(([menuRes, popularRes]) => {
        setCategories(menuRes.data.categories || [])
        setMenuItems(menuRes.data.menuItems || [])
        setPopularPicks((popularRes.data.popularItems || []).slice(0, 3))
      })
      .catch(() => {
        setCategories([])
        setMenuItems([])
        setPopularPicks([])
      })
      .finally(() => setMenuLoading(false))
  }, [activeRestaurant?.slug])

  useEffect(() => {
    if (!rid) return
    restaurantAPI(rid).myOrders()
      .then(({ data }) => {
        setOrders(data.orders || [])
        setOrdersPreview(Boolean(data.preview))
      })
      .catch(() => {
        setOrders([])
        setOrdersPreview(false)
      })
  }, [rid])

  const popularIds = useMemo(
    () => new Set(popularPicks.map((i) => String(menuItemId(i) || i._id))),
    [popularPicks],
  )

  const availableItems = useMemo(
    () => menuItems.filter((i) => i.isAvailable !== false),
    [menuItems],
  )

  const catalogItems = useMemo(() => {
    if (search.trim() || activeCategory !== 'all') return availableItems
    return availableItems.filter((i) => !popularIds.has(String(menuItemId(i) || i._id)))
  }, [availableItems, popularIds, search, activeCategory])

  const filteredItems = useMemo(() => {
    let list = catalogItems
    if (activeCategory !== 'all') {
      list = list.filter((i) => (i.category?._id || i.category) === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) =>
        i.name.toLowerCase().includes(q)
        || i.description?.toLowerCase().includes(q),
      )
    }
    return list
  }, [catalogItems, activeCategory, search])

  const itemsByCategory = useMemo(() => {
    if (activeCategory !== 'all' || search.trim()) {
      return [{ _id: 'filtered', name: search.trim() ? 'Search results' : 'Menu', items: filteredItems }]
    }
    const grouped = categories
      .map((cat) => ({
        ...cat,
        items: catalogItems.filter((i) => (i.category?._id || i.category) === cat._id),
      }))
      .filter((cat) => cat.items.length > 0)
    const uncategorized = catalogItems.filter(
      (i) => !categories.some((c) => c._id === (i.category?._id || i.category)),
    )
    if (uncategorized.length) {
      grouped.push({ _id: 'more', name: 'More', items: uncategorized })
    }
    return grouped
  }, [categories, catalogItems, filteredItems, activeCategory, search])

  const ordersWithRestaurant = orders.map((o) => ({
    ...o,
    restaurant: o.restaurant || activeRestaurant,
  }))

  const pendingOrders = orders.filter((o) => !['served', 'completed', 'cancelled'].includes(o.status)).length
  const tableBooked = hasQrTableSession(rid)
  const welcome = displayName(user, tableSession)
  const orderPath = tableBooked ? menuPath : tablesPath

  useEffect(() => {
    if (panelPaths.isOrderPanel && searchParams.get('scan') === '1') setScanOpen(true)
  }, [searchParams, panelPaths.isOrderPanel])

  return (
    <div className="user-panel min-h-full relative">
      <div className="user-panel-glow pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-500/[0.08] to-transparent" />

      <div className="relative p-6 md:p-8 max-w-6xl mx-auto pb-12">
        <Link
          to={panelPaths.siteHome || '/'}
          className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-emerald-400 transition-colors mb-6"
        >
          <FiHome size={16} />
          Back to home
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-emerald-500/25 shrink-0">
              {initials(user, tableSession)}
            </div>
            <div>
              <p className="text-emerald-400/80 text-xs font-semibold uppercase tracking-widest mb-1">Home</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Welcome, {welcome}
              </h1>
              <p className="text-white/45 text-sm mt-1 flex items-center gap-1.5 flex-wrap">
                <FiMapPin className="text-emerald-400 shrink-0" size={14} />
                {activeRestaurant?.name}
                {activeRestaurant?.address?.city && (
                  <span className="text-white/25">· {activeRestaurant.address.city}</span>
                )}
                {tableBooked && (
                  <span className="text-emerald-400/80">
                    · Table {tableSession.table?.tableNumber || tableSession.table?.label}
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.header>

        {tableBooked ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <p className="text-emerald-300 text-sm font-semibold">
                Table {tableSession.table?.tableNumber || tableSession.table?.label} linked
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                to={`${tablesPath}?change=1`}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10"
              >
                Change table
              </Link>
              <Link
                to={menuPath}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400"
              >
                Order now
              </Link>
            </div>
          </motion.div>
        ) : panelPaths.isOrderPanel ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col items-center gap-4"
          >
            <p className="text-white/50 text-sm text-center">Link your table to start ordering</p>
            <SavoriaBrandedQrScanCard
              restaurantName={activeRestaurant?.name || 'Savoria'}
              hint="Tap to scan your table QR"
              onClick={() => setScanOpen(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-white font-semibold">Link your table to order</p>
              </div>
              <Link
                to={tablesPath}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 shrink-0"
              >
                <FiLink size={16} />
                Book table
              </Link>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: FiPackage, label: 'Your orders', value: orders.length, accent: 'text-emerald-400' },
            { icon: FiClock, label: 'Active', value: pendingOrders, accent: 'text-amber-400' },
            { icon: FiShoppingBag, label: 'Menu items', value: menuLoading ? '…' : availableItems.length, accent: 'text-teal-400' },
            { icon: FiFilter, label: 'Categories', value: menuLoading ? '…' : categories.length, accent: 'text-violet-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="user-panel-stat p-4 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm"
            >
              <stat.icon className={`${stat.accent} mb-2`} size={18} />
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wide mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Menu browse */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">Our menu</h2>
              <p className="text-sm text-white/40 mt-0.5">
                {menuLoading
                  ? 'Loading dishes…'
                  : `${availableItems.length} item${availableItems.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
            <Link
              to={orderPath}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/25 shrink-0"
            >
              {tableBooked ? 'Full menu' : 'Link table to order'} <FiArrowRight size={14} />
            </Link>
          </div>

          <div className="relative mb-4">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="user-panel-search w-full bg-white/[0.06] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-500/50"
            />
          </div>

          {!menuLoading && categories.length > 0 && (
            <div className="user-panel-cats flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === 'all'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:border-emerald-500/30'
                }`}
              >
                <FiFilter className="inline mr-1 -mt-0.5" size={12} /> All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setActiveCategory(cat._id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === cat._id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:border-emerald-500/30'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {menuLoading ? (
            <MenuSkeleton />
          ) : availableItems.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <FiShoppingBag className="mx-auto text-white/20 mb-3" size={32} />
              <p className="text-white/50">No menu items yet.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-white/10">
              <p className="text-white/50">No dishes match your search.</p>
              <button
                type="button"
                onClick={() => { setSearch(''); setActiveCategory('all') }}
                className="mt-3 text-sm text-emerald-400 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {!search.trim() && activeCategory === 'all' && popularPicks.length > 0 && (
                <div className="mb-10">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400/90">Popular picks</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {popularPicks.map((item, i) => (
                      <motion.div
                        key={menuItemId(item) || item._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="h-[360px]"
                      >
                        <Link to={orderPath} className="block h-full">
                          <UserMenuItemCard item={item} variant="popular" showActions={false} />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-10">
                {itemsByCategory.map((cat) => cat.items.length > 0 && (
                  <div key={cat._id}>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400/90 mb-4 flex items-center gap-2">
                      <span className="w-8 h-px bg-emerald-500/40" />
                      {cat.name}
                      <span className="text-white/30 text-xs font-normal normal-case tracking-normal">
                        ({cat.items.length})
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {cat.items.map((item) => (
                        <Link key={menuItemId(item) || item._id} to={orderPath} className="block">
                          <UserMenuItemCard item={item} showActions={false} />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section>
          <h2 className="font-semibold text-white mb-4">
            {ordersPreview ? 'Customer order history' : 'Your orders'}
          </h2>
          <UserOrderHistoryList
            orders={ordersWithRestaurant}
            defaultRestaurant={activeRestaurant}
            emptyMessage="No orders yet."
          />
        </section>
      </div>

      {panelPaths.isOrderPanel && (
        <SavoriaQrScanModal open={scanOpen} onClose={() => setScanOpen(false)} />
      )}
    </div>
  )
}
