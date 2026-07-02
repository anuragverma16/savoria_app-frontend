import { useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  FiGrid, FiList, FiSettings, FiBarChart2,
  FiLogOut, FiCoffee, FiMaximize2, FiHome, FiShoppingBag, FiTag, FiUsers, FiLink,
} from 'react-icons/fi'
import { GiKnifeFork } from 'react-icons/gi'
import SuperAdminPanelBar from '../components/SuperAdminPanelBar'
import ThemeToggle from '../components/dineflow/ThemeToggle'
import BrandLogo from '../components/dineflow/BrandLogo'
import BrandMark from '../components/dineflow/BrandMark'
import { logout } from '../store/slices/authSlice'
import { clearTenant, setViewAsPanel } from '../store/slices/tenantSlice'
import { getEffectivePanel, activeRestaurantId, panelFromPathname } from '../utils/panelRole'

const adminNav = [
  { to: 'admin', label: 'Dashboard', icon: FiGrid },
  { to: 'orders', label: 'Orders', icon: FiList },
  { to: 'kitchen', label: 'Kitchen', icon: GiKnifeFork },
  { to: 'tables', label: 'Tables', icon: FiMaximize2 },
  { to: 'menu', label: 'Menu', icon: FiCoffee },
  { to: 'staff-team', label: 'Staff', icon: FiUsers },
  { to: 'coupons', label: 'Coupons', icon: FiTag },
  { to: 'analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: 'settings', label: 'Settings', icon: FiSettings },
]

const staffNav = [
  { to: 'staff', label: 'Dashboard', icon: FiGrid },
  { to: 'orders', label: 'Orders', icon: FiList },
  { to: 'kitchen', label: 'Kitchen', icon: GiKnifeFork },
  { to: 'tables', label: 'Tables', icon: FiMaximize2 },
  { to: 'menu-stock', label: 'Stock', icon: FiCoffee },
]

const userNav = [
  { to: 'user', label: 'Home', icon: FiGrid },
  { to: 'user/tables', label: 'Book table', icon: FiLink },
  { to: 'user/menu', label: 'Menu', icon: FiShoppingBag },
]

const superAdminCustomerNav = [
  { to: 'user', label: 'Customers', icon: FiUsers },
]
export default function RestaurantLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { restaurantId: routeRestaurantId } = useParams()
  const { user, accessToken } = useSelector((s) => s.auth)
  const { activeRestaurant, impersonating, viewAsPanel } = useSelector((s) => s.tenant)
  const rid = activeRestaurantId(activeRestaurant) || routeRestaurantId
  const base = `/restaurant/${rid}`

  const panel = getEffectivePanel(user, { impersonating, viewAsPanel, pathname: location.pathname })
  const isSuperAdmin = user?.platformRole === 'superadmin' || user?.role === 'superadmin'
  const NAV = panel === 'user'
    ? (isSuperAdmin && impersonating ? superAdminCustomerNav : userNav)
    : panel === 'staff'
      ? staffNav
      : adminNav

  useEffect(() => {
    if (!isSuperAdmin || !impersonating) return
    const fromUrl = panelFromPathname(location.pathname)
    if (fromUrl !== viewAsPanel) {
      dispatch(setViewAsPanel(fromUrl))
    }
  }, [location.pathname, isSuperAdmin, impersonating, viewAsPanel, dispatch])

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearTenant())
    if (panel === 'user') navigate('/login?role=user')
    else if (panel === 'staff') navigate('/login?role=staff')
    else if (isSuperAdmin) navigate('/')
    else navigate('/login?role=admin')
  }

  return (
    <div className={`df-page df-dark-panel df-panel-layout flex ${panel === 'user' ? 'user-panel--shell' : ''}`}>
      <aside className={`w-60 h-full border-r border-[var(--df-border)] flex flex-col shrink-0 overflow-hidden ${
        panel === 'user' ? 'bg-slate-950/90 user-panel--nav' : 'bg-black/50'
      }`}>
        <div className="p-4 border-b border-[var(--df-border)] shrink-0">
          <div className="flex items-center gap-2.5 mb-2 text-white">
            <BrandMark size="sm" />
            <BrandLogo className="text-sm" accentClass="df-text-accent" />
          </div>
          <p className="text-xs text-white/50 truncate">{activeRestaurant?.name}</p>
          {impersonating && isSuperAdmin && (
            <span className="text-[10px] df-text-accent border border-[var(--df-border)] px-2 py-0.5 rounded-full mt-2 inline-block">
              Super Admin
            </span>
          )}
        </div>
        <nav className="flex-1 min-h-0 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={`${base}/${item.to}`}
              end={item.to === 'user'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive ? 'df-nav-active font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={16} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--df-border)] space-y-2 shrink-0">
          <ThemeToggle />
          {panel === 'user' && (
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5"
            >
              <FiHome size={16} /> Back to home
            </Link>
          )}
          {isSuperAdmin && (
            <NavLink to="/platform" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm df-text-accent hover:bg-white/5">
              <FiHome size={16} /> Platform
            </NavLink>
          )}
          {(panel !== 'user' || (accessToken && user)) && (
            <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10">
              <FiLogOut size={16} /> Logout
            </button>
          )}
        </div>
      </aside>
      <main className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
        <div className="shrink-0">
          <SuperAdminPanelBar />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
