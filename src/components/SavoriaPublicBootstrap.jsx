import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { publicAPI } from '../api/dineflow'
import { setActiveRestaurant } from '../store/slices/tenantSlice'
import { loadSavoriaSession, patchSavoriaSession } from '../utils/savoriaGuestSession'
import { hasScanParams } from '../utils/scanLink'

function scanScopeKey(rid, tableId) {
  if (!rid || !tableId) return null
  return `${rid}:${tableId}`
}

function readUrlScanIds(searchParams) {
  return {
    rid: searchParams.get('restaurantId') || searchParams.get('rid'),
    tableId: searchParams.get('tableId'),
  }
}

export default function SavoriaPublicBootstrap({ children }) {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const bootstrappedRef = useRef(null)
  const [ready, setReady] = useState(() => {
    const session = loadSavoriaSession() || {}
    return Boolean(session.qrLinked || session.slug || hasScanParams(searchParams))
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const session = loadSavoriaSession() || {}
      const { rid: urlRid, tableId: urlTableId } = readUrlScanIds(searchParams)
      const rid = urlRid || session.rid
      const tableId = urlTableId || session.tableId
      const slug = session.slug || searchParams.get('slug')
      const urlHasScan = Boolean(urlRid && urlTableId)
      const scopeKey = rid && tableId ? scanScopeKey(rid, tableId) : null

      if (scopeKey && bootstrappedRef.current === scopeKey) {
        setReady(true)
        return
      }

      setError(null)

      if (urlHasScan || (session.qrLinked && rid && tableId)) {
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
            tableNumber: data.table?.tableNumber ?? session.tableNumber,
            tableToken: data.table?.qrToken || session.tableToken,
          })
          bootstrappedRef.current = scanScopeKey(restaurant._id, data.table?._id || tableId)
        } catch (err) {
          if (!cancelled) {
            const msg = err.response?.data?.message
              || 'Could not load your table menu. Check the link or scan again.'
            setError(msg)
          }
        }
        if (!cancelled) setReady(true)
        return
      }

      if (!slug) {
        if (!cancelled) setReady(true)
        return
      }

      setReady(false)
      try {
        const { data } = await publicAPI.getMenu(slug)
        if (cancelled) return
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
          setError('Restaurant mismatch. Scan your table QR again.')
          setReady(true)
          return
        }

        if (restaurant._id || restaurant.slug) {
          dispatch(setActiveRestaurant(restaurant))
          patchSavoriaSession({
            rid: restaurant._id || rid,
            slug: restaurant.slug,
            restaurantName: restaurant.name,
          })
          if (rid) bootstrappedRef.current = `slug:${restaurant.slug || slug}`
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
      <div className="min-h-[100dvh] flex flex-col items-center justify-center text-white/60 text-sm gap-2 bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        Opening menu…
      </div>
    )
  }

  if (error) {
    const session = loadSavoriaSession()
    const { rid: urlRid, tableId: urlTableId } = readUrlScanIds(searchParams)
    if (!session?.slug && !session?.qrLinked && !(urlRid && urlTableId)) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0a]">
          <p className="text-amber-300/90 text-sm mb-2">{error}</p>
          <p className="text-white/40 text-xs max-w-sm">Scan the QR on your table to connect.</p>
        </div>
      )
    }
  }

  return children
}
