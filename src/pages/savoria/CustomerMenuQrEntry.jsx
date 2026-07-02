import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { validateAndLinkScan } from '../../utils/linkGuestTablePublic'
import { getCartRestaurantConflict } from '../../utils/cartRestaurantConflict'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import SavoriaMenuPage from './SavoriaMenuPage'
import CartRestaurantSwitchDialog from '../../components/savoria/CartRestaurantSwitchDialog'

export default function CustomerMenuQrEntry() {
  const { restaurantId, tableId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cartState = useSelector((s) => s.cart)
  const {
    confirmRestaurantSwitch,
    cancelRestaurantSwitch,
    switchPrompt,
    paths,
    loadMenu,
  } = useSavoriaGuest()

  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [pendingLink, setPendingLink] = useState(null)

  const runLink = async (force = false) => {
    if (!restaurantId || !tableId) {
      navigate('/invalid-qr', { replace: true })
      return
    }

    if (!force) {
      const conflict = getCartRestaurantConflict(cartState, restaurantId)
      if (conflict) {
        setPendingLink({ restaurantId, tableId })
        setStatus('confirm-switch')
        return
      }
    }

    setStatus('loading')
    setError(null)
    try {
      const result = await validateAndLinkScan(dispatch, restaurantId, tableId)
      if (!result.booked) {
        navigate('/table-not-found', {
          replace: true,
          state: { message: result.message || 'Table is not available right now.' },
        })
        return
      }
      await loadMenu?.()
      setStatus('ready')
    } catch (err) {
      if (err.code === 'INVALID_QR') {
        navigate('/invalid-qr', { replace: true })
        return
      }
      if (err.code === 'TABLE_NOT_FOUND') {
        navigate('/table-not-found', { replace: true })
        return
      }
      setError(err.message || 'Could not open menu')
      setStatus('error')
    }
  }

  useEffect(() => {
    runLink()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, tableId])

  const handleConfirmSwitch = async () => {
    await confirmRestaurantSwitch?.()
    if (pendingLink) {
      await runLink(true)
      setPendingLink(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center px-6 text-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--sv-accent)]/30 border-t-[var(--sv-accent)] animate-spin" />
        <p className="text-sm text-[var(--sv-text-muted)]">Opening your table menu…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-sm text-[var(--sv-text-muted)]">{error}</p>
        <button type="button" onClick={() => runLink(true)} className="sv-btn-primary">
          Try again
        </button>
      </div>
    )
  }

  return (
    <>
      <SavoriaMenuPage />
      <CartRestaurantSwitchDialog
        open={Boolean(switchPrompt) || status === 'confirm-switch'}
        onConfirm={handleConfirmSwitch}
        onCancel={() => {
          cancelRestaurantSwitch?.()
          setPendingLink(null)
          if (status === 'confirm-switch') navigate(paths?.orders || '/orders', { replace: true })
        }}
      />
    </>
  )
}
