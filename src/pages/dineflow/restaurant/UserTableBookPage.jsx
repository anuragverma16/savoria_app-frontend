import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FiLink } from 'react-icons/fi'
import TableBookingLinksPanel from '../../../components/dineflow/TableBookingLinksPanel'
import SavoriaBrandedQrScanCard from '../../../components/savoria/SavoriaBrandedQrScanCard'
import { publicAPI } from '../../../api/dineflow'
import { readTableParamsFromSearch } from '../../../utils/tableQueryParams'
import { buildMenuAutoLinkPath } from '../../../utils/tableBookingLink'
import { buildOrderMenuAutoLinkPath, useOrderPanelPaths } from '../../../utils/orderPanelPaths'
import { useSavoriaGuestOptional } from '../../../contexts/SavoriaGuestContext'
import { linkGuestTablePublic, menuPathAfterTableLink } from '../../../utils/linkGuestTablePublic'
import { linkTableFromQr } from '../../../utils/linkTableFromQr'
import { clearUserTableSession, hasQrTableSession } from '../../../utils/userTableSession'
import { clearCart, initCart } from '../../../store/slices/cartSlice'
import toast from 'react-hot-toast'

/** Table booking — same UI for /order and /restaurant/:rid/user/tables */
export default function UserTableBookPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const { user, accessToken } = useSelector((s) => s.auth)
  const panelPaths = useOrderPanelPaths()
  const savoriaGuest = useSavoriaGuestOptional()
  const rid = panelPaths.rid || activeRestaurant?._id
  const slug = activeRestaurant?.slug
  const isLoggedIn = Boolean(
    (accessToken && user) || savoriaGuest?.isAuthenticated,
  )

  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [baseUrl, setBaseUrl] = useState('')

  const changeHandled = useRef(false)
  const deepLinkHandled = useRef(false)
  const linked = hasQrTableSession(rid)
  const changingTable = searchParams.get('change') === '1'

  useEffect(() => {
    if (panelPaths.isOrderPanel && searchParams.get('scan') === '1') {
      navigate('/order/scan', { replace: true })
    }
  }, [searchParams, panelPaths.isOrderPanel, navigate])

  useEffect(() => {
    if (!rid || changeHandled.current || searchParams.get('change') !== '1') return
    changeHandled.current = true
    clearUserTableSession(rid)
    dispatch(clearCart())
    dispatch(initCart({
      restaurantId: String(rid),
      tableToken: 'user-panel',
      table: null,
    }))
    navigate(panelPaths.tables, { replace: true })
  }, [rid, searchParams, dispatch, navigate, panelPaths.tables])

  useEffect(() => {
    if (!rid || deepLinkHandled.current || changingTable) return
    const params = readTableParamsFromSearch(searchParams)
    if (!params?.tableToken && !params?.tableId) return
    deepLinkHandled.current = true
    const path = panelPaths.isOrderPanel
      ? buildOrderMenuAutoLinkPath(rid, params)
      : buildMenuAutoLinkPath(rid, params)
    navigate(path, { replace: true })
  }, [rid, searchParams, navigate, changingTable, panelPaths.isOrderPanel])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    publicAPI.getTables(slug)
      .then(({ data }) => {
        setTables(data.tables || [])
        setBaseUrl(data.qrBaseUrl || '')
      })
      .catch(() => toast.error('Could not load tables'))
      .finally(() => setLoading(false))
  }, [slug])

  const bookTable = async (table) => {
    if (['reserved', 'cleaning'].includes(table.displayStatus || table.status)) {
      toast.error('This table is not available right now')
      return
    }

    if (panelPaths.isOrderPanel && !isLoggedIn && slug) {
      try {
        const result = await linkGuestTablePublic(dispatch, {
          slug,
          tableToken: table.qrToken,
          tableId: table._id,
          restaurant: activeRestaurant,
        })
        if (!result.booked) {
          toast.error(result.message || 'Table not available')
          return
        }
        toast.success(`Table ${result.table?.tableNumber} linked`)
        navigate(menuPathAfterTableLink(rid, result.table, true))
      } catch (e) {
        toast.error(e.message || 'Could not link table')
      }
      return
    }

    if (isLoggedIn && activeRestaurant) {
      try {
        const result = await linkTableFromQr(dispatch, activeRestaurant, {
          tableToken: table.qrToken,
          tableId: table._id,
        }, { guestName: user?.name, guestPhone: user?.phone })
        if (!result.booked) {
          toast.error(result.message || 'Table not available')
          return
        }
        toast.success(`Table ${result.table?.tableNumber} linked`)
        navigate(menuPathAfterTableLink(rid, result.table, panelPaths.isOrderPanel))
      } catch {
        toast.error('Could not link table')
      }
      return
    }

    navigate(menuPathAfterTableLink(rid, table, panelPaths.isOrderPanel))
  }

  return (
    <div className="user-panel min-h-full relative overflow-hidden">
      <div className="user-panel-glow pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-emerald-500/[0.1] to-transparent" />

      <div className="relative p-5 sm:p-8 max-w-4xl mx-auto pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-emerald-400/80 text-xs font-semibold uppercase tracking-[0.2em] mb-2">
            Table booking
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {changingTable ? 'Choose a new table' : 'Book your table'}
          </h1>
        </motion.div>

        {panelPaths.isOrderPanel && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex justify-center"
          >
            <SavoriaBrandedQrScanCard
              restaurantName={activeRestaurant?.name || 'Savoria'}
              hint="Tap to scan your table QR"
              onClick={() => navigate('/order/scan')}
            />
          </motion.div>
        )}

        {linked && !changingTable && (
          <div className="mb-6 p-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-3">
            <p className="text-emerald-300 text-sm font-semibold">You already have a table linked</p>
            <Link
              to={panelPaths.menu}
              className="inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Open menu →
            </Link>
          </div>
        )}

        {!slug && panelPaths.isOrderPanel ? (
          <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center text-white/45 text-sm">
            Scan your table QR above to load this restaurant&apos;s tables and menu.
          </div>
        ) : (
          <TableBookingLinksPanel
            tables={tables}
            restaurantId={rid}
            baseUrl={baseUrl}
            loading={loading}
            onBookTable={bookTable}
          />
        )}
      </div>
    </div>
  )
}
