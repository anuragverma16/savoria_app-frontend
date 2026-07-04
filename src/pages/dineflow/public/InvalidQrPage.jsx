import { Link } from 'react-router-dom'
import { FiAlertTriangle } from 'react-icons/fi'

export default function InvalidQrPage() {
  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-5">
        <FiAlertTriangle className="text-red-400" size={32} />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Invalid QR Code</h1>
      <p className="text-white/50 text-sm max-w-md mb-8">
        This QR code is not valid. Please scan the QR code placed on your restaurant table.
      </p>
      <Link
        to="/order/scan"
        className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400"
      >
        Scan table QR
      </Link>
    </div>
  )
}
