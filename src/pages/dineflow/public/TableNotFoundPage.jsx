import { Link, useLocation } from 'react-router-dom'
import { FiMapPin } from 'react-icons/fi'

export default function TableNotFoundPage() {
  const location = useLocation()
  const message = location.state?.message

  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-5">
        <FiMapPin className="text-amber-400" size={32} />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Table Not Found</h1>
      <p className="text-white/50 text-sm max-w-md mb-8">
        {message || 'We could not find this table. It may have been removed or the QR code is outdated. Please ask staff for help.'}
      </p>
      <Link
        to="/order/tables?scan=1"
        className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400"
      >
        Scan another table
      </Link>
    </div>
  )
}
