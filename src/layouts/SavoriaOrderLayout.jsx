import { Outlet, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiLogOut } from 'react-icons/fi'
import BrandLogo from '../components/dineflow/BrandLogo'
import BrandMark from '../components/dineflow/BrandMark'
import ThemeToggle from '../components/dineflow/ThemeToggle'
import SavoriaPublicBootstrap from '../components/SavoriaPublicBootstrap'
import OrderScanBootstrap from '../components/OrderScanBootstrap'
import ScanFlowHistoryLock from '../components/ScanFlowHistoryLock'
import { useSavoriaGuest } from '../contexts/SavoriaGuestContext'
import { useOrderPanelQuery } from '../hooks/useOrderPanelQuery'
import { useTableSessionGuard } from '../hooks/useTableSessionGuard'
import { navigateHomeAfterLogout } from '../utils/authEntry'
import { shouldPreservePanelAuthDuringQrOrder } from '../utils/panelAuthPreserve'
import toast from 'react-hot-toast'

function OrderShell() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const {
    isAuthenticated,
    userDisplayName,
    logoutGuest,
    session,
    isQrTableFlow,
  } = useSavoriaGuest()
  const { withQuery } = useOrderPanelQuery()
  const navigate = useNavigate()
  const rid = activeRestaurant?._id || session?.rid
  const scanLocked = Boolean(session?.scanLocked && session?.qrLinked && session?.rid)

  useTableSessionGuard(rid, {
    enabled: Boolean(isAuthenticated && rid && session?.qrLinked),
    restaurant: activeRestaurant || { _id: rid, slug: session?.slug, name: session?.restaurantName },
  })

  const handleLogout = () => {
    const keepPanel = shouldPreservePanelAuthDuringQrOrder()
    logoutGuest()
    toast.success(keepPanel ? 'Order account signed out' : 'Signed out')
    if (!keepPanel && !isQrTableFlow) {
      navigateHomeAfterLogout(navigate)
    }
  }

  const restaurantLabel = activeRestaurant?.name || session?.restaurantName || 'Savoria'
  const tableLabel = session?.tableNumber ? `Table ${session.tableNumber}` : null

  return (
    <div
      className={`df-page flex min-h-[100dvh] ${scanLocked ? 'sv-order-shell' : 'df-dark-panel df-panel-layout user-panel--shell'}`}
      data-savoria-theme="dark"
    >
      <ScanFlowHistoryLock />

      {!scanLocked && (
        <aside className="hidden lg:flex w-60 h-full border-r border-[var(--df-border)] flex-col shrink-0 overflow-hidden bg-slate-950/90 user-panel--nav">
          <div className="p-4 border-b border-[var(--df-border)] shrink-0">
            <div className="flex items-center gap-2.5 mb-2 text-white">
              <BrandMark size="sm" />
              <BrandLogo className="text-sm" accentClass="text-emerald-400" />
            </div>
            <p className="text-xs text-white/50 truncate">{restaurantLabel}</p>
          </div>
        </aside>
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {!scanLocked && (
        <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--sv-border)]/60 sv-glass">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandMark size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--sv-text)] truncate max-w-[200px]">
                {restaurantLabel}
              </p>
              <p className="text-[11px] text-[var(--sv-text-muted)] truncate">
                {tableLabel || (isQrTableFlow ? 'Guest · sign in at payment' : 'Order panel')}
                {isAuthenticated && userDisplayName ? ` · ${userDisplayName}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
        )}

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden sv-order-main">
          <OrderScanBootstrap>
            <Outlet />
          </OrderScanBootstrap>
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
