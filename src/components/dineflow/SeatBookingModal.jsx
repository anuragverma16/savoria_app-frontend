import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMinus, FiPlus, FiX, FiUsers } from 'react-icons/fi'

function seatState(index, seatedGuests, partySize) {
  const seatNum = index + 1
  if (seatNum <= seatedGuests) return 'occupied'
  if (seatNum <= seatedGuests + partySize) return 'yours'
  return 'free'
}

const SEAT_COLORS = {
  occupied: 'bg-red-500/30 border-red-500/40 text-red-200',
  yours: 'bg-emerald-500/30 border-emerald-500/40 text-emerald-200',
  free: 'bg-white/5 border-white/10 text-white/30',
}

export default function SeatBookingModal({
  table,
  open,
  onClose,
  onConfirm,
  booking,
  defaultGuestName = '',
  defaultGuestPhone = '',
}) {
  const seated = table?.seatedGuests ?? 0
  const capacity = table?.capacity ?? 0
  const available = table?.seatsAvailable ?? Math.max(0, capacity - seated)

  const [partySize, setPartySize] = useState(1)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  useEffect(() => {
    if (open) {
      setPartySize(Math.min(1, available) || 1)
      setGuestName(defaultGuestName || '')
      setGuestPhone(defaultGuestPhone || '')
    }
  }, [open, table?._id, available, defaultGuestName, defaultGuestPhone])

  if (!open || !table) return null

  const seatsAfter = Math.max(0, available - partySize)

  const handleBook = () => {
    if (!guestName.trim()) return
    if (!guestPhone.trim()) return
    onConfirm(partySize, { guestName: guestName.trim(), guestPhone: guestPhone.trim() })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <h2 className="font-semibold text-white">Table {table.tableNumber}</h2>
              <p className="text-xs text-white/40">{capacity} seats total</p>
            </div>
            <button type="button" onClick={onClose} className="text-white/50 hover:text-white p-2">
              <FiX size={20} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div className="space-y-3">
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name *"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
              />
              <input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="Mobile number *"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-300 font-bold">{seated}</p>
                <p className="text-white/40">Occupied</p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-300 font-bold">{partySize}</p>
                <p className="text-white/40">Your seats</p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white font-bold">{seatsAfter}</p>
                <p className="text-white/40">Free after</p>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-white/40 uppercase tracking-wide mb-3 text-center">Seat map</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: capacity }, (_, i) => {
                  const state = seatState(i, seated, partySize)
                  return (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xs font-bold ${SEAT_COLORS[state]}`}
                      title={state === 'occupied' ? 'Occupied' : state === 'yours' ? 'Your seat' : 'Free'}
                    >
                      {i + 1}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <p className="text-[11px] text-white/40 uppercase tracking-wide mb-2 flex items-center justify-center gap-1.5">
                <FiUsers size={12} /> How many seats are you taking?
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                  disabled={partySize <= 1}
                  className="w-10 h-10 rounded-xl bg-white/5 text-white hover:bg-white/10 disabled:opacity-40"
                >
                  <FiMinus size={16} className="mx-auto" />
                </button>
                <span className="text-2xl font-bold text-white w-10 text-center">{partySize}</span>
                <button
                  type="button"
                  onClick={() => setPartySize((n) => Math.min(available, n + 1))}
                  disabled={partySize >= available}
                  className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-40"
                >
                  <FiPlus size={16} className="mx-auto" />
                </button>
              </div>
              <p className="text-center text-xs text-white/45 mt-3">
                {partySize} of {available} available seat{available !== 1 ? 's' : ''}
                {seatsAfter > 0 && ` · ${seatsAfter} seat${seatsAfter !== 1 ? 's' : ''} stay free`}
              </p>
            </div>

            <button
              type="button"
              disabled={booking || partySize < 1 || partySize > available || !guestName.trim() || !guestPhone.trim()}
              onClick={handleBook}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold disabled:opacity-50"
            >
              {booking ? 'Booking...' : `Book ${partySize} seat${partySize !== 1 ? 's' : ''} & open menu`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
