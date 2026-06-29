import { Link, useLocation } from 'react-router-dom'
import { FiLink } from 'react-icons/fi'
import { buildUserTablesPath } from '../../utils/tableQueryParams'

/** Shown when guest must book a table via link before ordering */
export default function TableLinkRequired({ restaurantId, title = 'Book your table first' }) {
  const location = useLocation()
  const tablesPath = location.pathname.startsWith('/order')
    ? '/order/tables?scan=1'
    : buildUserTablesPath(restaurantId)

  return (
    <div className="user-panel min-h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5">
        <FiLink className="text-emerald-400" size={28} />
      </div>
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <Link
        to={tablesPath}
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400"
      >
        <FiLink size={16} />
        Open table booking
      </Link>
    </div>
  )
}
