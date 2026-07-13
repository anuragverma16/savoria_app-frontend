import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { platformAPI } from '../api/dineflow'
import { setActiveRestaurant, setImpersonating } from '../store/slices/tenantSlice'
import { resolveAuthGateState } from '../utils/authEntry'
import {
  activeRestaurantId,
  getRedirectAfterLogin,
  hasRestaurantAccess,
  normalizeRestaurant,
  pickMembership,
  restaurantIdOf,
  resolveRestaurantForId,
  shouldBlockSuspendedRestaurant,
  isSuperAdminUser,
} from '../utils/panelRole'

export default function RestaurantBootstrap({ children }) {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, memberships } = useSelector((s) => s.auth)
  const tenant = useSelector((s) => s.tenant)
  const [ready, setReady] = useState(false)
  const bootedForRef = useRef('')

  useEffect(() => {
    let cancelled = false

    const finish = () => {
      if (!cancelled) {
        bootedForRef.current = String(restaurantId || '')
        setReady(true)
      }
    }

    async function sync() {
      const ridKey = String(restaurantId || '')
      const showBlockingLoad = bootedForRef.current !== ridKey
      if (showBlockingLoad) setReady(false)

      if (!restaurantId) {
        finish()
        return
      }

      const isSuperAdmin = isSuperAdminUser(user)

      if (!isSuperAdmin && !hasRestaurantAccess(user, memberships, restaurantId)) {
        const membership = pickMembership(user, memberships, user?.role)
        const ownId = restaurantIdOf(membership)
        if (ownId) {
          navigate(getRedirectAfterLogin(user, membership), { replace: true })
        } else if (user) {
          navigate('/unauthorized', { replace: true })
        } else {
          const gate = resolveAuthGateState(`/restaurant/${restaurantId}/admin`)
          navigate(gate.path, {
            replace: true,
            state: { openAuth: true, authRole: gate.authRole, from: { pathname: `/restaurant/${restaurantId}/admin` } },
          })
        }
        finish()
        return
      }

      const currentRid = activeRestaurantId(tenant.activeRestaurant)
      const hasUserCounts = tenant.activeRestaurant?.userCounts != null
      const sameRestaurant = currentRid === String(restaurantId)

      if (sameRestaurant && hasUserCounts) {
        if (shouldBlockSuspendedRestaurant(user, tenant.activeRestaurant, tenant)) {
          navigate('/restaurant-suspended', { replace: true, state: { restaurantName: tenant.activeRestaurant?.name } })
          finish()
          return
        }
        if (isSuperAdmin && !tenant.impersonating) dispatch(setImpersonating(true))
        finish()
        return
      }

      const fromMembership = memberships?.find((m) => restaurantIdOf(m) === String(restaurantId))
      const fromRestaurant = normalizeRestaurant(fromMembership?.restaurant)
      if (fromRestaurant && !isSuperAdmin) {
        if (shouldBlockSuspendedRestaurant(user, fromRestaurant, tenant)) {
          navigate('/restaurant-suspended', { replace: true, state: { restaurantName: fromRestaurant.name } })
          finish()
          return
        }
        dispatch(setActiveRestaurant(fromRestaurant))
        finish()
        return
      }

      const userRestaurant = normalizeRestaurant(user?.restaurant)
      if (userRestaurant && String(userRestaurant._id) === String(restaurantId) && !isSuperAdmin) {
        if (shouldBlockSuspendedRestaurant(user, userRestaurant, tenant)) {
          navigate('/restaurant-suspended', { replace: true, state: { restaurantName: userRestaurant.name } })
          finish()
          return
        }
        dispatch(setActiveRestaurant(userRestaurant))
        finish()
        return
      }

      if (isSuperAdmin) {
        if (!tenant.impersonating) dispatch(setImpersonating(true))
        try {
          const { data } = await platformAPI.restaurants()
          if (cancelled) return
          const restaurant = data.restaurants?.find((r) => String(r._id) === String(restaurantId))
          if (restaurant) {
            const needsUpdate = !sameRestaurant || !hasUserCounts
            if (needsUpdate) dispatch(setActiveRestaurant(restaurant))
          } else if (!(sameRestaurant && tenant.activeRestaurant)) {
            navigate('/platform', { replace: true })
            finish()
            return
          }
        } catch {
          if (!sameRestaurant || !tenant.activeRestaurant) {
            navigate('/platform', { replace: true })
            finish()
            return
          }
        }
      } else {
        const restaurant = resolveRestaurantForId({
          memberships,
          user,
          activeRestaurant: tenant.activeRestaurant,
          restaurantId,
        })
        if (shouldBlockSuspendedRestaurant(user, restaurant, tenant)) {
          navigate('/restaurant-suspended', { replace: true, state: { restaurantName: restaurant?.name } })
          finish()
          return
        }
      }

      finish()
    }

    sync()
    return () => { cancelled = true }
  }, [restaurantId, user?._id, memberships, dispatch, navigate])

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/40 text-sm">
        Loading restaurant...
      </div>
    )
  }

  return children
}
