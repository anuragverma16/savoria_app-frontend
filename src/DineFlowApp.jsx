import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'

import LandingPage from './pages/dineflow/LandingPage'
import DineFlowLogin from './pages/dineflow/LoginPage'
import UserSignInPage from './pages/dineflow/UserSignInPage'
import UnauthorizedPage from './pages/dineflow/UnauthorizedPage'
import SuspendedRestaurantPage from './pages/dineflow/SuspendedRestaurantPage'
import PlatformLayout from './layouts/PlatformLayout'
import RestaurantLayout from './layouts/RestaurantLayout'
import RestaurantBootstrap from './components/RestaurantBootstrap'
import SuperAdminDashboard from './pages/dineflow/platform/SuperAdminDashboard'
import AdminDashboard from './pages/dineflow/restaurant/AdminDashboard'
import KitchenDisplay from './pages/dineflow/restaurant/KitchenDisplay'
import TablesPage from './pages/dineflow/restaurant/TablesPage'
import OrdersPage from './pages/dineflow/restaurant/OrdersPage'
import MenuManagementPage from './pages/dineflow/restaurant/MenuManagementPage'
import UserDashboard from './pages/dineflow/restaurant/UserDashboard'
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
import StaffDashboard from './pages/dineflow/restaurant/StaffDashboard'
import StaffTablesPage from './pages/dineflow/restaurant/StaffTablesPage'
import StaffMenuStockPage from './pages/dineflow/restaurant/StaffMenuStockPage'
import { getEffectivePanel, getDefaultPath, hasRestaurantAccess, activeRestaurantId, isSuperAdminUser, shouldBlockSuspendedRestaurant } from './utils/panelRole'
import { SavoriaGuestProvider } from './contexts/SavoriaGuestContext'
import AppAuthModal from './components/AppAuthModal'

function resolveLoginPath(pathname) {
  if (pathname.startsWith('/platform')) return '/login?role=superadmin'
  if (/^\/restaurant\/[^/]+\/user(\/|$)/.test(pathname)) return '/login?role=user'
  if (/^\/restaurant\/[^/]+\/(staff|orders|kitchen|tables|menu-stock)(\/|$)/.test(pathname)) return '/login?role=staff'
  if (/^\/restaurant\//.test(pathname)) return '/login?role=admin'
  return '/login'
}

function ProtectedRoute({ children, roles, loginPath }) {
  const { user, accessToken } = useSelector((s) => s.auth)
  const location = useLocation()
  const target = loginPath ?? resolveLoginPath(location.pathname)

  if (!accessToken || !user) {
    return <Navigate to={target} state={{ from: location }} replace />
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
    return <Navigate to="/login" state={{ from: location }} replace />
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
  const { impersonating, viewAsPanel } = useSelector((s) => s.tenant)
  const { restaurantId } = useParams()
  const location = useLocation()

  const panel = getEffectivePanel(user, { impersonating, viewAsPanel, pathname: location.pathname })
  const isSuperAdmin = user?.platformRole === 'superadmin' || user?.role === 'superadmin'

  if (isSuperAdmin && impersonating) {
    if (!allowed.includes(panel)) {
      return <Navigate to={getDefaultPath(restaurantId, panel)} replace />
    }
    return children
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

export default function DineFlowApp() {
  return (
  <SavoriaGuestProvider>
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<DineFlowLogin />} />
        <Route path="/user/sign-in" element={<UserSignInPage />} />
        <Route path="/portal" element={<Navigate to="/login?role=superadmin" replace />} />
        <Route path="/staff" element={<Navigate to="/login?role=staff" replace />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/restaurant-suspended" element={<SuspendedRestaurantPage />} />
        <Route path="/book-table" element={<TableQrLanding />} />
        <Route path="/scan-table" element={<TableQrLanding />} />
        <Route path="/scan" element={<ScanLandingPage />} />
        <Route path="/invalid-qr" element={<InvalidQrPage />} />
        <Route path="/table-not-found" element={<TableNotFoundPage />} />
        <Route path="/r/:slug/order" element={<QRMenuRoute />} />

        <Route path="/order" element={<SavoriaOrderLayout />}>
          <Route index element={<SavoriaQrEntry />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="tables" element={<UserTableBookPage />} />
          <Route path="menu" element={<ScannedRestaurantGuard requireTable><UserMenuPage /></ScannedRestaurantGuard>} />
        </Route>

        <Route path="/platform" element={
          <ProtectedRoute roles={['superadmin']} loginPath="/login?role=superadmin">
            <PlatformLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SuperAdminDashboard />} />
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
          <Route path="user" element={<RoleGate allowed={['user']}><UserDashboard /></RoleGate>} />
          <Route path="user/tables" element={<RoleGate allowed={['user']}><UserTableBookPage /></RoleGate>} />
          <Route path="user/scan" element={<Navigate to="tables" replace />} />
          <Route path="user/menu" element={<RoleGate allowed={['user']}><UserMenuPage /></RoleGate>} />
          <Route path="coupons" element={<RoleGate allowed={['admin']}><CouponsPage /></RoleGate>} />
          <Route path="staff-team" element={<RoleGate allowed={['admin']}><StaffManagementPage /></RoleGate>} />
          <Route path="analytics" element={<RoleGate allowed={['admin']}><AnalyticsPage /></RoleGate>} />
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
