import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiShield, FiGrid, FiUsers, FiUser } from 'react-icons/fi'
import { setImpersonating, setViewAsPanel } from '../store/slices/tenantSlice'
import { ToggleButton, ToggleGroup } from './dineflow/ToggleGroup'
import AnimatedButton from './dineflow/AnimatedButton'
import { getSuperAdminPreviewPanels, isSuperAdminUser, getEffectivePanel, grantProvisionPreview } from '../utils/panelRole'

const PANEL_META = {
  admin: { id: 'admin', label: 'Admin', icon: FiGrid, path: 'admin', color: 'orange' },
  staff: { id: 'staff', label: 'Staff', icon: FiUsers, path: 'staff', color: 'green' },
  user: { id: 'user', label: 'Customer', icon: FiUser, path: 'user', color: 'blue' },
}

export default function SuperAdminPanelBar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((s) => s.auth)
  const { activeRestaurant, viewAsPanel, impersonating } = useSelector((s) => s.tenant)

  const isSuperAdmin = isSuperAdminUser(user)
  if (!isSuperAdmin || !activeRestaurant?._id || !impersonating) return null

  const rid = activeRestaurant._id
  const base = `/restaurant/${rid}`
  const previewPanels = getSuperAdminPreviewPanels(activeRestaurant)
  const panels = previewPanels.map((id) => PANEL_META[id]).filter(Boolean)
  const activePanel = getEffectivePanel(user, {
    impersonating,
    viewAsPanel,
    pathname: location.pathname,
  })

  const goToPanel = (panel) => {
    grantProvisionPreview(rid, panel.id)
    dispatch(setImpersonating(true))
    dispatch(setViewAsPanel(panel.id))
    navigate(`${base}/${panel.path}`)
  }

  return (
    <div className="shrink-0 z-40 df-panel-bar px-3 sm:px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-2 min-h-[40px]">
        <AnimatedButton
          type="button"
          onClick={() => {
            dispatch(setImpersonating(false))
            dispatch(setViewAsPanel(null))
            navigate('/platform')
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-orange-500/40 bg-orange-500/20 text-orange-300 text-xs font-semibold shrink-0 hover:bg-orange-500/30"
        >
          <FiShield size={12} /> Platform
        </AnimatedButton>

        <span className="text-xs text-white/60 truncate max-w-[140px] hidden sm:inline">
          {activeRestaurant.name}
        </span>

        {panels.length > 0 ? (
          <ToggleGroup className="ml-auto flex-shrink-0 overflow-x-auto max-w-full pb-0.5">
            {panels.map((p) => (
              <ToggleButton
                key={p.id}
                active={activePanel === p.id}
                onClick={() => goToPanel(p)}
                color={p.color}
                variant="dark"
                className="flex items-center gap-1 px-3 py-2 text-[10px] sm:text-xs whitespace-nowrap"
              >
                <p.icon size={12} /> {p.label}
              </ToggleButton>
            ))}
          </ToggleGroup>
        ) : (
          <span className="ml-auto text-[10px] text-white/40">Customer preview</span>
        )}
      </div>
    </div>
  )
}
