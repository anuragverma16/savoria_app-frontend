import { Link, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiGrid, FiLink, FiShoppingBag, FiHome, FiLogOut } from 'react-icons/fi'
import BrandLogo from '../components/dineflow/BrandLogo'
import BrandMark from '../components/dineflow/BrandMark'
import ThemeToggle from '../components/dineflow/ThemeToggle'
import SavoriaPublicBootstrap from '../components/SavoriaPublicBootstrap'
import { useSavoriaGuest } from '../contexts/SavoriaGuestContext'
import { useOrderPanelPaths } from '../utils/orderPanelPaths'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/order/dashboard', label: 'Home', icon: FiGrid, end: true },
  { to: '/order/tables', label: 'Book table', icon: FiLink },
  { to: '/order/menu', label: 'Menu', icon: FiShoppingBag },
]

function OrderShell() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const panelPaths = useOrderPanelPaths()
  const {
    isAuthenticated,
    userDisplayName,
    logoutGuest,
    session,
    auth,
  } = useSavoriaGuest()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutGuest()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="df-page df-dark-panel df-panel-layout flex user-panel--shell min-h-[100dvh]">
      <aside className="hidden lg:flex w-60 h-full border-r border-[var(--df-border)] flex-col shrink-0 overflow-hidden bg-slate-950/90 user-panel--nav">
        <div className="p-4 border-b border-[var(--df-border)] shrink-0">
          <div className="flex items-center gap-2.5 mb-2 text-white">
            <BrandMark size="sm" />
            <BrandLogo className="text-sm" accentClass="text-emerald-400" />
          </div>
          <p className="text-xs text-white/50 truncate">
            {activeRestaurant?.name || auth?.restaurantName || session?.restaurantName || 'Scan table QR'}
          </p>
          {session?.tableNumber && session?.qrLinked && (
            <p className="text-[10px] text-emerald-400/90 mt-1 font-semibold">Table {session.tableNumber}</p>
          )}
          {isAuthenticated && (
            <p className="text-[10px] text-emerald-400/80 mt-1 truncate">Hi, {userDisplayName}</p>
          )}
        </div>
        <nav className="flex-1 min-h-0 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive ? 'df-nav-active font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--df-border)] space-y-1 shrink-0">
          <Link
            to={panelPaths.siteHome || '/'}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <FiHome size={18} />
            Back to home
          </Link>
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
            >
              <FiLogOut size={18} />
              Logout
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <header className="lg:hidden shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <BrandMark size="sm" />
            <div className="min-w-0">
              {isAuthenticated ? (
                <span className="text-sm font-semibold text-emerald-400 truncate block max-w-[140px]">
                  Hi, {userDisplayName}
                </span>
              ) : null}
              <span className="text-[11px] text-white/55 truncate block max-w-[140px]">
                {session?.tableNumber ? `Table ${session.tableNumber}` : (activeRestaurant?.name || 'Savoria')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={panelPaths?.siteHome || '/'}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
              aria-label="Back to home"
            >
              <FiHome size={17} />
            </Link>
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400"
                aria-label="Logout"
              >
                <FiLogOut size={17} />
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>

        <nav className="lg:hidden shrink-0 flex border-b border-white/10 bg-slate-950/80">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${
                  isActive ? 'text-emerald-400' : 'text-white/45'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function SavoriaOrderLayout() {
  return (
    <SavoriaPublicBootstrap>
      <OrderShell />
    </SavoriaPublicBootstrap>
  )
}
