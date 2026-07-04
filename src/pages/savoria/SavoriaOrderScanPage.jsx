import { useNavigate } from 'react-router-dom'
import SavoriaQrScanModal from '../../components/savoria/SavoriaQrScanModal'

/** Full-screen QR scanner — auto-starts camera on phone */
export default function SavoriaOrderScanPage() {
  const navigate = useNavigate()

  return (
    <SavoriaQrScanModal
      open
      onClose={() => navigate('/order/dashboard', { replace: true })}
    />
  )
}
