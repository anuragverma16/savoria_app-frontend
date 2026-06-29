import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiLink, FiChevronUp } from 'react-icons/fi'
import QrCodeScanner from '../dineflow/QrCodeScanner'
import { parseTableQr } from '../../utils/parseTableQr'
import { parseTableBookingLink } from '../../utils/tableBookingLink'
import { linkGuestTablePublic, validateAndLinkScan, menuPathAfterTableLink } from '../../utils/linkGuestTablePublic'
import { linkTableFromQr } from '../../utils/linkTableFromQr'
import { patchSavoriaSession } from '../../utils/savoriaGuestSession'
import { setActiveRestaurant } from '../../store/slices/tenantSlice'
import { publicAPI } from '../../api/dineflow'
import toast from 'react-hot-toast'

export default function SavoriaQrScanModal({ open, onClose }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const { user, accessToken } = useSelector((s) => s.auth)
  const [linkInput, setLinkInput] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const [linking, setLinking] = useState(false)
  const isLoggedIn = Boolean(accessToken && user)

  useEffect(() => {
    if (!open) {
      setLinkInput('')
      setShowPaste(false)
      setLinking(false)
      document.body.classList.remove('sv-scanner-open')
      return undefined
    }
    document.body.classList.add('sv-scanner-open')
    return () => document.body.classList.remove('sv-scanner-open')
  }, [open])

  const bootstrapRestaurant = async (slug, rid) => {
    if (!slug) return activeRestaurant
    try {
      const { data } = await publicAPI.getMenu(slug)
      const restaurant = {
        _id: rid || data.restaurant?._id,
        name: data.restaurant?.name,
        slug: data.restaurant?.slug || slug,
        settings: data.restaurant?.settings,
        logo: data.restaurant?.logo,
        address: data.restaurant?.address,
      }
      dispatch(setActiveRestaurant(restaurant))
      patchSavoriaSession({ rid: restaurant._id, slug: restaurant.slug, restaurantName: restaurant.name })
      return restaurant
    } catch {
      return activeRestaurant
    }
  }

  const finishLink = (table, restaurant) => {
    toast.success(`Table ${table.tableNumber} linked!`)
    onClose()
    navigate(menuPathAfterTableLink(restaurant?._id || activeRestaurant?._id, table, true))
  }

  const handleTableLink = async (parsed) => {
    if (!parsed || linking) return

    const restaurantId = parsed.restaurantId || parsed.rid
    const tableId = parsed.tableId

    setLinking(true)
    try {
      if (restaurantId && tableId) {
        const result = await validateAndLinkScan(dispatch, restaurantId, tableId)
        if (!result.booked) {
          toast.error(result.message || 'Table not available')
          return
        }
        const restaurant = result.restaurant || { _id: restaurantId }
        dispatch(setActiveRestaurant({
          _id: restaurant._id || restaurantId,
          name: restaurant.name,
          slug: restaurant.slug,
        }))
        finishLink(result.table, restaurant)
        return
      }

      if (!parsed?.tableToken && !parsed?.slug) {
        toast.error('Invalid table QR')
        return
      }

      const slug = parsed.slug || activeRestaurant?.slug
      let restaurant = activeRestaurant

      if (slug && (!restaurant?._id || restaurant.slug !== slug)) {
        restaurant = await bootstrapRestaurant(slug, parsed.rid)
      }

      if (!slug) {
        toast.error('Scan a valid restaurant table QR')
        return
      }

      if (isLoggedIn && restaurant?._id) {
        const result = await linkTableFromQr(dispatch, restaurant, {
          tableToken: parsed.tableToken,
          tableId: parsed.tableId,
        }, { guestName: user?.name, guestPhone: user?.phone })
        if (!result.booked) {
          toast.error(result.message || 'Table not available')
          return
        }
        finishLink(result.table, restaurant)
        return
      }

      const result = await linkGuestTablePublic(dispatch, {
        slug,
        tableToken: parsed.tableToken,
        tableId: parsed.tableId,
        restaurant,
      })
      if (!result.booked) {
        toast.error(result.message || 'Table not available')
        return
      }
      finishLink(result.table, restaurant)
    } catch (e) {
      if (e.code === 'INVALID_QR') toast.error('Invalid QR Code')
      else if (e.code === 'TABLE_NOT_FOUND') toast.error('Table Not Found')
      else toast.error(e.message || 'Could not link table')
    } finally {
      setLinking(false)
    }
  }

  const handleScan = (parsed) => handleTableLink(typeof parsed === 'string' ? parseTableQr(parsed) : parsed)
  const handlePasteLink = () => handleTableLink(parseTableBookingLink(linkInput.trim()))

  if (!open) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="mobile-scanner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="sv-mobile-scanner fixed inset-0 z-[200] flex flex-col bg-black"
        style={{ height: '100dvh' }}
      >
        <header className="sv-mobile-scanner-header shrink-0 flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            aria-label="Close scanner"
          >
            <FiX size={22} />
          </button>
          <div className="text-center flex-1 px-3">
            <p className="text-white font-semibold text-base">Scan QR Code</p>
            <p className="text-white/50 text-xs mt-0.5">Point at the QR on your table</p>
          </div>
          <div className="w-10" aria-hidden />
        </header>

        <QrCodeScanner
          active={open}
          fullscreen
          autoStart
          onScan={handleScan}
          onError={() => {}}
        />

        <footer className="sv-mobile-scanner-footer shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          {linking ? (
            <p className="text-center text-emerald-400 text-sm font-medium animate-pulse">Linking table…</p>
          ) : (
            <p className="text-center text-white/60 text-sm">
              Place the QR inside the frame — scanning is automatic
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowPaste((v) => !v)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-white/45 text-xs font-medium"
          >
            <FiLink size={14} />
            Paste link instead
            <FiChevronUp size={14} className={`transition-transform ${showPaste ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showPaste && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 pt-2">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="Paste table link"
                    className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handlePasteLink}
                    disabled={linking}
                    className="shrink-0 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Open
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </footer>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}
