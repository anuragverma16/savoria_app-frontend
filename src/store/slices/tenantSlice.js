import { createSlice } from '@reduxjs/toolkit'

const stored = JSON.parse(localStorage.getItem('dineflow_tenant') || 'null')
const storedPanel = localStorage.getItem('dineflow_view_panel')
const storedImpersonating = localStorage.getItem('dineflow_impersonating') === 'true'

const tenantSlice = createSlice({
  name: 'tenant',
  initialState: {
    activeRestaurant: stored,
    impersonating: storedImpersonating,
    viewAsPanel: storedPanel || null,
  },
  reducers: {
    setActiveRestaurant(state, action) {
      state.activeRestaurant = action.payload
      localStorage.setItem('dineflow_tenant', JSON.stringify(action.payload))
    },
    setImpersonating(state, action) {
      state.impersonating = action.payload
      if (action.payload) localStorage.setItem('dineflow_impersonating', 'true')
      else localStorage.removeItem('dineflow_impersonating')
    },
    setViewAsPanel(state, action) {
      state.viewAsPanel = action.payload
      if (action.payload) localStorage.setItem('dineflow_view_panel', action.payload)
      else localStorage.removeItem('dineflow_view_panel')
    },
    clearTenant(state) {
      state.activeRestaurant = null
      state.impersonating = false
      state.viewAsPanel = null
      localStorage.removeItem('dineflow_tenant')
      localStorage.removeItem('dineflow_view_panel')
      localStorage.removeItem('dineflow_impersonating')
    },
  },
})

export const { setActiveRestaurant, setImpersonating, setViewAsPanel, clearTenant } = tenantSlice.actions
export default tenantSlice.reducer
