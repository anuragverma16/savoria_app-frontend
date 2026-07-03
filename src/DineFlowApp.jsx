import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'

import LandingPage from './pages/dineflow/LandingPage'
import SignInRedirect from './pages/dineflow/SignInRedirect'
import UnauthorizedPage from './pages/dineflow/UnauthorizedPage'
import SuspendedRestaurantPage from './pages/dineflow/SuspendedRestaurantPage'
import PlatformLayout from './layouts/PlatformLayout'
import RestaurantLayout from './layouts/RestaurantLayout'
import RestaurantBootstrap from './components/RestaurantBootstrap'
import SuperAdminDashboard from './pages/dineflow/platform/SuperAdminDashboard'
import AccountSettingsPage from './pages/dineflow/AccountSettingsPage'
import AdminDashboard from './pages/dineflow/restaurant/AdminDashboard'
import KitchenDisplay from './pages/dineflow/restaurant/KitchenDisplay'
import TablesPage from './pages/dineflow/restaurant/TablesPage'
import OrdersPage from './pages/dineflow/restaurant/OrdersPage'
import MenuManagementPage from './pages/dineflow/restaurant/MenuManagementPage'
import UserDashboard from './pages/dineflow/restaurant/UserDashboard'
import CustomerDashboardRoute from './pages/dineflow/restaurant/CustomerDashboardRoute'
import UserTableBookPage from './pages/dineflow/restaurant/UserTableBookPage'
import UserMenuPage from './pages/dineflow/restaurant/UserMenuPage'
import CouponsPage from './pages/dineflow/restaurant/CouponsPage'
import AnalyticsPage from './pages/dineflow/restaurant/AnalyticsPage'
import SettingsPage from './pages/dineflow/restaurant/SettingsPage'
import StaffManagementPage from './pages/dineflow/restaurant/StaffManagementPage'

import QRMenuRoute from './pages/dineflow/public/QRMenuRoute'
import TableQrLanding from './pages/dineflow/public/TableQrLanding'
import ScanLandingPage from './pages/dineflow/public/ScanLandingPage'
import InvalidQrPage from './pages/dineflow/public/InvalidQrPage'
import TableNotFoundPage from './pages/dineflow/public/TableNotFoundPage'
import ScannedRestaurantGuard from './components/ScannedRestaurantGuard'
import SavoriaOrderLayout from './layouts/SavoriaOrderLayout'
import SavoriaQrEntry from './pages/savoria/SavoriaQrEntry'
import SavoriaUserDashboard from './pages/savoria/SavoriaUserDashboard'
import SavoriaOrderHistoryPage from './pages/savoria/SavoriaOrderHistoryPage'
import SavoriaActiveOrdersPage from './pages/savoria/SavoriaActiveOrdersPage'
import SavoriaOrderDetailsPage from './pages/savoria/SavoriaOrderDetailsPage'
import MenuQrRedirect from './pages/savoria/MenuQrRedirect'
import SavoriaMenuPage from './pages/savoria/SavoriaMenuPage'
import SavoriaCartPage from './pages/savoria/SavoriaCartPage'
import SavoriaCheckoutPage from './pages/savoria/SavoriaCheckoutPage'
import SavoriaOrderSuccessPage from './pages/savoria/SavoriaOrderSuccessPage'
import CustomerTableGuard from './components/CustomerTableGuard'
import StaffDashboard from './pages/dineflow/restaurant/StaffDashboard'
import StaffTablesPage from './pages/dineflow/restaurant/StaffTablesPage'
import StaffMenuStockPage from './pages/dineflow/restaurant/StaffMenuStockPage'
import { getEffectivePanel, getDefaultPath, hasRestaurantAccess, activeRestaurantId, isSuperAdminUser, shouldBlockSuspendedRestaurant, getSuperAdminPreviewPanels, getSuperAdminPreviewPath } from './utils/panelRole'
import { resolveAuthGateState } from './utils/authEntry'
import { SavoriaGuestProvider } from './contexts/SavoriaGuestContext'
import GuestOrderPanelGuard from './components/GuestOrderPanelGuard'
import AppAuthModal from './components/AppAuthModal'

function ProtectedRoute({ children, roles, loginPath, openOtpOnLogin = false }) {
  const { user, accessToken } = useSelector((s) => s.auth)
  const location = useLocation()
  const gate = resolveAuthGateState(location.pathname)
  const target = loginPath ?? gate.path

  if (!accessToken || !user) {
    return (
      <Navigate
        to={target}
        state={{
          from: location,
          openAuth: true,
          authRole: gate.authRole,
          ...(openOtpOnLogin ? { openAuth: true } : {}),
        }}
        replace
      />
    )
  }
  if (roles && !roles.includes(user.role) && user.platformRole !== 'superadmin') {
    return <Navigate to="/unauthorized" replace />
  }
  return children
}

function RestaurantGuard({ children }) {
  const { user, accessToken, memberships } = useSelector((s) => s.auth)
  const { activeRestaurant, impersonating } = useSelector((s) => s.tenant)
  const { restaurantId } = useParams()
  const location = useLocation()
  const isSuperAdmin = isSuperAdminUser(user)

  if (!accessToken || !user) {
    const gate = resolveAuthGateState(location.pathname)
    return (
      <Navigate
        to={gate.path}
        state={{ from: location, openAuth: true, authRole: gate.authRole }}
        replace
      />
    )
  }

  if (shouldBlockSuspendedRestaurant(user, activeRestaurant, { impersonating })) {
    return (
      <Navigate
        to="/restaurant-suspended"
        replace
        state={{ restaurantName: activeRestaurant?.name }}
      />
    )
  }

  const hasTenant = activeRestaurant && String(activeRestaurantId(activeRestaurant)) === String(restaurantId)
  const hasMembership = hasRestaurantAccess(user, memberships, restaurantId)

  if (!isSuperAdmin && !hasTenant && !hasMembership) {
    return <Navigate to="/unauthorized" replace />
  }
  if (isSuperAdmin && !activeRestaurant && !impersonating) {
    return <Navigate to="/platform" replace />
  }
  return children
}

function RoleGate({ allowed, children }) {
  const { user } = useSelector((s) => s.auth)
  const { impersonating, viewAsPanel, activeRestaurant } = useSelector((s) => s.tenant)
  const { restaurantId } = useParams()
  const location = useLocation()

  const panel = getEffectivePanel(user, { impersonating, viewAsPanel, pathname: location.pathname })
  const isSuperAdmin = user?.platformRole === 'superadmin' || user?.role === 'superadmin'

  if (isSuperAdmin && impersonating) {
    const previewPanels = getSuperAdminPreviewPanels(activeRestaurant)
    if (!previewPanels.includes(panel)) {
      return <Navigate to={getSuperAdminPreviewPath(activeRestaurant, previewPanels[0] || 'user')} replace />
    }
    if (!allowed.includes(panel)) {
      return <Navigate to={getDefaultPath(restaurantId, panel)} replace />
    }
    return children
  }

  if (user?.role === 'staff' && !allowed.includes('staff')) {
    return <Navigate to={getDefaultPath(restaurantId, 'staff')} replace />
  }

  if (user?.role === 'admin' && !allowed.includes('admin') && !allowed.includes('staff')) {
    return <Navigate to={getDefaultPath(restaurantId, 'admin')} replace />
  }

  if (!allowed.includes(user?.role) && !isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

function TablesRoute() {
  const { user } = useSelector((s) => s.auth)
  const tenant = useSelector((s) => s.tenant)
  const location = useLocation()
  const panel = getEffectivePanel(user, { ...tenant, pathname: location.pathname })
  if (panel === 'staff') return <StaffTablesPage />
  return <TablesPage />
}

function LegacyOrderSuccessRedirect() {
  const { orderId } = useParams()
  return <Navigate to={`/order/success/${orderId}`} replace />
}

function LegacyOrderDetailRedirect() {
  const { orderId } = useParams()
  return <Navigate to={`/order/orders/${orderId}`} replace />
}

function PortalEntry() {
  return <Navigate to="/" state={{ openAuth: true, from: { pathname: '/platform' } }} replace />
}

export default function DineFlowApp() {
  return (
  <SavoriaGuestProvider>
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<SignInRedirect />} />
        <Route path="/sign-in" element={<SignInRedirect />} />
        <Route path="/user/sign-in" element={<Navigate to="/sign-in?role=user" replace />} />
        <Route path="/portal" element={<PortalEntry />} />
        <Route path="/staff" element={<Navigate to="/sign-in?role=staff" replace />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/restaurant-suspended" element={<SuspendedRestaurantPage />} />
        <Route path="/book-table" element={<TableQrLanding />} />
        <Route path="/scan-table" element={<TableQrLanding />} />
        <Route path="/scan" element={<ScanLandingPage />} />
        <Route path="/invalid-qr" element={<InvalidQrPage />} />
        <Route path="/table-not-found" element={<TableNotFoundPage />} />
        <Route path="/r/:slug/order" element={<QRMenuRoute />} />

        <Route path="/order" element={<GuestOrderPanelGuard><SavoriaOrderLayout /></GuestOrderPanelGuard>}>
          <Route index element={<SavoriaQrEntry />} />
          <Route path="dashboard" element={<SavoriaUserDashboard />} />
          <Route path="settings" element={<AccountSettingsPage />} />
          <Route path="orders" element={<SavoriaOrderHistoryPage />} />
          <Route path="orders/:orderId" element={<SavoriaOrderDetailsPage />} />
          <Route path="active" element={<SavoriaActiveOrdersPage />} />
          <Route path="history" element={<SavoriaOrderHistoryPage />} />
          <Route path="tables" element={<UserTableBookPage />} />
          <Route path="menu" element={<ScannedRestaurantGuard requireTable><SavoriaMenuPage /></ScannedRestaurantGuard>} />
          <Route path="menu-browse" element={<ScannedRestaurantGuard requireTable><SavoriaMenuPage /></ScannedRestaurantGuard>} />
          <Route path="cart" element={<CustomerTableGuard><SavoriaCartPage /></CustomerTableGuard>} />
          <Route path="checkout" element={<CustomerTableGuard><SavoriaCheckoutPage /></CustomerTableGuard>} />
          <Route path="success/:orderId" element={<SavoriaOrderSuccessPage />} />
        </Route>

        <Route path="/menu/:restaurantId/:tableId" element={<MenuQrRedirect />} />

        <Route path="/cart" element={<Navigate to="/order/cart" replace />} />
        <Route path="/checkout" element={<Navigate to="/order/checkout" replace />} />
        <Route path="/order-success/:orderId" element={<LegacyOrderSuccessRedirect />} />
        <Route path="/orders/:orderId" element={<LegacyOrderDetailRedirect />} />
        <Route path="/orders" element={<Navigate to="/order/history" replace />} />

        <Route path="/platform" element={
          <ProtectedRoute roles={['superadmin']} loginPath="/" openOtpOnLogin>
            <PlatformLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="settings" element={<AccountSettingsPage variant="platform" />} />
          <Route path="profile" element={<Navigate to="/platform/settings" replace />} />
        </Route>

        <Route path="/restaurant/:restaurantId" element={
          <ProtectedRoute>
            <RestaurantBootstrap>
              <RestaurantGuard>
                <RestaurantLayout />
              </RestaurantGuard>
            </RestaurantBootstrap>
          </ProtectedRoute>
        }>
          <Route path="admin" element={<RoleGate allowed={['admin']}><AdminDashboard /></RoleGate>} />
          <Route path="staff" element={<RoleGate allowed={['staff']}><StaffDashboard /></RoleGate>} />
          <Route path="orders" element={<RoleGate allowed={['admin', 'staff']}><OrdersPage /></RoleGate>} />
          <Route path="kitchen" element={<RoleGate allowed={['admin', 'staff']}><KitchenDisplay /></RoleGate>} />
          <Route path="tables" element={<RoleGate allowed={['admin', 'staff']}><TablesRoute /></RoleGate>} />
          <Route path="menu-stock" element={<RoleGate allowed={['staff']}><StaffMenuStockPage /></RoleGate>} />
          <Route path="menu" element={<RoleGate allowed={['admin']}><MenuManagementPage /></RoleGate>} />
          <Route path="user" element={<RoleGate allowed={['user']}><CustomerDashboardRoute /></RoleGate>} />
          <Route path="user/tables" element={<RoleGate allowed={['user']}><UserTableBookPage /></RoleGate>} />
          <Route path="user/scan" element={<Navigate to="tables" replace />} />
          <Route path="user/menu" element={<RoleGate allowed={['user']}><UserMenuPage /></RoleGate>} />
          <Route path="coupons" element={<RoleGate allowed={['admin']}><CouponsPage /></RoleGate>} />
          <Route path="staff-team" element={<RoleGate allowed={['admin']}><StaffManagementPage /></RoleGate>} />
          <Route path="analytics" element={<RoleGate allowed={['admin']}><AnalyticsPage /></RoleGate>} />
          <Route path="account" element={<RoleGate allowed={['admin', 'staff', 'user']}><AccountSettingsPage /></RoleGate>} />
          <Route path="profile" element={<Navigate to="account" replace />} />
          <Route path="settings" element={<RoleGate allowed={['admin']}><SettingsPage /></RoleGate>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        gutter={12}
        containerStyle={{
          top: 'max(1rem, env(safe-area-inset-top))',
          right: 'max(1rem, env(safe-area-inset-right))',
          zIndex: 99999,
        }}
        toastOptions={{
          duration: 4500,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '16px',
            padding: '14px 16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            maxWidth: '380px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid #e2e8f0',
          },
          success: {
            duration: 5000,
            style: {
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
            },
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            duration: 5500,
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            },
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <AppAuthModal />
    </>
  </SavoriaGuestProvider>
  )
}
