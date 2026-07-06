import { useNavigate } from 'react-router-dom'
import SavoriaQrScanModal from '../../components/savoria/SavoriaQrScanModal'
import { loadSavoriaSession } from '../../utils/savoriaGuestSession'
import { orderDashboardAfterScan } from '../../utils/orderPanelPaths'

/** Full-screen QR scanner — auto-starts camera on phone */
export default function SavoriaOrderScanPage() {
  const navigate = useNavigate()

  const handleClose = () => {
    const session = loadSavoriaSession()
    if (session?.rid && session?.tableId) {
      navigate(orderDashboardAfterScan(session.rid, {
        _id: session.tableId,
        tableId: session.tableId,
        tableNumber: session.tableNumber,
        tableToken: session.tableToken,
      }), { replace: true })
      return
    }
    navigate('/order/dashboard', { replace: true })
  }

  return (
    <SavoriaQrScanModal
      open
      onClose={handleClose}
    />
  )
}
