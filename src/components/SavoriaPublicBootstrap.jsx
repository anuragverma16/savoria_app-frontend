import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { publicAPI } from '../api/dineflow'
import { setActiveRestaurant } from '../store/slices/tenantSlice'
import { loadSavoriaSession, patchSavoriaSession } from '../utils/savoriaGuestSession'

export default function SavoriaPublicBootstrap({ children }) {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setReady(false)
      setError(null)

      const session = loadSavoriaSession() || {}
      const rid = session.rid || searchParams.get('restaurantId') || searchParams.get('rid')
      const tableId = session.tableId || searchParams.get('tableId')
      const slug = session.slug || searchParams.get('slug')

      if (rid && tableId) {
        try {
          const { data } = await publicAPI.getScanMenu(rid, tableId)
          if (cancelled) return
          const restaurant = {
            _id: data.restaurant?._id || rid,
            name: data.restaurant?.name,
            slug: data.restaurant?.slug,
            settings: data.restaurant?.settings,
            address: data.restaurant?.address,
            logo: data.restaurant?.logo,
            phone: data.restaurant?.phone,
            email: data.restaurant?.email,
            gstNumber: data.restaurant?.gstNumber,
          }
          dispatch(setActiveRestaurant(restaurant))
          patchSavoriaSession({
            rid: restaurant._id,
            slug: restaurant.slug,
            restaurantName: restaurant.name,
            tableId: data.table?._id || tableId,
            tableNumber: data.table?.tableNumber || session.tableNumber,
            tableToken: data.table?.qrToken || session.tableToken,
            scanLocked: true,
            qrLinked: true,
          })
        } catch {
          if (!cancelled) setError('Could not load your table session. Scan your table QR again.')
        }
        if (!cancelled) setReady(true)
        return
      }

      if (!slug) {
        if (!cancelled) setReady(true)
        return
      }

      try {
        const { data } = await publicAPI.getMenu(slug)
        const restaurant = {
          _id: rid || data.restaurant?._id,
          name: data.restaurant?.name,
          slug: data.restaurant?.slug || slug,
          settings: data.restaurant?.settings,
          address: data.restaurant?.address,
          logo: data.restaurant?.logo,
          phone: data.restaurant?.phone,
          email: data.restaurant?.email,
          gstNumber: data.restaurant?.gstNumber,
        }

        if (session.scanLocked && session.rid && restaurant._id
          && String(session.rid) !== String(restaurant._id)) {
          if (!cancelled) setError('Restaurant mismatch. Scan your table QR again.')
          if (!cancelled) setReady(true)
          return
        }

        if (restaurant._id || restaurant.slug) {
          dispatch(setActiveRestaurant(restaurant))
          patchSavoriaSession({
            rid: restaurant._id || rid,
            slug: restaurant.slug,
            restaurantName: restaurant.name,
          })
        }
      } catch {
        if (!cancelled) setError('Could not load restaurant. Scan your table QR to try again.')
      }

      if (!cancelled) setReady(true)
    }

    bootstrap()
    return () => { cancelled = true }
  }, [searchParams, dispatch])

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white/40 text-sm gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        Loading restaurant…
      </div>
    )
  }

  if (error) {
    const session = loadSavoriaSession()
    if (!session?.slug && !session?.qrLinked) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <p className="text-amber-300/90 text-sm mb-2">{error}</p>
          <p className="text-white/40 text-xs max-w-sm">Scan the QR on your table to connect.</p>
        </div>
      )
    }
  }

  return children
}
