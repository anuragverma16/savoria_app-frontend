import { createSlice } from '@reduxjs/toolkit'

const ACCENT_CYCLE = ['orange', 'blue', 'green']
const savedAccent = localStorage.getItem('dineflow_accent') || 'orange'
const normalizedAccent = ACCENT_CYCLE.includes(savedAccent) ? savedAccent : 'orange'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    accent: normalizedAccent,
    sidebarOpen: true,
    cartDrawerOpen: false,
  },
  reducers: {
    setAccent(state, action) {
      state.accent = action.payload
    },
    cycleAccent(state) {
      const idx = ACCENT_CYCLE.indexOf(state.accent)
      const next = ACCENT_CYCLE[(idx + 1) % ACCENT_CYCLE.length]
      state.accent = next
    },    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    setCartDrawer(state, action) {
      state.cartDrawerOpen = action.payload
    },
  },
})

export const { setAccent, cycleAccent, toggleSidebar, setCartDrawer } = uiSlice.actions
export default uiSlice.reducer
