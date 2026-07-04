import { useCallback, useEffect, useMemo, useState } from 'react'
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

export function useCustomerOrdering({ session, refreshSession, isAuthenticated } = {}) {
  const dispatch = useDispatch()
  const paths = useCustomerPaths()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const cartState = useSelector((s) => s.cart)
  const { items, table, tableToken } = cartState
  const { subtotal, itemCount } = useSelector(selectCartTotal)
  const { user } = useSelector((s) => s.auth)

  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuError, setMenuError] = useState(null)
  const [settings, setSettings] = useState({})
  const [restaurantMeta, setRestaurantMeta] = useState(null)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState(null)
  const [switchPrompt, setSwitchPrompt] = useState(null)

  const rid = session?.rid || activeRestaurant?._id
  const gstRate = settings?.taxRate ?? activeRestaurant?.settings?.taxRate ?? 5
  const serviceRate = settings?.serviceCharge ?? activeRestaurant?.settings?.serviceCharge ?? 0
  const gst = Math.round(subtotal * gstRate / 100)
  const service = Math.round(subtotal * serviceRate / 100)
  const discount = appliedCoupon?.discountAmount || appliedCoupon?.amount || 0
  const total = Math.max(0, subtotal + gst + service - discount)

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
    tableNumber: session?.tableNumber || table?.tableNumber,
    tableId: session?.tableId || table?._id,
  }), [rid, restaurantMeta, activeRestaurant, session, settings, table])

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
    total,
    itemCount,
  }), [subtotal, gst, service, discount, total, itemCount])

  const loadMenu = useCallback(async () => {
    if (!rid) return
    setMenuLoading(true)
    setMenuError(null)
    try {
      if (session?.qrLinked && session?.tableId) {
        const { data } = await publicAPI.getScanMenu(rid, session.tableId)
        const restaurantData = data.restaurant || {}
        dispatch(setActiveRestaurant({
          _id: restaurantData._id || rid,
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
    } catch {
      setMenuError('Could not load menu. Please try again.')
      setCategories([])
      setMenuItems([])
    } finally {
      setMenuLoading(false)
    }
  }, [rid, session?.qrLinked, session?.tableId, session?.slug, activeRestaurant?.slug, dispatch])

  const refreshOrders = useCallback(async () => {
    const session = loadSavoriaSession() || {}
    const sessionOrders = (session.orders || [])
      .map(mapCustomerOrder)
      .filter((o) => !rid || String(o.restaurantId || session.rid) === String(rid))

    if (!rid || !isAuthenticated) {
      setOrders(sessionOrders)
      return
    }

    setOrdersLoading(true)
    try {
      const { data } = await restaurantAPI(rid).myOrders()
      const apiOrders = (data.orders || []).map(mapCustomerOrder)
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
  }, [rid, isAuthenticated])

  useEffect(() => {
    loadMenu()
  }, [loadMenu])

  useEffect(() => {
    refreshOrders()
  }, [refreshOrders])

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
    fd.append('amount', String(amount ?? total))
    if (couponCode || appliedCoupon?.code) {
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
  }, [rid, items, tableToken, table, session?.tableId, session?.tableNumber, total, appliedCoupon, dispatch, refreshOrders])

  const verifyUpiPayment = useCallback(async ({ paymentTxnId, paymentProof, amount }) => {
    const fd = new FormData()
    fd.append('paymentTxnId', paymentTxnId)
    fd.append('paymentProof', paymentProof)
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
