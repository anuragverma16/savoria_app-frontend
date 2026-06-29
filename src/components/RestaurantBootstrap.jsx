import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { platformAPI } from '../api/dineflow'
import { setActiveRestaurant, setImpersonating } from '../store/slices/tenantSlice'
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

  useEffect(() => {
    let cancelled = false

    const finish = () => {
      if (!cancelled) setReady(true)
    }

    async function sync() {
      setReady(false)

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
          navigate('/login', { replace: true })
        }
        finish()
        return
      }

      const currentRid = activeRestaurantId(tenant.activeRestaurant)
      if (currentRid === String(restaurantId)) {
        if (shouldBlockSuspendedRestaurant(user, tenant.activeRestaurant, tenant)) {
          navigate('/restaurant-suspended', { replace: true, state: { restaurantName: tenant.activeRestaurant?.name } })
          finish()
          return
        }
        finish()
        return
      }

      const fromMembership = memberships?.find((m) => restaurantIdOf(m) === String(restaurantId))
      const fromRestaurant = normalizeRestaurant(fromMembership?.restaurant)
      if (fromRestaurant) {
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
      if (userRestaurant && String(userRestaurant._id) === String(restaurantId)) {
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
          const restaurant = data.restaurants?.find((r) => String(r._id) === String(restaurantId))
          if (restaurant) {
            dispatch(setActiveRestaurant(restaurant))
          } else {
            navigate('/platform', { replace: true })
            finish()
            return
          }
        } catch { /* ignore */ }
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
  }, [restaurantId, tenant.activeRestaurant, tenant.impersonating, memberships, user, dispatch, navigate])

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/40 text-sm">
        Loading restaurant...
      </div>
    )
  }

  return children
}
