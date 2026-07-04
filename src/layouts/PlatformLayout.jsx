import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiHome, FiLogOut, FiShield, FiGrid, FiSettings } from 'react-icons/fi'
import ThemeToggle from '../components/dineflow/ThemeToggle'
import BrandLogo from '../components/dineflow/BrandLogo'
import BrandMark from '../components/dineflow/BrandMark'
import { useSavoriaGuest } from '../contexts/SavoriaGuestContext'

const NAV = [
  { to: '/platform', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/platform/settings', label: 'Settings', icon: FiSettings },
]

function SidebarFooter({ onLogout }) {
  return (
    <div className="p-3 border-t border-[var(--df-border)] space-y-2 shrink-0">
      <ThemeToggle />
      <Link
        to="/"
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
      >
        <FiHome size={16} />
        Back to home
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
      >
        <FiLogOut size={16} />
        Logout
      </button>
    </div>
  )
}

export default function PlatformLayout() {
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const { logoutGuest } = useSavoriaGuest()

  const handleLogout = () => {
    logoutGuest()
    navigate('/', { replace: true })
  }

  return (
    <div className="df-page df-dark-panel df-panel-layout flex min-h-[100dvh]">
      <aside className="hidden lg:flex w-60 h-full border-r border-[var(--df-border)] flex-col shrink-0 overflow-hidden bg-black/50">
        <div className="p-4 border-b border-[var(--df-border)] shrink-0">
          <div className="flex items-center gap-2.5 mb-2 text-white">
            <BrandMark size="sm" />
            <BrandLogo className="text-sm" accentClass="df-text-accent" />
          </div>
          <span className="text-[10px] df-text-accent border border-[var(--df-border)] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <FiShield size={10} />
            Super Admin
          </span>
          <p className="text-xs text-white/50 truncate mt-2">
            {(user?.name || 'Super Admin').replace(/DineFlow/gi, 'Savoria')}
          </p>
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
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <SidebarFooter onLogout={handleLogout} />
      </aside>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden min-w-0">
        <header className="df-panel-mobile-header lg:hidden shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <BrandMark size="sm" />
            <div className="min-w-0">
              <span className="text-sm font-semibold text-white truncate block">Super Admin</span>
              <span className="text-[11px] text-white/55 truncate block max-w-[160px]">
                {(user?.name || 'Platform').replace(/DineFlow/gi, 'Savoria')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
              aria-label="Back to home"
            >
              <FiHome size={17} />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400"
              aria-label="Logout"
            >
              <FiLogOut size={17} />
            </button>
            <ThemeToggle />
          </div>
        </header>

        <nav className="panel-mobile-nav lg:hidden shrink-0 flex border-b border-white/10 bg-slate-950/80">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold min-w-0 ${
                  isActive ? 'text-orange-400' : 'text-white/45'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="df-panel-main max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
