import { useEffect, useState } from 'react'
import { FiMaximize2, FiUsers } from 'react-icons/fi'
import { publicAPI } from '../../api/dineflow'

const STATUS_LABEL = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  cleaning: 'Cleaning',
}

export default function UserTableQrGrid({ slug, onSelect, linking, selectedTableId }) {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    publicAPI.getTables(slug)
      .then(({ data }) => setTables(data.tables || []))
      .catch(() => setError('Could not load table QR codes'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 animate-pulse">
            <div className="aspect-square rounded-xl bg-white/10 mb-3" />
            <div className="h-4 bg-white/10 rounded w-2/3 mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-center text-red-300/80 text-sm py-8">{error}</p>
    )
  }

  if (!tables.length) {
    return (
      <p className="text-center text-white/40 text-sm py-8">No tables available.</p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {tables.map((table) => {
        const blocked = ['reserved', 'cleaning'].includes(table.status) || table.seatsAvailable <= 0
        const isSelected = selectedTableId === table._id
        const busy = linking && isSelected

        return (
          <button
            key={table._id}
            type="button"
            disabled={blocked || linking}
            onClick={() => !blocked && onSelect?.(table)}
            className={`text-left rounded-2xl border p-3 sm:p-4 transition-all ${
              blocked
                ? 'border-white/10 bg-white/[0.02] opacity-50 cursor-not-allowed'
                : isSelected
                  ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-400/40'
                  : 'border-emerald-500/25 bg-white/[0.04] hover:border-emerald-400/50 hover:bg-emerald-500/10 active:scale-[0.98]'
            }`}
          >
            <div className="rounded-xl bg-white p-2 sm:p-3 mb-3 shadow-inner">
              {table.qrCodeUrl ? (
                <img
                  src={table.qrCodeUrl}
                  alt={`Table ${table.tableNumber} QR`}
                  className="w-full aspect-square object-contain"
                  draggable={false}
                />
              ) : (
                <div className="aspect-square flex items-center justify-center text-slate-400 text-xs">
                  QR loading…
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-white font-bold text-sm sm:text-base">
                Table {table.tableNumber || table.label}
              </p>
              <p className="text-white/40 text-[10px] sm:text-xs mt-0.5 flex items-center justify-center gap-1">
                <FiUsers size={10} />
                {table.seatsAvailable > 0
                  ? `${table.seatsAvailable} seat${table.seatsAvailable !== 1 ? 's' : ''} free`
                  : `${table.capacity} seats`}
              </p>
              <span className={`inline-block mt-1.5 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                blocked ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'
              }`}>
                {busy ? 'Linking…' : STATUS_LABEL[table.displayStatus || table.status] || table.status}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
