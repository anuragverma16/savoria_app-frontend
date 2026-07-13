import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { publicAPI, restaurantAPI } from '../api/dineflow'
import {
  addItem,
  clearCart,
  initCart,
  removeItem,
  selectCartTotal,
  updateQty,
  menuItemId,
} from '../store/slices/cartSlice'
import { setActiveRestaurant } from '../store/slices/tenantSlice'
import { loadUserTableSession } from '../utils/userTableSession'
import { loadSavoriaSession, appendSavoriaSessionOrder, patchSavoriaSession } from '../utils/savoriaGuestSession'
import { mapCustomerMenuItem, mapCustomerOrder } from '../utils/mapCustomerMenuItem'
import { getCartRestaurantConflict } from '../utils/cartRestaurantConflict'
import { useCustomerPaths } from './useCustomerPaths'
import { filterActiveCoupons } from '../utils/couponDisplay'

/** Keep orders scoped to the scanned restaurant + table */
function filterOrdersForScan(orders, { rid, tableId, tableNumber }) {
  if (!rid && !tableId && !tableNumber) return orders
  return orders.filter((o) => {
    if (rid && o.restaurantId && String(o.restaurantId) !== String(rid)) return false
    if (!tableId && !tableNumber) return true
    if (tableId && o.tableId && String(o.tableId) === String(tableId)) return true
    if (tableNumber && o.tableNumber && String(o.tableNumber) === String(tableNumber)) return true
    return false
  })
}

export function useCustomerOrdering({ session, refreshSession, isAuthenticated } = {}) {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const paths = useCustomerPaths()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const cartState = useSelector((s) => s.cart)
  const { items, table, tableToken } = cartState
  const { subtotal, itemCount } = useSelector(selectCartTotal)
  const { user, accessToken } = useSelector((s) => s.auth)

  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuError, setMenuError] = useState(null)
  const [settings, setSettings] = useState({})
  const [restaurantMeta, setRestaurantMeta] = useState(null)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [promoCoupons, setPromoCoupons] = useState([])
  const [couponLoading, setCouponLoading] = useState(false)
  const [checkoutPreview, setCheckoutPreview] = useState(null)
  const [offerStatus, setOfferStatus] = useState(null)
  const [pricingPhone, setPricingPhone] = useState('')
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState(null)
  const [switchPrompt, setSwitchPrompt] = useState(null)

  const urlRid = searchParams.get('restaurantId') || searchParams.get('rid')
  const urlTableId = searchParams.get('tableId')
  const urlTableNo = searchParams.get('no') || searchParams.get('tableNumber')

  const rid = session?.rid || activeRestaurant?._id || urlRid || null
  const tableId = session?.tableId || urlTableId || null
  const tableNumber = session?.tableNumber || session?.table?.tableNumber || urlTableNo || null
  const customerPhone = pricingPhone || session?.auth?.phone || user?.phone || ''
  const gstRate = settings?.taxRate ?? activeRestaurant?.settings?.taxRate ?? 5
  const serviceRate = settings?.serviceCharge ?? activeRestaurant?.settings?.serviceCharge ?? 0

  const orderItemsPayload = useMemo(() => items.map((i) => ({
    menuItem: i.menuItem,
    name: i.name,
    price: i.price,
    qty: i.qty,
    image: i.image,
  })), [items])

  const offerResolved = Boolean(checkoutPreview || offerStatus)
  const welcomeEligible = checkoutPreview?.welcomeEligible ?? offerStatus?.welcomeEligible ?? !offerResolved
  const canUseCoupons = checkoutPreview?.canUseCoupons ?? offerStatus?.canUseCoupons ?? false
  const welcomePercent = checkoutPreview?.welcomePercent ?? offerStatus?.welcomePercent ?? 40
  const welcomeDiscount = checkoutPreview?.welcomeDiscount ?? offerStatus?.welcomeDiscount ?? 0
  const couponDiscount = checkoutPreview?.couponDiscount ?? appliedCoupon?.discountAmount ?? appliedCoupon?.amount ?? 0
  const gst = checkoutPreview?.gst ?? checkoutPreview?.tax ?? Math.round(subtotal * gstRate / 100)
  const service = checkoutPreview?.serviceCharge ?? Math.round(subtotal * serviceRate / 100)
  const discount = checkoutPreview?.discount ?? couponDiscount + welcomeDiscount
  const total = checkoutPreview?.total ?? Math.max(0, subtotal + gst + service - discount)

  const restaurant = useMemo(() => ({
    _id: rid,
    name: restaurantMeta?.name || activeRestaurant?.name || session?.restaurantName || 'Restaurant',
    slug: restaurantMeta?.slug || activeRestaurant?.slug || session?.slug,
    logo: restaurantMeta?.logo || activeRestaurant?.logo,
    phone: restaurantMeta?.phone || activeRestaurant?.phone,
    email: restaurantMeta?.email || activeRestaurant?.email,
    address: restaurantMeta?.address || activeRestaurant?.address,
    description: restaurantMeta?.description || activeRestaurant?.description,
    settings: { ...activeRestaurant?.settings, ...settings },
    tableNumber: session?.tableNumber || table?.tableNumber || tableNumber,
    tableId: session?.tableId || table?._id || tableId,
  }), [rid, restaurantMeta, activeRestaurant, session, settings, table, tableNumber, tableId])

  const mappedMenuItems = useMemo(
    () => menuItems.map(mapCustomerMenuItem),
    [menuItems],
  )

  const categoryOptions = useMemo(() => {
    if (!categories.length) {
      const ids = new Map()
      mappedMenuItems.forEach((item) => {
        if (!ids.has(item.category)) {
          ids.set(item.category, { id: item.category, name: item.categoryName || 'Menu', icon: '🍽️' })
        }
      })
      return Array.from(ids.values())
    }
    return categories.map((cat) => ({
      id: cat._id,
      name: cat.name,
      icon: cat.icon || '🍽️',
    }))
  }, [categories, mappedMenuItems])

  const cart = useMemo(() => items.map((line) => ({
    id: line.menuItem,
    menuItem: line.menuItem,
    name: line.name,
    price: line.price,
    qty: line.qty,
    image: line.image || '',
  })), [items])

  const totals = useMemo(() => ({
    subtotal,
    gst,
    service,
    discount,
    couponDiscount,
    welcomeDiscount,
    total,
    itemCount,
  }), [subtotal, gst, service, discount, couponDiscount, welcomeDiscount, total, itemCount])

  const loadMenu = useCallback(async () => {
    const scopeRid = rid || urlRid
    if (!scopeRid) return
    setMenuLoading(true)
    setMenuError(null)
    try {
      const scopeTableId = tableId || urlTableId
      if ((session?.qrLinked || (urlRid && urlTableId)) && scopeTableId) {
        const { data } = await publicAPI.getScanMenu(scopeRid, scopeTableId)
        const restaurantData = data.restaurant || {}
        dispatch(setActiveRestaurant({
          _id: restaurantData._id || scopeRid,
          name: restaurantData.name,
          slug: restaurantData.slug,
          settings: restaurantData.settings,
          address: restaurantData.address,
          logo: restaurantData.logo,
          phone: restaurantData.phone,
          email: restaurantData.email,
        }))
        setCategories(data.categories || [])
        setMenuItems(data.menuItems || [])
        setSettings(restaurantData.settings || {})
        setRestaurantMeta(restaurantData)
        setPromoCoupons(filterActiveCoupons(data.promoCoupons || []))
        return
      }

      const slug = session?.slug || activeRestaurant?.slug
      if (!slug) {
        setMenuError('Restaurant not linked. Scan your table QR.')
        return
      }
      const { data } = await publicAPI.getMenu(slug)
      setCategories(data.categories || [])
      setMenuItems(data.menuItems || [])
      setSettings(data.restaurant?.settings || {})
      setRestaurantMeta(data.restaurant || null)
      setPromoCoupons(filterActiveCoupons(data.promoCoupons || []))
    } catch {
      setMenuError('Could not load menu. Please try again.')
      setCategories([])
      setMenuItems([])
    } finally {
      setMenuLoading(false)
    }
  }, [rid, urlRid, urlTableId, tableId, session?.qrLinked, session?.tableId, session?.slug, activeRestaurant?.slug, dispatch])

  const refreshOrders = useCallback(async () => {
    const stored = loadSavoriaSession() || {}
    const scopeRid = rid || urlRid
    const scopeTableId = tableId || urlTableId
    const scopeTableNo = tableNumber || urlTableNo

    let sessionOrders = (stored.orders || [])
      .map(mapCustomerOrder)
      .filter(Boolean)
    sessionOrders = filterOrdersForScan(sessionOrders, {
      rid: scopeRid,
      tableId: scopeTableId,
      tableNumber: scopeTableNo,
    })

    if (!scopeRid || !isAuthenticated) {
      setOrders(sessionOrders)
      return
    }

    setOrdersLoading(true)
    try {
      const { data } = await restaurantAPI(scopeRid).myOrders()
      let apiOrders = (data.orders || []).map(mapCustomerOrder).filter(Boolean)
      apiOrders = filterOrdersForScan(apiOrders, {
        rid: scopeRid,
        tableId: scopeTableId,
        tableNumber: scopeTableNo,
      })
      const merged = [...apiOrders]
      sessionOrders.forEach((so) => {
        if (!merged.some((o) => o.id === so.id)) merged.push(so)
      })
      merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setOrders(merged)
    } catch {
      setOrders(sessionOrders)
    } finally {
      setOrdersLoading(false)
    }
  }, [rid, urlRid, urlTableId, urlTableNo, tableId, tableNumber, isAuthenticated])

  useEffect(() => {
    loadMenu()
  }, [loadMenu])

  useEffect(() => {
    refreshOrders()
  }, [refreshOrders])

  useEffect(() => {
    if (!rid) return undefined
    let cancelled = false
    publicAPI.getCustomerOffer({
      restaurantId: rid,
      phone: customerPhone,
      subtotal,
    })
      .then(({ data }) => {
        if (!cancelled) setOfferStatus(data.offer || null)
      })
      .catch(() => {
        if (!cancelled) setOfferStatus(null)
      })
    return () => { cancelled = true }
  }, [rid, customerPhone, subtotal])

  useEffect(() => {
    if (!rid || !items.length) {
      setCheckoutPreview(null)
      return undefined
    }
    let cancelled = false
    const timer = setTimeout(() => {
      const payload = {
        phone: customerPhone,
        couponCode: appliedCoupon?.code,
        items: orderItemsPayload,
      }
      const request = accessToken && isAuthenticated
        ? restaurantAPI(rid).previewCheckout(payload)
        : publicAPI.previewCheckout({ ...payload, restaurantId: rid })

      request
        .then(({ data }) => {
          if (!cancelled) setCheckoutPreview(data.preview || null)
        })
        .catch(() => {
          if (!cancelled) setCheckoutPreview(null)
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [rid, items.length, customerPhone, appliedCoupon?.code, accessToken, isAuthenticated, orderItemsPayload])

  useEffect(() => {
    if (welcomeEligible && appliedCoupon) {
      setAppliedCoupon(null)
    }
  }, [welcomeEligible, appliedCoupon])

  const applyCustomerCoupon = useCallback(async (code) => {
    const trimmed = String(code || '').trim().toUpperCase()
    if (!trimmed) throw new Error('Enter a coupon code')
    if (!rid) throw new Error('Restaurant not linked')
    if (!subtotal) throw new Error('Add items before applying a coupon')
    if (!canUseCoupons) {
      throw new Error('New customers get 40% off automatically — coupon codes are for returning customers')
    }

    setCouponLoading(true)
    try {
      const payload = { code: trimmed, subtotal, phone: customerPhone }
      const { data } = accessToken && isAuthenticated
        ? await restaurantAPI(rid).validateCoupon(payload)
        : await publicAPI.validateCoupon({ ...payload, restaurantId: rid })
      setAppliedCoupon(data.coupon)
      return data.coupon
    } finally {
      setCouponLoading(false)
    }
  }, [rid, subtotal, customerPhone, accessToken, isAuthenticated, canUseCoupons])

  const removeCustomerCoupon = useCallback(() => {
    setAppliedCoupon(null)
  }, [])

  useEffect(() => {
    if (!appliedCoupon) return
    if (!filterActiveCoupons([appliedCoupon]).length) {
      setAppliedCoupon(null)
    }
  }, [appliedCoupon])

  useEffect(() => {
    if (!appliedCoupon?.code || !rid || !subtotal || !canUseCoupons) return undefined
    let cancelled = false
    const payload = { code: appliedCoupon.code, subtotal, phone: customerPhone }
    const request = accessToken && isAuthenticated
      ? restaurantAPI(rid).validateCoupon(payload)
      : publicAPI.validateCoupon({ ...payload, restaurantId: rid })

    request
      .then(({ data }) => {
        if (!cancelled) setAppliedCoupon(data.coupon)
      })
      .catch(() => {
        if (!cancelled) setAppliedCoupon(null)
      })

    return () => { cancelled = true }
  }, [appliedCoupon?.code, rid, subtotal, customerPhone, accessToken, isAuthenticated, canUseCoupons])

  useEffect(() => {
    if (!rid) return
    const stored = loadUserTableSession(rid)
    if (stored?.qrLinked && stored.tableToken) {
      dispatch(initCart({
        restaurantId: String(rid),
        tableToken: stored.tableToken,
        table: stored.table,
      }))
    }
  }, [rid, dispatch])

  const addToCart = useCallback((item, qty = 1) => {
    if (!rid) return false
    if (item.isAvailable === false) return false
    const id = menuItemId(item)
    if (!id) return false

    for (let i = 0; i < qty; i += 1) {
      dispatch(addItem({
        menuItem: id,
        name: item.name,
        price: item.price,
        image: item.image,
      }))
    }
    return true
  }, [dispatch, rid])

  const updateCartQty = useCallback((lineId, qty) => {
    if (qty <= 0) {
      dispatch(removeItem(lineId))
      return
    }
    dispatch(updateQty({ menuItem: lineId, qty }))
  }, [dispatch])

  const removeFromCart = useCallback((lineId) => {
    dispatch(removeItem(lineId))
  }, [dispatch])

  const clearCustomerCart = useCallback(() => {
    dispatch(clearCart())
    setAppliedCoupon(null)
  }, [dispatch])

  const confirmRestaurantSwitch = useCallback(async () => {
    const pending = switchPrompt?.pending
    if (!pending) return null
    clearCustomerCart()
    setSwitchPrompt(null)
    return pending
  }, [switchPrompt, clearCustomerCart])

  const cancelRestaurantSwitch = useCallback(() => {
    setSwitchPrompt(null)
  }, [])

  const checkRestaurantSwitch = useCallback((nextRestaurantId, pendingLink) => {
    const conflict = getCartRestaurantConflict(cartState, nextRestaurantId)
    if (!conflict) return false
    setSwitchPrompt({ pending: pendingLink, conflict })
    return true
  }, [cartState])

  const placeCustomerOrder = useCallback(async ({
    paymentTxnId,
    paymentProof,
    paymentMethod = 'online',
    customerName,
    phone,
    couponCode,
    specialInstructions = '',
    amount,
  }) => {
    if (!rid || !items.length) {
      throw new Error('Cart is empty')
    }

    const tableSession = loadUserTableSession(rid)
    const fd = new FormData()
    fd.append('items', JSON.stringify(items.map((i) => ({
      menuItem: i.menuItem,
      name: i.name,
      price: i.price,
      qty: i.qty,
      image: i.image,
    }))))
    fd.append('guestName', customerName.trim())
    fd.append('phone', phone.trim())
    fd.append('guestCount', '1')
    fd.append('tableToken', tableSession?.tableToken || tableToken || '')
    if (tableSession?.tableId || session?.tableId) {
      fd.append('tableId', tableSession?.tableId || session.tableId)
    }
    const tableNumber = tableSession?.table?.tableNumber
      || session?.tableNumber
      || table?.tableNumber
    if (tableNumber) {
      fd.append('tableNumber', String(tableNumber))
    }
    fd.append('paymentTxnId', paymentTxnId)
    fd.append('paymentProof', paymentProof)
    fd.append('paymentMethod', paymentMethod || 'online')
    fd.append('amount', String(amount ?? total))
    if (couponCode || appliedCoupon?.code) {
      if (!canUseCoupons) {
        throw new Error('New customers get 40% off automatically')
      }
      fd.append('couponCode', couponCode || appliedCoupon.code)
    }
    if (specialInstructions) fd.append('specialInstructions', specialInstructions)

    const { data } = await restaurantAPI(rid).placeCustomerOrder(fd)
    const mapped = mapCustomerOrder(data.order)
    appendSavoriaSessionOrder({ ...mapped, restaurantId: rid })
    dispatch(clearCart())
    setAppliedCoupon(null)
    setLastPlacedOrderId(mapped?.id || mapped?.orderId)
    await refreshOrders()
    return mapped
  }, [rid, items, tableToken, table, session?.tableId, session?.tableNumber, total, appliedCoupon, canUseCoupons, dispatch, refreshOrders])

  const verifyUpiPayment = useCallback(async ({
    paymentTxnId,
    paymentProof,
    amount,
    paymentMethod = 'online',
  }) => {
    const fd = new FormData()
    fd.append('paymentTxnId', paymentTxnId)
    fd.append('paymentProof', paymentProof)
    fd.append('paymentMethod', paymentMethod || 'online')
    fd.append('amount', String(amount ?? total))
    fd.append('items', JSON.stringify(items.map((i) => ({
      menuItem: i.menuItem,
      name: i.name,
      price: i.price,
      qty: i.qty,
    }))))
    if (appliedCoupon?.code) fd.append('couponCode', appliedCoupon.code)
    await restaurantAPI(rid).verifyUpiPayment(fd)
  }, [rid, items, total, appliedCoupon])

  const patchSession = useCallback((patch) => {
    patchSavoriaSession(patch)
    refreshSession?.()
  }, [refreshSession])

  return {
    paths,
    restaurant,
    categories: categoryOptions,
    menuItems: mappedMenuItems,
    menuLoading,
    menuError,
    loadMenu,
    cart,
    totals,
    gstRate,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCustomerCart,
    appliedCoupon,
    setAppliedCoupon,
    promoCoupons,
    couponLoading,
    applyCustomerCoupon,
    removeCustomerCoupon,
    welcomeEligible,
    welcomePercent,
    welcomeDiscount,
    canUseCoupons,
    checkoutPreview,
    setPricingPhone,
    placeCustomerOrder,
    verifyUpiPayment,
    orders,
    ordersLoading,
    refreshOrders,
    lastPlacedOrderId,
    setLastPlacedOrderId,
    switchPrompt,
    checkRestaurantSwitch,
    confirmRestaurantSwitch,
    cancelRestaurantSwitch,
    patchSession,
    rid,
    user,
  }
}
