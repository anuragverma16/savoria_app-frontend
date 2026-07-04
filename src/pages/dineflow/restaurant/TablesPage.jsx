import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { FiPlus, FiTrash2, FiUsers, FiMaximize2, FiGrid, FiX, FiMapPin, FiClock, FiCheck, FiLink } from 'react-icons/fi'
import TableBookingLinksPanel from '../../../components/dineflow/TableBookingLinksPanel'
import { buildTableBookingUrl, copyTableBookingLink } from '../../../utils/tableBookingLink'
import { downloadQrPng, downloadQrPdf, printQr } from '../../../utils/tableQrDownload'
import { restaurantAPI } from '../../../api/dineflow'
import AnimatedButton from '../../../components/dineflow/AnimatedButton'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  occupied: 'bg-red-500/20 text-red-400 border-red-500/30',
  reserved: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cleaning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const DEFAULT_FORM = { count: 4, startFrom: 1, capacity: 2, location: '' }

const inputCls = 'w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20'

function sortTables(list) {
  return [...list].sort((a, b) => {
    const na = Number(a.tableNumber)
    const nb = Number(b.tableNumber)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
    return String(a.tableNumber).localeCompare(String(b.tableNumber), undefined, { numeric: true })
  })
}

function clampField(name, raw) {
  const n = Number(raw)
  if (Number.isNaN(n)) return DEFAULT_FORM[name]
  if (name === 'count') return Math.min(50, Math.max(1, Math.floor(n)))
  if (name === 'startFrom') return Math.max(1, Math.floor(n))
  if (name === 'capacity') return Math.min(20, Math.max(1, Math.floor(n)))
  return raw
}

function validateForm(form) {
  const errors = {}
  const count = Number(form.count)
  const startFrom = Number(form.startFrom)
  const capacity = Number(form.capacity)

  if (!count || count < 1 || count > 50) errors.count = 'Enter 1–50 tables'
  if (!startFrom || startFrom < 1) errors.startFrom = 'Start number must be at least 1'
  if (!capacity || capacity < 1 || capacity > 20) errors.capacity = 'Seats must be 1–20'

  return errors
}

function formatCreatedAt(date) {
  if (!date) return ''
  return new Date(date).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function TablesPage() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [createdQueue, setCreatedQueue] = useState([])
  const [selectedQR, setSelectedQR] = useState(null)
  const [editingSeats, setEditingSeats] = useState(null)
  const [qrBaseUrl, setQrBaseUrl] = useState('')
  const [qrUsesLocalhost, setQrUsesLocalhost] = useState(false)
  const [suggestedLanUrl, setSuggestedLanUrl] = useState('')
  const [regeneratingQr, setRegeneratingQr] = useState(false)
  const gridRef = useRef(null)
  const rid = activeRestaurant?._id

  useEffect(() => { if (rid) load() }, [rid])

  useEffect(() => {
    if (!rid) return
    const socket = io('/', { path: '/socket.io' })
    socket.emit('join-restaurant', rid)
    socket.on('tables-bulk-created', (batch) => {
      setCreatedQueue(sortTables(batch || []))
      load()
    })
    socket.on('table-updated', load)
    socket.on('new-order', load)
    socket.on('order-updated', load)
    return () => socket.disconnect()
  }, [rid])

  const load = async () => {
    if (!rid) return
    setLoading(true)
    try {
      const { data } = await restaurantAPI(rid).tables()
      setTables(sortTables(data.tables || []))
      setQrBaseUrl(data.qrBaseUrl || '')
      setQrUsesLocalhost(Boolean(data.qrUsesLocalhost))
      setSuggestedLanUrl(data.suggestedLanUrl || '')
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
    reserved: tables.filter((t) => t.status === 'reserved').length,
    seats: tables.reduce((sum, t) => sum + (t.capacity || 0), 0),
  }), [tables])

  const setFormField = (name, value) => {
    if (name === 'location') {
      setForm((prev) => ({ ...prev, location: value }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: clampField(name, value) }))
    setFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const createTables = async () => {
    const errors = validateForm(form)
    if (Object.keys(errors).length) {
      setFormErrors(errors)
      toast.error('Please fix the form errors')
      return
    }

    setCreating(true)
    try {
      const payload = {
        count: Number(form.count),
        startFrom: Number(form.startFrom),
        capacity: Number(form.capacity),
        location: form.location.trim(),
      }
      const { data } = await restaurantAPI(rid).createTablesBulk(payload)
      setCreatedQueue(sortTables(data.tables || []))
      toast.success(data.message || `${data.count} tables created`)
      setShowForm(false)
      setForm(DEFAULT_FORM)
      setFormErrors({})
      await load()
      setTimeout(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create tables')
    } finally {
      setCreating(false)
    }
  }

  const deleteTable = async (id) => {
    if (!confirm('Delete this table?')) return
    await restaurantAPI(rid).deleteTable(id)
    toast.success('Table deleted')
    setCreatedQueue((prev) => prev.filter((t) => t._id !== id))
    load()
  }

  const saveSeats = async (tableId, capacity) => {
    const cap = Number(capacity)
    if (!cap || cap < 1 || cap > 20) {
      toast.error('Seats must be between 1 and 20')
      return
    }
    try {
      await restaurantAPI(rid).updateTable(tableId, { capacity: cap })
      toast.success('Seats updated')
      setEditingSeats(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    }
  }

  const regenerateAllQr = async () => {
    setRegeneratingQr(true)
    try {
      const { data } = await restaurantAPI(rid).regenerateAllTableQR()
      toast.success(data.message || 'All QR codes regenerated')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not regenerate QR codes')
    } finally {
      setRegeneratingQr(false)
    }
  }

  const downloadQr = (table) => downloadQrPng(table, activeRestaurant?.name)

  const downloadPdf = (table) => downloadQrPdf(table, activeRestaurant?.name)

  const printTableQr = (table) => printQr(table, activeRestaurant?.name)

  const regenerateTableQr = async (tableId) => {
    try {
      await restaurantAPI(rid).regenerateTableQR(tableId)
      toast.success('QR regenerated')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not regenerate QR')
    }
  }

  const getBookingLink = (table) => (
    table?.qrTargetUrl || buildTableBookingUrl(rid, table, qrBaseUrl || undefined)
  )

  const copyBookingLink = async (table) => {
    try {
      await copyTableBookingLink(getBookingLink(table))
      toast.success(`Table ${table.tableNumber} booking link copied`)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const previewRange = () => {
    const count = Math.min(Number(form.count) || 0, 5)
    const start = Number(form.startFrom) || 1
    if (count <= 0) return ''
    const nums = []
    for (let i = 0; i < count; i++) nums.push(start + i)
    const more = (Number(form.count) || 0) > 5 ? ` … +${Number(form.count) - 5} more` : ''
    return `Table ${nums.join(', ')}${more}`
  }

  const createdIds = new Set(createdQueue.map((t) => t._id))

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FiGrid className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tables & QR Codes</h1>
              <p className="text-white/40 text-sm">{activeRestaurant?.name}</p>
              {rid && (
                <p className="text-white/30 text-[11px] mt-1 font-mono" title="Unique ID — encoded in every table QR">
                  Restaurant ID: {rid}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="px-3 py-1 rounded-lg bg-white/5 text-xs text-white/60">{stats.total} tables</span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-xs text-emerald-400">{stats.available} available</span>
            <span className="px-3 py-1 rounded-lg bg-red-500/10 text-xs text-red-400">{stats.occupied} occupied</span>
            <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-xs text-amber-400">{stats.reserved} reserved</span>
            <span className="px-3 py-1 rounded-lg bg-violet-500/10 text-xs text-violet-400">{stats.seats} total seats</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AnimatedButton
            type="button"
            onClick={regenerateAllQr}
            disabled={regeneratingQr || !tables.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium"
          >
            <FiMaximize2 size={16} /> {regeneratingQr ? 'Regenerating…' : 'Regenerate all QR'}
          </AnimatedButton>
          <AnimatedButton
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/20"
          >
            <FiPlus size={16} /> Add Tables
          </AnimatedButton>
        </div>
      </div>

      {rid && (
        <div className="mb-6 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-sm text-white/70">
          <p className="font-medium text-emerald-300 mb-1">How table QR codes work</p>
          <p>
            Each table QR encodes this restaurant&apos;s unique ID plus that table&apos;s ID.
            When a customer scans, they open the menu for <span className="text-white/90">{activeRestaurant?.name}</span> only.
          </p>
          <p className="mt-2 font-mono text-[11px] text-white/45 break-all">
            /scan?restaurantId={rid}&amp;tableId=&#123;tableId&#125;&amp;no=&#123;tableNumber&#125;
          </p>
        </div>
      )}

      {qrUsesLocalhost && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-sm text-amber-50 space-y-3">
          <p className="font-semibold text-amber-200 text-base">
            QR codes use localhost — phones cannot open them
          </p>
          <p className="text-amber-100/90 leading-relaxed">
            A phone scanning this QR tries to open <span className="font-mono text-amber-200">localhost</span> on
            the phone itself, not your computer. Set a public URL on the server, then regenerate QR codes.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-amber-100/85 text-xs sm:text-sm">
            {suggestedLanUrl && (
              <li>
                <strong>Same Wi‑Fi (dev):</strong> add to <span className="font-mono">backend/.env</span>
                <pre className="mt-1 p-2 rounded-lg bg-black/30 font-mono text-[11px] overflow-x-auto">
{`PUBLIC_APP_URL=${suggestedLanUrl}`}
                </pre>
                Open the app on your phone at that URL (not localhost). Restart backend + frontend.
              </li>
            )}
            <li>
              <strong>Production:</strong> deploy frontend, then set{' '}
              <span className="font-mono">PUBLIC_APP_URL=https://your-domain.com</span>
            </li>
            <li>
              <strong>Tunnel (quick test):</strong> run <span className="font-mono">ngrok http 3000</span>, set{' '}
              <span className="font-mono">PUBLIC_APP_URL</span> to the ngrok https URL.
            </li>
            <li>
              Click <strong>Regenerate all QR</strong> above after changing the env variable.
            </li>
          </ol>
          {qrBaseUrl && (
            <p className="text-[11px] font-mono text-amber-200/70 break-all pt-1 border-t border-amber-500/20">
              Current QR base: {qrBaseUrl}
            </p>
          )}
        </div>
      )}

      {!qrUsesLocalhost && qrBaseUrl && (
        <div className="mb-6 p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-xs text-emerald-200/90">
          QR scan links use: <span className="font-mono break-all">{qrBaseUrl}</span>
        </div>
      )}

      {tables.length > 0 && (
        <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-emerald-500/20">
          <h2 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2">
            <FiLink size={16} /> Table booking links
          </h2>
          <TableBookingLinksPanel
            tables={tables}
            restaurantId={rid}
            baseUrl={qrBaseUrl}
            loading={loading}
            showAdminActions
            onBookTable={(table) => {
              const url = getBookingLink(table)
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
          />
        </div>
      )}

      {showForm && (
        <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-emerald-400">Add multiple tables</h2>
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40">
              <FiX size={18} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">No. of tables *</label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.count}
                onChange={(e) => setFormField('count', e.target.value)}
                className={`${inputCls} ${formErrors.count ? 'border-red-500/50' : ''}`}
                placeholder="e.g. 4"
              />
              {formErrors.count && <p className="text-red-400 text-[10px] mt-1">{formErrors.count}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Start from table # *</label>
              <input
                type="number"
                min={1}
                value={form.startFrom}
                onChange={(e) => setFormField('startFrom', e.target.value)}
                className={`${inputCls} ${formErrors.startFrom ? 'border-red-500/50' : ''}`}
                placeholder="e.g. 1"
              />
              {formErrors.startFrom && <p className="text-red-400 text-[10px] mt-1">{formErrors.startFrom}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Seats per table *</label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.capacity}
                onChange={(e) => setFormField('capacity', e.target.value)}
                className={`${inputCls} ${formErrors.capacity ? 'border-red-500/50' : ''}`}
                placeholder="e.g. 2"
              />
              {formErrors.capacity && <p className="text-red-400 text-[10px] mt-1">{formErrors.capacity}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Section / area</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setFormField('location', e.target.value)}
                className={inputCls}
                placeholder="e.g. Patio, Floor 1"
              />
            </div>
          </div>
          {previewRange() && (
            <p className="text-xs text-white/40 mb-4 bg-slate-950/50 rounded-lg px-3 py-2 border border-white/5">
              Will create: <span className="text-emerald-400 font-medium">{previewRange()}</span>
              {' '}· <span className="text-white/60">{form.capacity} seats each</span>
              {form.location.trim() && <> · <span className="text-white/60">{form.location.trim()}</span></>}
            </p>
          )}
          <AnimatedButton
            type="button"
            onClick={createTables}
            disabled={creating}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50 hover:bg-emerald-600 transition-colors"
          >
            {creating ? 'Creating tables...' : `Create ${form.count} Table${form.count === 1 ? '' : 's'}`}
          </AnimatedButton>
        </div>
      )}

      {createdQueue.length > 0 && (
        <div className="mb-8 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-emerald-300 flex items-center gap-2 text-sm">
              <FiCheck size={16} /> Just created — {createdQueue.length} table(s)
            </h2>
            <button type="button" onClick={() => setCreatedQueue([])} className="text-xs text-white/40 hover:text-white">
              Dismiss
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {createdQueue.map((t) => (
              <span
                key={t._id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-emerald-500/30 text-xs"
              >
                <span className="font-bold text-emerald-400">T-{t.tableNumber}</span>
                <span className="text-white/50">{t.capacity} seats</span>
                {t.location && <span className="text-white/40 flex items-center gap-0.5"><FiMapPin size={10} />{t.location}</span>}
                <span className="text-white/30 flex items-center gap-0.5"><FiClock size={10} />{formatCreatedAt(t.createdAt)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div ref={gridRef}>
        {loading ? (
          <p className="text-white/40 text-center py-16">Loading tables...</p>
        ) : tables.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
            <FiGrid className="mx-auto text-4xl text-white/20 mb-4" />
            <p className="text-white/50 font-medium">No tables yet</p>
            <AnimatedButton type="button" onClick={() => setShowForm(true)} className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm">
              Add Tables
            </AnimatedButton>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
              Your tables ({tables.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tables.map((t) => (
                <div
                  key={t._id}
                  className={`p-5 rounded-2xl bg-slate-900/60 border transition-colors ${
                    createdIds.has(t._id) ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-white/10 hover:border-emerald-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                        {t.tableNumber}
                      </span>
                      <div>
                        <h3 className="font-semibold text-sm">{t.label || `Table ${t.tableNumber}`}</h3>
                        <div className="flex items-center gap-1 text-[10px] text-white/40">
                          <FiUsers size={10} />
                          {editingSeats === t._id ? (
                            <span className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                max={20}
                                defaultValue={t.capacity}
                                className="w-12 bg-slate-950 border border-white/10 rounded px-1 py-0.5 text-[10px]"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveSeats(t._id, e.target.value)
                                  if (e.key === 'Escape') setEditingSeats(null)
                                }}
                                id={`seats-${t._id}`}
                              />
                              <button type="button" onClick={() => saveSeats(t._id, document.getElementById(`seats-${t._id}`).value)} className="text-emerald-400">Save</button>
                            </span>
                          ) : (
                            <button type="button" onClick={() => setEditingSeats(t._id)} className="hover:text-emerald-400" title="Click to edit seats">
                              {(t.activeGuestCount || 0) > 0
                                ? `${t.activeGuestCount}/${t.capacity} seated`
                                : `${t.capacity} seats`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full border font-bold ${STATUS_COLORS[t.status] || STATUS_COLORS.available}`}>
                      {t.status}
                    </span>
                  </div>

                  {t.location && (
                    <p className="text-[10px] text-white/35 mb-2 flex items-center gap-1">
                      <FiMapPin size={10} /> {t.location}
                    </p>
                  )}
                  {t.createdAt && (
                    <p className="text-[10px] text-white/25 mb-2 flex items-center gap-1">
                      <FiClock size={10} /> Added {formatCreatedAt(t.createdAt)}
                    </p>
                  )}

                  {t.qrCodeUrl ? (
                    <div className="mb-2">
                      <button
                        type="button"
                        onClick={() => setSelectedQR(t)}
                        className="w-full p-3 rounded-xl bg-white flex flex-col items-center gap-2 hover:ring-2 hover:ring-violet-500/40 transition-all"
                      >
                        <img
                          src={t.qrCodeUrl}
                          alt={`Table ${t.tableNumber} QR`}
                          className="w-28 h-28 object-contain"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadQr(t)}
                        className="w-full mt-2 py-2 rounded-lg text-violet-300 text-[10px] font-semibold border border-violet-500/30 hover:bg-violet-500/10"
                      >
                        Download PNG
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPdf(t)}
                        className="w-full mt-2 py-2 rounded-lg text-violet-300 text-[10px] font-semibold border border-violet-500/30 hover:bg-violet-500/10"
                      >
                        Download PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => printTableQr(t)}
                        className="w-full mt-2 py-2 rounded-lg text-sky-300 text-[10px] font-semibold border border-sky-500/30 hover:bg-sky-500/10"
                      >
                        Print QR
                      </button>
                      <button
                        type="button"
                        onClick={() => regenerateTableQr(t._id)}
                        className="w-full mt-2 py-2 rounded-lg text-amber-300 text-[10px] font-semibold border border-amber-500/30 hover:bg-amber-500/10"
                      >
                        Regenerate QR
                      </button>
                      <button
                        type="button"
                        onClick={() => copyBookingLink(t)}
                        className="w-full mt-2 py-2 rounded-lg text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 hover:bg-emerald-500/10 flex items-center justify-center gap-1"
                      >
                        <FiLink size={12} /> Copy booking link
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-400/80 mb-2 text-center py-6 rounded-xl border border-dashed border-amber-500/30">
                      QR generating…
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteTable(t._id)}
                    className="w-full py-1.5 rounded-lg text-red-400/80 text-xs hover:bg-red-500/10 flex items-center justify-center gap-1 transition-colors"
                  >
                    <FiTrash2 size={12} /> Delete
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedQR(null)}>
          <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-slate-900 font-bold text-lg mb-1">Table {selectedQR.tableNumber}</h3>
            <p className="text-slate-500 text-xs mb-1">{selectedQR.capacity} seats</p>
            <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border mb-3 ${STATUS_COLORS[selectedQR.status] || STATUS_COLORS.available}`}>
              {selectedQR.status}
            </span>
            {selectedQR.location && <p className="text-slate-400 text-xs mb-4">{selectedQR.location}</p>}
            <img src={selectedQR.qrCodeUrl} alt="QR" className="w-64 h-64 mx-auto rounded-lg border border-slate-200 bg-white p-2" />
            <p className="mt-3 text-[10px] text-slate-500 font-mono break-all text-left px-1">
              {getBookingLink(selectedQR)}
            </p>
            <button
              type="button"
              onClick={() => copyBookingLink(selectedQR)}
              className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <FiLink size={16} /> Copy booking link
            </button>
            <button
              type="button"
              onClick={() => downloadQr(selectedQR)}
              className="mt-2 w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold"
            >
              Download PNG
            </button>
            <button
              type="button"
              onClick={() => downloadPdf(selectedQR)}
              className="mt-2 w-full py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => printTableQr(selectedQR)}
              className="mt-2 w-full py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold"
            >
              Print QR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
