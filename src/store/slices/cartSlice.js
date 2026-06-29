import { createSlice } from '@reduxjs/toolkit'

function normId(id) {
  if (id == null || id === '') return ''
  return String(id)
}

function cartKey(restaurantId, tableToken) {
  return `dineflow_cart_${normId(restaurantId)}_${tableToken || 'default'}`
}

function loadCart(restaurantId, tableToken) {
  try {
    const raw = JSON.parse(localStorage.getItem(cartKey(restaurantId, tableToken)) || '{"items":[]}')
    return {
      items: (raw.items || []).map((row) => ({
        menuItem: normId(row.menuItem),
        name: row.name || 'Item',
        price: Number(row.price) || 0,
        qty: Math.max(1, Number(row.qty) || 1),
        image: row.image,
      })).filter((row) => row.menuItem),
    }
  } catch {
    return { items: [] }
  }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    restaurantId: null,
    tableToken: null,
    table: null,
    guest: { name: '', phone: '', guestCount: 1 },
    items: [],
    specialInstructions: '',
  },
  reducers: {
    initCart(state, action) {
      const { restaurantId, tableToken, table } = action.payload
      const rid = normId(restaurantId)
      const token = tableToken || 'user-panel'

      if (state.restaurantId === rid && state.tableToken === token) {
        state.table = table ?? state.table
        return
      }

      state.restaurantId = rid
      state.tableToken = token
      state.table = table ?? null
      const saved = loadCart(rid, token)
      state.items = saved.items
    },
    addItem(state, action) {
      const raw = action.payload
      const menuItemId = normId(raw.menuItem ?? raw._id ?? raw.id)
      if (!menuItemId) return

      const row = {
        menuItem: menuItemId,
        name: raw.name || 'Item',
        price: Number(raw.price) || 0,
        image: raw.image,
      }

      const existing = state.items.find((i) => i.menuItem === menuItemId)
      if (existing) {
        existing.qty += 1
      } else {
        state.items.push({ ...row, qty: 1 })
      }
      persist(state)
    },
    updateQty(state, action) {
      const menuItemId = normId(action.payload.menuItem)
      const qty = Number(action.payload.qty)
      const idx = state.items.findIndex((i) => i.menuItem === menuItemId)
      if (idx === -1) return

      if (qty <= 0) {
        state.items.splice(idx, 1)
      } else {
        state.items[idx].qty = qty
      }
      persist(state)
    },
    removeItem(state, action) {
      const menuItemId = normId(action.payload)
      state.items = state.items.filter((i) => i.menuItem !== menuItemId)
      persist(state)
    },
    setGuest(state, action) {
      state.guest = { ...state.guest, ...action.payload }
    },
    setInstructions(state, action) {
      state.specialInstructions = action.payload
    },
    clearCart(state) {
      state.items = []
      persist(state)
    },
  },
})

function persist(state) {
  if (state.restaurantId) {
    localStorage.setItem(
      cartKey(state.restaurantId, state.tableToken),
      JSON.stringify({ items: state.items }),
    )
  }
}

export const { initCart, addItem, updateQty, removeItem, setGuest, setInstructions, clearCart } = cartSlice.actions

export const selectCartTotal = (state) => {
  const items = state.cart.items || []
  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0)
  const itemCount = items.reduce((s, i) => s + (Number(i.qty) || 0), 0)
  return { subtotal, itemCount }
}

export function menuItemId(item) {
  return normId(item?._id ?? item?.id ?? item?.menuItem)
}

export default cartSlice.reducer
