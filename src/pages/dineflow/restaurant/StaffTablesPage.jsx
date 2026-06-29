import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { FiGrid, FiUsers, FiRefreshCw, FiMapPin, FiClock } from 'react-icons/fi'
import { restaurantAPI } from '../../../api/dineflow'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  occupied: 'bg-red-500/20 text-red-400 border-red-500/30',
  reserved: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cleaning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const STATUSES = ['available', 'occupied', 'reserved', 'cleaning']

function sortTables(list) {
  return [...list].sort((a, b) => {
    const na = Number(a.tableNumber)
    const nb = Number(b.tableNumber)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
    return String(a.tableNumber).localeCompare(String(b.tableNumber), undefined, { numeric: true })
  })
}

function formatCreatedAt(date) {
  if (!date) return ''
  return new Date(date).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function StaffTablesPage() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const [tables, setTables] = useState([])
  const [newTableIds, setNewTableIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const rid = activeRestaurant?._id

  useEffect(() => {
    if (!rid) return
    load()
    const socket = io('/', { path: '/socket.io' })
    socket.emit('join-restaurant', rid)
    socket.on('tables-bulk-created', (batch) => {
      const ids = new Set((batch || []).map((t) => t._id))
      setNewTableIds(ids)
      load()
      toast.success(`${batch?.length || 0} new table(s) added by admin`, { icon: '🪑' })
      setTimeout(() => setNewTableIds(new Set()), 12000)
    })
    socket.on('table-updated', load)
    socket.on('new-order', load)
    socket.on('order-updated', load)
    return () => socket.disconnect()
  }, [rid])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await restaurantAPI(rid).tables()
      setTables(sortTables(data.tables || []))
    } catch {
      toast.error('Failed to load tables')
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => ({
    total: tables.length,
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied' || (t.activeGuestCount || 0) > 0).length,
    cleaning: tables.filter((t) => t.status === 'cleaning').length,
    seats: tables.reduce((sum, t) => sum + (t.capacity || 0), 0),
  }), [tables])

  const updateStatus = async (tableId, status) => {
    try {
      await restaurantAPI(rid).updateTableStatus(tableId, status)
      toast.success(`Table marked ${status}`)
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Tables</h1>
        </div>
        <button type="button" onClick={load} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10">
          <FiRefreshCw size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <span className="px-3 py-1 rounded-lg bg-white/5 text-xs">{stats.total} total</span>
        <span className="px-3 py-1 rounded-lg bg-violet-500/10 text-xs text-violet-400">{stats.seats} seats</span>
        <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-xs text-emerald-400">{stats.available} available</span>
        <span className="px-3 py-1 rounded-lg bg-red-500/10 text-xs text-red-400">{stats.occupied} in use</span>
        <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-xs text-blue-400">{stats.cleaning} cleaning</span>
      </div>

      {loading ? (
        <p className="text-white/40">Loading tables...</p>
      ) : tables.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
          <p className="text-white/50 font-medium">No tables yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((t) => (
            <div
              key={t._id}
              className={`p-4 rounded-2xl bg-white/5 border transition-all ${
                newTableIds.has(t._id) ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-white/10'
              }`}
            >
              {newTableIds.has(t._id) && (
                <span className="inline-block mb-2 text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                  New
                </span>
              )}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                    {t.tableNumber}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{t.label || `Table ${t.tableNumber}`}</p>
                    <p className="text-[10px] text-white/40 flex items-center gap-1">
                      <FiUsers size={10} />
                      {(t.activeGuestCount || 0) > 0
                        ? `${t.activeGuestCount}/${t.capacity} seated`
                        : `${t.capacity || 0} seats`}
                    </p>
                  </div>
                </div>
                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full border font-bold ${STATUS_COLORS[t.status] || STATUS_COLORS.available}`}>
                  {t.status}
                </span>
              </div>
              {t.location && (
                <p className="text-xs text-white/35 mb-2 flex items-center gap-1">
                  <FiMapPin size={10} /> {t.location}
                </p>
              )}
              {t.createdAt && (
                <p className="text-[10px] text-white/25 mb-3 flex items-center gap-1">
                  <FiClock size={10} /> Added {formatCreatedAt(t.createdAt)}
                </p>
              )}
              <select
                value={t.status}
                onChange={(e) => updateStatus(t._id, e.target.value)}
                className="dineflow-select w-full rounded-xl px-3 py-2.5 text-xs font-medium capitalize"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
