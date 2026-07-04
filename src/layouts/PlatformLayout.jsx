import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiHome, FiLogOut, FiShield } from 'react-icons/fi'
import { logout } from '../store/slices/authSlice'
import ThemeToggle from '../components/dineflow/ThemeToggle'
import BrandLogo from '../components/dineflow/BrandLogo'
import BrandMark from '../components/dineflow/BrandMark'

export default function PlatformLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/', {
      replace: true,
      state: {
        openAuth: true,
        authRole: 'superadmin',
        from: { pathname: '/platform' },
        redirectPath: '/platform',
      },
    })
  }

  return (
    <div className="df-page df-dark-panel df-panel-layout flex flex-col">
      <header className="shrink-0 z-50 df-glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
          <Link to="/platform" className="flex items-center gap-2.5 text-white">
            <BrandMark size="sm" />
            <BrandLogo className="text-lg" accentClass="df-text-accent" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              title="Marketing home"
            >
              <FiHome size={15} />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--df-border)] text-sm text-white/80">
              <FiShield className="df-text-accent" size={14} />
              {(user?.name || 'Super Admin').replace(/DineFlow/gi, 'Savoria')}
            </div>
            <button type="button" onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400">
              <FiLogOut />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-5 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
