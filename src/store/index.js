import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import tenantReducer from './slices/tenantSlice'
import cartReducer from './slices/cartSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    cart: cartReducer,
    ui: uiReducer,
  },
})

export default store
