import { useMemo, useState } from 'react'
import { FiLink, FiCopy, FiExternalLink } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { buildTableBookingUrl, copyTableBookingLink } from '../../utils/tableBookingLink'

const STATUS_STYLES = {
  available: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  occupied: 'bg-red-500/15 text-red-300 border-red-500/30',
  reserved: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  cleaning: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
}

function tableLink(table, restaurantId, baseUrl) {
  return table.bookingUrl || table.qrTargetUrl || buildTableBookingUrl(restaurantId, table, baseUrl)
}

export default function TableBookingLinksPanel({
  tables = [],
  restaurantId,
  baseUrl = '',
  loading = false,
  onBookTable,
  showAdminActions = false,
}) {
  const [copiedId, setCopiedId] = useState(null)

  const sorted = useMemo(() => [...tables].sort((a, b) => {
    const na = Number(a.tableNumber)
    const nb = Number(b.tableNumber)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
    return String(a.tableNumber).localeCompare(String(b.tableNumber), undefined, { numeric: true })
  }), [tables])

  const copyLink = async (table) => {
    try {
      await copyTableBookingLink(tableLink(table, restaurantId, baseUrl))
      setCopiedId(table._id)
      toast.success(`Table ${table.tableNumber} link copied`)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="h-28 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
        ))}
      </div>
    )
  }

  if (!sorted.length) {
    return (
      <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center text-white/40 text-sm">
        No tables yet.
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((table) => {
          const status = table.displayStatus || table.status || 'available'
          const url = tableLink(table, restaurantId, baseUrl)
          const blocked = ['reserved', 'cleaning'].includes(status)

          return (
            <div
              key={table._id}
              className="p-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:border-emerald-500/30 transition-colors flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-2xl font-bold text-white">{table.tableNumber}</p>
                  {table.location && (
                    <p className="text-[10px] text-white/30 mt-0.5 truncate">{table.location}</p>
                  )}
                </div>
                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full border font-bold shrink-0 ${STATUS_STYLES[status] || STATUS_STYLES.available}`}>
                  {status}
                </span>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => onBookTable(table)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiLink size={14} />
                  Book & order
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyLink(table)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold border border-white/10 text-white/60 hover:text-emerald-300 hover:border-emerald-500/30 flex items-center justify-center gap-1"
                  >
                    <FiCopy size={12} />
                    {copiedId === table._id ? 'Copied' : 'Copy link'}
                  </button>
                  {showAdminActions && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white flex items-center"
                      title="Open link"
                    >
                      <FiExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}
