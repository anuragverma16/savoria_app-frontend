import { useEffect, useMemo, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { FiArrowLeft, FiShoppingBag, FiX, FiSearch, FiFilter, FiTag, FiDownload } from 'react-icons/fi'
import { publicAPI, restaurantAPI } from '../../../api/dineflow'
import UserMenuItemCard from '../../../components/dineflow/UserMenuItemCard'
import CartLineItem from '../../../components/dineflow/CartLineItem'
import UserCartPanel from '../../../components/dineflow/UserCartPanel'
import DineflowUpiPaymentModal from '../../../components/dineflow/DineflowUpiPaymentModal'
import { itemPrice } from '../../../components/dineflow/MenuItemCard'
import {
  initCart, addItem, updateQty, removeItem, setInstructions, clearCart, selectCartTotal, menuItemId,
} from '../../../store/slices/cartSlice'
import { loadUserTableSession, saveUserTableSession, hasQrTableSession, clearUserTableSession, getLinkedTableNumber } from '../../../utils/userTableSession'
import { buildTableSearchParams, readTableParamsFromSearch } from '../../../utils/tableQueryParams'
import { downloadOrderInvoice } from '../../../utils/generateInvoicePdf'
import { linkTableFromQr, syncCartFromTableSession } from '../../../utils/linkTableFromQr'
import { useTableSessionGuard } from '../../../hooks/useTableSessionGuard'
import { canOrderFromTable } from '../../../utils/tableOrderGuard'
import TableSessionBar from '../../../components/dineflow/TableSessionBar'
import TableLinkRequired from '../../../components/dineflow/TableLinkRequired'
import { isPendingMenuAutoLink } from '../../../utils/tableBookingLink'
import { buildOrderMenuAutoLinkPath, useOrderPanelPaths } from '../../../utils/orderPanelPaths'
import { useSavoriaGuestOptional } from '../../../contexts/SavoriaGuestContext'
import toast from 'react-hot-toast'

export default function UserMenuPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const { items, specialInstructions, tableToken, table } = useSelector((s) => s.cart)
  const { subtotal, itemCount } = useSelector(selectCartTotal)

  const { user } = useSelector((s) => s.auth)
  const savoriaGuest = useSavoriaGuestOptional()
  const panelPaths = useOrderPanelPaths()
  const rid = panelPaths.rid || activeRestaurant?._id

  const [qrLinking, setQrLinking] = useState(() => isPendingMenuAutoLink(searchParams))
  const qrAutoHandled = useRef(false)

  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [settings, setSettings] = useState({})
  const [restaurantMeta, setRestaurantMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showCheckout, setShowCheckout] = useState(false)
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [phone, setPhone] = useState('')
  const [activeOrder, setActiveOrder] = useState(null)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [checkoutPreview, setCheckoutPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const storedSession = rid ? loadUserTableSession(rid) : null
  const canOrder = canOrderFromTable(rid)
  const qrLinked = hasQrTableSession(rid)
  const dineIn = canOrder
  const tax = checkoutPreview?.tax ?? Math.round(subtotal * (settings?.taxRate || 5) / 100)
  const service = checkoutPreview?.serviceCharge ?? Math.round(subtotal * (settings?.serviceCharge || 0) / 100)
  const couponDiscount = checkoutPreview?.couponDiscount ?? appliedCoupon?.discountAmount ?? 0
  const welcomeDiscount = checkoutPreview?.welcomeDiscount ?? 0
  const discount = checkoutPreview?.discount ?? couponDiscount + welcomeDiscount
  const total = checkoutPreview?.total ?? Math.max(0, subtotal + tax + service - discount)

  useTableSessionGuard(rid, { enabled: canOrder, restaurant: activeRestaurant })

  useEffect(() => {
    if (rid) syncCartFromTableSession(dispatch, rid)
  }, [rid, dispatch, tableToken])

  useEffect(() => {
    if (!rid) return
    const session = loadUserTableSession(rid)

    if (session && !session.qrLinked) {
      clearUserTableSession(rid)
      dispatch(clearCart())
      dispatch(initCart({
        restaurantId: String(rid),
        tableToken: 'user-panel',
        table: null,
      }))
      return
    }

    if (session?.guestName) setGuestName(session.guestName)
    if (session?.guestPhone) setPhone(session.guestPhone)
    if (session?.qrLinked && session.tableToken) {
      dispatch(initCart({
        restaurantId: String(rid),
        tableToken: session.tableToken,
        table: session.table,
      }))
    } else {
      dispatch(clearCart())
      dispatch(initCart({
        restaurantId: String(rid),
        tableToken: 'user-panel',
        table: null,
      }))
    }
  }, [rid, dispatch])

  useEffect(() => {
    if (!rid || !activeRestaurant?._id || qrAutoHandled.current) return
    const params = readTableParamsFromSearch(searchParams)
    if (!isPendingMenuAutoLink(searchParams) || (!params?.tableToken && !params?.tableId)) return

    qrAutoHandled.current = true
    setQrLinking(true)

    const session = loadUserTableSession(rid)
    linkTableFromQr(
      dispatch,
      activeRestaurant,
      {
        tableToken: params.tableToken,
        tableId: params.tableId,
      },
      {
        guestName: session?.guestName || user?.name || '',
        guestPhone: session?.guestPhone || user?.phone || '',
      },
    )
      .then((result) => {
        if (!result.booked) {
          toast.error(result.message || 'Table not available')
          navigate(panelPaths.tables)
          return
        }
        toast.success(`Table ${result.table?.tableNumber} linked`)
        const next = buildTableSearchParams({
          tableToken: result.table?.qrToken || params.tableToken,
          tableId: result.table?._id || params.tableId,
          tableNumber: result.table?.tableNumber || params.tableNumber,
        }).replace(/^\?/, '')
        setSearchParams(new URLSearchParams(next), { replace: true })
        if (result.table) {
          saveUserTableSession(rid, {
            ...loadUserTableSession(rid),
            restaurantId: String(rid),
            tableId: result.table._id,
            tableToken: result.table.qrToken,
            table: result.table,
            qrLinked: true,
            linkedAt: Date.now(),
            sessionExpiresAt: result.sessionExpiresAt || null,
          })
        }
      })
      .catch(() => {
        toast.error('Could not link table')
        navigate(panelPaths.tables)
      })
      .finally(() => setQrLinking(false))
  }, [rid, activeRestaurant, searchParams, dispatch, user, navigate, setSearchParams])

  useEffect(() => {
    if (!rid || !dineIn) return
    const activeTable = table || storedSession?.table
    if (!activeTable?._id && !activeTable?.qrToken && !tableToken) return

    const next = buildTableSearchParams({
      tableToken: tableToken || activeTable?.qrToken || storedSession?.tableToken,
      tableId: activeTable?._id,
      tableNumber: activeTable?.tableNumber || activeTable?.label,
    }).replace(/^\?/, '')

    const current = new URLSearchParams(window.location.search).toString()
    if (next && next !== current) {
      setSearchParams(new URLSearchParams(next), { replace: true })
    }
  }, [rid, dineIn, table, tableToken, storedSession?.tableToken, setSearchParams])

  useEffect(() => {
    if (!activeRestaurant?.slug) return
    setLoading(true)
    publicAPI.getMenu(activeRestaurant.slug)
      .then(({ data }) => {
        setCategories(data.categories || [])
        setMenuItems(data.menuItems || [])
        setSettings(data.restaurant?.settings || {})
        setRestaurantMeta(data.restaurant || null)
      })
      .catch(() => toast.error('Could not load menu'))
      .finally(() => setLoading(false))
  }, [activeRestaurant?.slug])

  useEffect(() => {
    if (!appliedCoupon?.code || !rid || subtotal <= 0) return undefined
    let cancelled = false
    restaurantAPI(rid).validateCoupon({ code: appliedCoupon.code, subtotal })
      .then(({ data }) => {
        if (!cancelled) setAppliedCoupon(data.coupon)
      })
      .catch(() => {
        if (!cancelled) {
          setAppliedCoupon(null)
          toast.error('Coupon no longer valid for this cart')
        }
      })
    return () => { cancelled = true }
  }, [subtotal, rid, appliedCoupon?.code])

  const orderItemsPayload = () => items.map((i) => ({
    menuItem: i.menuItem,
    name: i.name,
    price: i.price,
    qty: i.qty,
    image: i.image,
  }))

  useEffect(() => {
    if (!rid || !items.length || !showCheckout) {
      setCheckoutPreview(null)
      return undefined
    }
    let cancelled = false
    const timer = setTimeout(() => {
      setPreviewLoading(true)
      restaurantAPI(rid).previewCheckout({
        phone: phone.trim(),
        couponCode: appliedCoupon?.code,
        items: orderItemsPayload(),
      })
        .then(({ data }) => {
          if (!cancelled) setCheckoutPreview(data.preview)
        })
        .catch(() => {
          if (!cancelled) setCheckoutPreview(null)
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false)
        })
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [rid, items, phone, appliedCoupon?.code, showCheckout])

  const applyCoupon = async () => {
    const code = couponInput.trim()
    if (!code) {
      toast.error('Enter a coupon code')
      return
    }
    if (!subtotal) {
      toast.error('Add items before applying a coupon')
      return
    }
    setCouponLoading(true)
    try {
      const { data } = await restaurantAPI(rid).validateCoupon({ code, subtotal })
      setAppliedCoupon(data.coupon)
      toast.success(`${data.coupon.code} applied — ₹${data.coupon.discountAmount} off`)
    } catch (e) {
      setAppliedCoupon(null)
      toast.error(e.response?.data?.message || 'Invalid coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCheckoutPreview(null)
    toast.success('Coupon removed')
  }

  const getCartQty = (item) => {
    const id = menuItemId(item)
    return items.find((i) => String(i.menuItem) === id)?.qty || 0
  }

  const requireTableScan = () => {
    toast.error('Link your table first')
    navigate(panelPaths.tables)
  }

  const openCart = () => {
    if (panelPaths.isOrderPanel && savoriaGuest && !savoriaGuest.isAuthenticated) {
      savoriaGuest.openAuthModal({
        mode: 'login',
        redirectPath: panelPaths.menu,
        onSuccess: () => setShowCheckout(true),
      })
      return
    }
    if (requireTableLink()) return
    setShowCheckout(true)
  }

  const requireTableLink = () => {
    syncCartFromTableSession(dispatch, rid)
    if (!canOrderFromTable(rid)) {
      toast.error('Open your table QR link first to add items')
      return true
    }
    return false
  }

  const handleAdd = (item) => {
    if (requireTableLink()) return
    if (item.isAvailable === false) {
      toast.error(`${item.name} is out of stock`)
      return
    }
    const id = menuItemId(item)
    if (!id) {
      toast.error('Could not add this item')
      return
    }
    dispatch(addItem({
      menuItem: id,
      name: item.name,
      price: itemPrice(item),
      image: item.image?.url,
    }))
    toast.success(`${item.name} added to cart`, { duration: 1500 })
  }

  const handleUpdateQty = (item, qty) => {
    if (requireTableLink()) return
    const id = menuItemId(item)
    if (!id) return
    if (qty <= 0) {
      dispatch(removeItem(id))
      return
    }
    dispatch(updateQty({ menuItem: id, qty }))
  }

  const filtered = useMemo(() => {
    let list = menuItems
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
  }, [menuItems, search, activeCategory])

  const itemsByCategory = useMemo(() => {
    if (activeCategory !== 'all' || search.trim()) {
      return [{ _id: 'filtered', name: search.trim() ? 'Results' : 'Menu', items: filtered }]
    }
    const grouped = categories
      .map((cat) => ({
        ...cat,
        items: filtered.filter((i) => (i.category?._id || i.category) === cat._id),
      }))
      .filter((cat) => cat.items.length > 0)
    const uncategorized = filtered.filter(
      (i) => !categories.some((c) => c._id === (i.category?._id || i.category)),
    )
    if (uncategorized.length) {
      grouped.push({ _id: 'more', name: 'More', items: uncategorized })
    }
    return grouped
  }, [categories, filtered, activeCategory, search])

  const persistGuestDetails = (name, mobile) => {
    const session = loadUserTableSession(rid)
    if (session?.qrLinked) {
      saveUserTableSession(rid, { ...session, guestName: name, guestPhone: mobile, qrLinked: true })
    }
  }

  const placeOrder = async ({ paymentTxnId, paymentProof } = {}) => {
    if (requireTableLink()) return
    if (!guestName.trim()) {
      toast.error('Enter your name')
      return
    }
    if (!phone.trim()) {
      toast.error('Phone number is required')
      return
    }
    if (!items.length) {
      toast.error('Cart is empty')
      return
    }
    if (!paymentTxnId || !paymentProof) {
      setShowUpiModal(true)
      return
    }
    setPlacing(true)
    try {
      const fd = new FormData()
      fd.append('items', JSON.stringify(orderItemsPayload()))
      fd.append('guestName', guestName.trim())
      fd.append('phone', phone.trim())
      fd.append('guestCount', '1')
      fd.append('tableToken', loadUserTableSession(rid)?.tableToken || tableToken)
      fd.append('paymentTxnId', paymentTxnId)
      fd.append('paymentProof', paymentProof)
      fd.append('amount', String(total))
      if (appliedCoupon?.code) fd.append('couponCode', appliedCoupon.code)
      if (specialInstructions) fd.append('specialInstructions', specialInstructions)

      const { data } = await restaurantAPI(rid).placeCustomerOrder(fd)
      persistGuestDetails(guestName.trim(), phone.trim())
      setActiveOrder(data.order)
      dispatch(clearCart())
      setAppliedCoupon(null)
      setCouponInput('')
      setCheckoutPreview(null)
      setShowCheckout(false)
      setShowUpiModal(false)
      await downloadOrderInvoice({
        order: data.order,
        restaurant: {
          name: activeRestaurant?.name || restaurantMeta?.name,
          address: restaurantMeta?.address,
          phone: restaurantMeta?.phone,
          email: restaurantMeta?.email,
          gstNumber: restaurantMeta?.gstNumber,
          settings,
        },
        guestName: guestName.trim(),
        guestPhone: phone.trim(),
      })
      toast.success('Payment verified — order confirmed! Invoice downloaded.')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Order failed')
      throw e
    } finally {
      setPlacing(false)
    }
  }

  const verifyUpiPayment = async ({ paymentTxnId, paymentProof, amount }) => {
    const fd = new FormData()
    fd.append('items', JSON.stringify(orderItemsPayload()))
    fd.append('phone', phone.trim())
    fd.append('paymentTxnId', paymentTxnId)
    fd.append('paymentProof', paymentProof)
    fd.append('amount', String(amount))
    if (appliedCoupon?.code) fd.append('couponCode', appliedCoupon.code)
    await restaurantAPI(rid).verifyUpiPayment(fd)
  }

  const handleCheckout = () => {
    if (requireTableLink()) return
    if (!guestName.trim()) {
      toast.error('Enter your name')
      return
    }
    if (!phone.trim()) {
      toast.error('Enter your phone number')
      return
    }
    persistGuestDetails(guestName.trim(), phone.trim())
    setShowUpiModal(true)
  }

  const handleDownloadInvoice = async () => {
    if (!activeOrder) return
    await downloadOrderInvoice({
      order: activeOrder,
      restaurant: {
        name: activeRestaurant?.name || restaurantMeta?.name,
        address: restaurantMeta?.address,
        phone: restaurantMeta?.phone,
        email: restaurantMeta?.email,
        gstNumber: restaurantMeta?.gstNumber,
        settings,
      },
      guestName: guestName.trim() || activeOrder.guest?.name,
      guestPhone: phone.trim() || activeOrder.guest?.phone,
    })
    toast.success('Invoice downloaded')
  }

  const inStockCount = menuItems.filter((i) => i.isAvailable !== false).length
  const outStockCount = menuItems.length - inStockCount

  if (qrLinking || isPendingMenuAutoLink(searchParams)) {
    return (
      <div className="user-panel min-h-full flex flex-col items-center justify-center p-8 text-center">
        <p className="text-emerald-400 font-semibold text-lg">Linking your table…</p>
      </div>
    )
  }

  if (!canOrder) {
    return <TableLinkRequired restaurantId={rid} />
  }

  return (
    <div className="user-panel min-h-full relative flex flex-col">
      <TableSessionBar
        restaurantId={rid}
        tableNumber={table?.tableNumber || storedSession?.table?.tableNumber || getLinkedTableNumber(rid)}
        tableLabel={table?.label || storedSession?.table?.label}
      />
      <div className="user-panel-glow pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-500/[0.07] to-transparent" />

      <div className="relative p-6 md:p-8 max-w-6xl mx-auto pb-32 flex-1 w-full">
        <div className="sticky top-0 z-20 -mx-6 md:-mx-8 px-6 md:px-8 py-4 mb-2 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
          <Link
            to={panelPaths.siteHome || '/'}
            className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-emerald-400 transition-colors mb-4"
          >
            <FiArrowLeft size={16} /> Back to home
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-emerald-400/70 text-[10px] font-bold uppercase tracking-widest mb-1">Order food</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Menu</h1>
              <p className="text-white/40 text-sm mt-0.5">{activeRestaurant?.name}</p>
            </div>
            {!loading && menuItems.length > 0 && (
              <div className="flex gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-medium">
                  {inStockCount} available
                </span>
                {outStockCount > 0 && (
                  <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                    {outStockCount} sold out
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes, ingredients..."
              className="user-panel-search w-full bg-white/[0.06] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
            />
          </div>

          {!loading && categories.length > 0 && (
            <div className="user-panel-cats flex gap-2 mt-4 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === 'all'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:border-emerald-500/30 hover:text-white/80'
                }`}
              >
                <FiFilter size={12} /> All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setActiveCategory(cat._id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === cat._id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:border-emerald-500/30 hover:text-white/80'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <p className="text-emerald-300 text-sm font-semibold">Order {activeOrder.orderId}</p>
              <p className="text-white/45 text-xs mt-0.5 capitalize">
                Status: {activeOrder.status}
                {activeOrder.tableNumber ? ` · Table ${activeOrder.tableNumber}` : ''}
                {activeOrder.total != null ? ` · ₹${activeOrder.total}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs font-semibold hover:bg-emerald-500/30"
              >
                <FiDownload size={14} /> Download invoice
              </button>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-200">
                Live
              </span>
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.03] animate-pulse">
                <div className="w-[72px] h-[72px] rounded-lg bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && menuItems.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
            <FiShoppingBag className="mx-auto text-white/20 mb-3" size={32} />
            <p className="text-white/50">No menu items yet.</p>
          </div>
        )}

        {!loading && menuItems.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
            <p className="text-white/50">No dishes match your search.</p>
            <button
              type="button"
              onClick={() => { setSearch(''); setActiveCategory('all') }}
              className="mt-3 text-sm text-emerald-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="space-y-10 mt-6">
          {itemsByCategory.map((cat) => cat.items.length > 0 && (
            <section key={cat._id}>
              {activeCategory === 'all' && !search.trim() && (
                <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400/90 mb-4 flex items-center gap-2">
                  <span className="w-8 h-px bg-emerald-500/40" />
                  {cat.name}
                  <span className="w-full max-w-[120px] h-px bg-emerald-500/20" />
                </h2>
              )}
              <div className="space-y-2">
                {cat.items.map((item) => (
                  <UserMenuItemCard
                    key={menuItemId(item) || item._id}
                    item={item}
                    onAdd={handleAdd}
                    onUpdateQty={handleUpdateQty}
                    cartQty={getCartQty(item)}
                    orderLocked={!canOrder}
                    onOrderLocked={() => requireTableScan()}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {itemCount > 0 && canOrder && !showCheckout && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 lg:left-60 p-4 z-40 pointer-events-none"
          >
            <div className="max-w-6xl mx-auto pointer-events-auto">
              <button
                type="button"
                onClick={openCart}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold flex items-center justify-between shadow-[0_8px_32px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_12px_40px_-4px_rgba(16,185,129,0.55)] transition-shadow active:scale-[0.99]"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-sm font-bold">
                    {itemCount}
                  </span>
                  View cart
                </span>
                <span className="text-lg font-bold">₹{total}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UserCartPanel
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        items={items.map((item) => ({
          ...item,
          onDecrease: () => {
            if (item.qty <= 1) dispatch(removeItem(item.menuItem))
            else dispatch(updateQty({ menuItem: item.menuItem, qty: item.qty - 1 }))
          },
          onIncrease: () => dispatch(updateQty({ menuItem: item.menuItem, qty: item.qty + 1 })),
          onRemove: () => dispatch(removeItem(item.menuItem)),
        }))}
        itemCount={itemCount}
        table={table}
        tableToken={tableToken}
        guestName={guestName}
        phone={phone}
        onGuestNameChange={setGuestName}
        onPhoneChange={setPhone}
        couponInput={couponInput}
        onCouponInputChange={setCouponInput}
        appliedCoupon={appliedCoupon}
        couponLoading={couponLoading}
        onApplyCoupon={applyCoupon}
        onRemoveCoupon={removeCoupon}
        specialInstructions={specialInstructions}
        onInstructionsChange={(v) => dispatch(setInstructions(v))}
        subtotal={subtotal}
        tax={tax}
        service={service}
        couponDiscount={couponDiscount}
        welcomeDiscount={welcomeDiscount}
        total={total}
        previewLoading={previewLoading}
        placing={placing}
        onCheckout={handleCheckout}
        tablesPath={panelPaths.tables}
      />

      {showUpiModal && (
        <DineflowUpiPaymentModal
          amount={total}
          upiId={settings?.upiId}
          payeeName={settings?.upiPayeeName || activeRestaurant?.name}
          tableNumber={table?.tableNumber || table?.label}
          items={items}
          appliedCoupon={appliedCoupon}
          welcomeDiscount={welcomeDiscount}
          subtotal={subtotal}
          tax={tax}
          serviceCharge={service}
          couponDiscount={couponDiscount}
          onClose={() => setShowUpiModal(false)}
          onVerify={verifyUpiPayment}
          onConfirm={placeOrder}
          placing={placing}
        />
      )}
    </div>
  )
}
