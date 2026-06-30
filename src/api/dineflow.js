import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('dineflow_auth') || '{}')
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  const tenant = JSON.parse(localStorage.getItem('dineflow_tenant') || 'null')
  if (tenant?._id) {
    config.headers['X-Restaurant-Id'] = tenant._id
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const suspendedMsg = error.response?.data?.message === 'Restaurant suspended by super admin'
    if (error.response?.status === 403 && suspendedMsg) {
      const tenant = JSON.parse(localStorage.getItem('dineflow_tenant') || 'null')
      const name = tenant?.name ? encodeURIComponent(tenant.name) : ''
      const target = name ? `/restaurant-suspended?name=${name}` : '/restaurant-suspended'
      if (!window.location.pathname.startsWith('/restaurant-suspended')) {
        window.location.assign(target)
      }
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      const auth = JSON.parse(localStorage.getItem('dineflow_auth') || '{}')
      if (auth.refreshToken && !error.config._retry) {
        error.config._retry = true
        try {
          const { data } = await axios.post('/auth/refresh', { refreshToken: auth.refreshToken })
          localStorage.setItem('dineflow_auth', JSON.stringify({
            ...auth,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }))
         error.config.headers = error.config.headers || {}
error.config.headers.Authorization = `Bearer ${data.accessToken}`
          return api(error.config)
        } catch {
          localStorage.removeItem('dineflow_auth')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  sendOtp: (data) => api.post('/auth/otp/send', data),
  verifyOtp: (data) => api.post('/auth/otp/verify', data),
  sendWhatsappOtp: (data) => api.post('/auth/send-whatsapp-otp', data),
  verifyWhatsappOtp: (data) => api.post('/auth/verify-whatsapp-otp', data),
  sendEmailOtp: (data) => api.post('/auth/email-otp/send', data),
  verifyEmailSignup: (data) => api.post('/auth/email-otp/verify-signup', data),
  verifyEmailLogin: (data) => api.post('/auth/email-otp/verify-login', data),
  me: () => api.get('/auth/me'),
  logout: (data) => api.post('/auth/logout', data),
  impersonate: (id) => api.post(`/auth/impersonate/${id}`),
}

export const platformAPI = {
  overview: () => api.get('/platform/overview'),
  orders: (params) => api.get('/platform/orders', { params }),
  restaurants: (params) => api.get('/platform/restaurants', { params }),
  createRestaurant: (data) => api.post('/platform/restaurants', data),
  createRestaurantAdmin: (id, data) => api.post(`/platform/restaurants/${id}/admins`, data),
  restaurantStaff: (id) => api.get(`/platform/restaurants/${id}/staff`),
  createRestaurantStaff: (id, data) => api.post(`/platform/restaurants/${id}/staff`, data),
  restaurantAdmins: (id) => api.get(`/platform/restaurants/${id}/admins`),
  updateRestaurant: (id, data) => api.put(`/platform/restaurants/${id}`, data),
  suspend: (id) => api.patch(`/platform/restaurants/${id}/suspend`),
  activate: (id) => api.patch(`/platform/restaurants/${id}/activate`),
  deleteRestaurant: (id) => api.delete(`/platform/restaurants/${id}`),
  analytics: (id) => api.get(`/platform/restaurants/${id}/analytics`),
  contacts: (params) => api.get('/platform/contacts', { params }),
  updateContact: (id, data) => api.patch(`/platform/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/platform/contacts/${id}`),
}

export const publicAPI = {
  validateScan: (restaurantId, tableId) => api.get('/public/scan/validate', {
    params: { restaurantId, tableId },
  }),
  getScanMenu: (restaurantId, tableId) => api.get('/public/scan/menu', {
    params: { restaurantId, tableId },
  }),
  validateTable: (slug, tableToken) => api.get(`/public/${slug}/table`, { params: { table: tableToken } }),
  getTables: (slug) => api.get(`/public/${slug}/tables`),
  getMenu: (slug) => api.get(`/public/${slug}/menu`),
  getPopularItems: (slug) => api.get(`/public/${slug}/popular-items`),
  placeOrder: (slug, data) => api.post(`/public/${slug}/orders`, data),
  trackOrder: (orderId) => api.get(`/public/orders/${orderId}/track`),
  submitContact: (data) => api.post('/public/contact', data),
}

export const restaurantAPI = (restaurantId) => ({
  tables: () => api.get(`/restaurants/${restaurantId}/tables`),
  createTable: (data) => api.post(`/restaurants/${restaurantId}/tables`, data),
  createTablesBulk: (data) => api.post(`/restaurants/${restaurantId}/tables/bulk`, data),
  updateTable: (id, data) => api.put(`/restaurants/${restaurantId}/tables/${id}`, data),
  deleteTable: (id) => api.delete(`/restaurants/${restaurantId}/tables/${id}`),
  regenerateTableQR: (id) => api.post(`/restaurants/${restaurantId}/tables/${id}/qr`),
  regenerateAllTableQR: () => api.post(`/restaurants/${restaurantId}/tables/qr/regenerate-all`),
  updateTableStatus: (id, status) => api.patch(`/restaurants/${restaurantId}/tables/${id}/status`, { status }),
  categories: () => api.get(`/restaurants/${restaurantId}/categories`),
  createCategory: (data) => api.post(`/restaurants/${restaurantId}/categories`, data),
  menu: (params) => api.get(`/restaurants/${restaurantId}/menu`, { params }),
  createMenuItem: (data) => {
    if (data instanceof FormData) {
      return api.post(`/restaurants/${restaurantId}/menu`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    return api.post(`/restaurants/${restaurantId}/menu`, data)
  },
  orders: (params) => api.get(`/restaurants/${restaurantId}/orders`, { params }),
  kitchenOrders: () => api.get(`/restaurants/${restaurantId}/orders/kitchen`),
  updateOrderStatus: (id, status, note) => api.patch(`/restaurants/${restaurantId}/orders/${id}/status`, { status, note }),
  placeCustomerOrder: (data) => {
    if (data instanceof FormData) {
      return api.post(`/restaurants/${restaurantId}/customer-orders`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    return api.post(`/restaurants/${restaurantId}/customer-orders`, data)
  },
  previewCheckout: (data) => api.post(`/restaurants/${restaurantId}/checkout-preview`, data),
  verifyUpiPayment: (data) => {
    if (data instanceof FormData) {
      return api.post(`/restaurants/${restaurantId}/verify-upi-payment`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    return api.post(`/restaurants/${restaurantId}/verify-upi-payment`, data)
  },
  checkInTable: (data) => api.post(`/restaurants/${restaurantId}/table-check-in`, data),
  validateTableQr: (data) => api.post(`/restaurants/${restaurantId}/validate-table-qr`, data),
  getMyTableSession: () => api.get(`/restaurants/${restaurantId}/my-table-session`),
  validateCoupon: (data) => api.post(`/restaurants/${restaurantId}/coupons/validate`, data),
  myOrders: () => api.get(`/restaurants/${restaurantId}/my-orders`),
  analytics: () => api.get(`/restaurants/${restaurantId}/analytics`),
  toggleAvailability: (id) => api.patch(`/restaurants/${restaurantId}/menu/${id}/toggle`),
  updateMenuItem: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/restaurants/${restaurantId}/menu/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    return api.put(`/restaurants/${restaurantId}/menu/${id}`, data)
  },
  deleteMenuItem: (id) => api.delete(`/restaurants/${restaurantId}/menu/${id}`),
  deleteCategory: (id) => api.delete(`/restaurants/${restaurantId}/categories/${id}`),
  coupons: () => api.get(`/restaurants/${restaurantId}/coupons`),
  createCoupon: (data) => api.post(`/restaurants/${restaurantId}/coupons`, data),
  updateCoupon: (id, data) => api.put(`/restaurants/${restaurantId}/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/restaurants/${restaurantId}/coupons/${id}`),
  toggleCoupon: (id) => api.patch(`/restaurants/${restaurantId}/coupons/${id}/toggle`),
  getSettings: () => api.get(`/restaurants/${restaurantId}/settings`),
  updateSettings: (data) => api.put(`/restaurants/${restaurantId}/settings`, data),
  staff: () => api.get(`/restaurants/${restaurantId}/staff`),
  createStaff: (data) => api.post(`/restaurants/${restaurantId}/staff`, data),
  updateStaff: (membershipId, data) => api.patch(`/restaurants/${restaurantId}/staff/${membershipId}`, data),
  removeStaff: (membershipId) => api.delete(`/restaurants/${restaurantId}/staff/${membershipId}`),
})

export default api
