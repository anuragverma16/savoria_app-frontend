import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FiClock, FiMail, FiPhone, FiUser, FiShoppingBag, FiFilter } from 'react-icons/fi'
import { platformAPI } from '../../api/dineflow'

const ROLE_STYLES = {
  admin: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  staff: 'bg-lime-500/15 text-lime-300 border-lime-500/25',
  customer: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatRole(role) {
  if (role === 'customer') return 'Customer'
  if (role === 'admin') return 'Admin'
  if (role === 'staff') return 'Staff'
  return role
}

export default function PlatformUsersPanel({ restaurants = [] }) {
  const [users, setUsers] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('all')
  const [restaurantFilter, setRestaurantFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = { limit: 100 }
      if (roleFilter !== 'all') params.role = roleFilter
      if (restaurantFilter) params.restaurantId = restaurantFilter
      if (search.trim()) params.search = search.trim()
      const { data } = await platformAPI.users(params)
      setUsers(data.users || [])
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async (userId = selectedUserId) => {
    setHistoryLoading(true)
    try {
      const params = { limit: 50 }
      if (userId) params.userId = userId
      if (restaurantFilter) params.restaurantId = restaurantFilter
      const { data } = await platformAPI.loginHistory(params)
      setHistory(data.history || [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [roleFilter, restaurantFilter])

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(), search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadHistory(selectedUserId)
  }, [selectedUserId, restaurantFilter])

  const selectedUser = users.find((u) => String(u.user._id) === String(selectedUserId))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-100">Users & login history</h2>
          <p className="text-stone-500 text-sm">
            Customers, admins, and staff across your restaurants — with last login and sign-in history
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={restaurantFilter}
            onChange={(e) => {
              setRestaurantFilter(e.target.value)
              setSelectedUserId('')
            }}
            className="px-3 py-2 rounded-xl bg-stone-900 border border-white/10 text-sm text-stone-200"
          >
            <option value="">All restaurants</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-900 border border-white/10 text-sm text-stone-200"
          >
            <option value="all">All roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, or phone..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-900/80 border border-white/10 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:border-orange-500/40"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="platform-card rounded-2xl p-4 min-h-[420px]">
          <h3 className="text-sm font-semibold text-orange-200 mb-3 flex items-center gap-2">
            <FiUser size={16} className="text-orange-400" />
            Users ({users.length})
          </h3>

          {loading ? (
            <p className="text-stone-500 text-sm py-12 text-center">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-stone-500 text-sm py-12 text-center">No users found for this filter.</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {users.map((row) => {
                const active = String(row.user._id) === String(selectedUserId)
                return (
                  <button
                    key={`${row.membershipId}`}
                    type="button"
                    onClick={() => setSelectedUserId(String(row.user._id))}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      active
                        ? 'border-orange-500/40 bg-orange-500/10 ring-1 ring-orange-500/20'
                        : 'border-white/5 bg-white/[0.02] hover:border-orange-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-100 truncate">{row.user.name}</p>
                        <p className="text-stone-500 text-xs truncate">{row.restaurant?.name}</p>
                      </div>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full border font-bold shrink-0 ${ROLE_STYLES[row.role] || ROLE_STYLES.customer}`}>
                        {formatRole(row.role)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-stone-500">
                      <span className="inline-flex items-center gap-1">
                        <FiClock size={11} className="text-amber-400/80" />
                        Last login: {formatDate(row.user.lastLogin)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FiShoppingBag size={11} className="text-emerald-400/80" />
                        {row.orderCount} orders
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="platform-card rounded-2xl p-4 min-h-[420px]">
          <h3 className="text-sm font-semibold text-orange-200 mb-3 flex items-center gap-2">
            <FiClock size={16} className="text-orange-400" />
            {selectedUser ? `Login history — ${selectedUser.user.name}` : 'Recent logins'}
          </h3>

          {selectedUser && (
            <div className="mb-4 p-3 rounded-xl bg-stone-950/50 border border-white/5 text-sm space-y-1">
              <p className="text-stone-300 flex items-center gap-2">
                <FiMail size={14} className="text-stone-500" />
                {selectedUser.user.email}
              </p>
              {selectedUser.user.phone && (
                <p className="text-stone-300 flex items-center gap-2">
                  <FiPhone size={14} className="text-stone-500" />
                  {selectedUser.user.phone}
                </p>
              )}
              <p className="text-stone-500 text-xs pt-1">
                Joined {formatDate(selectedUser.user.createdAt)} · Last login {formatDate(selectedUser.user.lastLogin)}
              </p>
              {selectedUser.orderCount > 0 && (
                <p className="text-emerald-400/90 text-xs">
                  {selectedUser.orderCount} orders · ₹{Math.round(selectedUser.orderTotal || 0)} total
                  {selectedUser.lastOrderAt ? ` · Last order ${formatDate(selectedUser.lastOrderAt)}` : ''}
                </p>
              )}
              <button
                type="button"
                onClick={() => setSelectedUserId('')}
                className="text-xs text-orange-400 hover:underline mt-1"
              >
                Show all logins
              </button>
            </div>
          )}

          {historyLoading ? (
            <p className="text-stone-500 text-sm py-12 text-center">Loading login history...</p>
          ) : history.length === 0 ? (
            <p className="text-stone-500 text-sm py-12 text-center">
              No login events yet. History is recorded when users sign in with WhatsApp OTP.
            </p>
          ) : (
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {history.map((entry) => (
                <div
                  key={entry._id}
                  className="p-3 rounded-xl border border-white/5 bg-white/[0.02] text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-200 truncate">
                        {entry.user?.name || 'User'}
                      </p>
                      <p className="text-stone-500 text-xs truncate">
                        {entry.restaurant?.name || 'Platform'}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-white/10 shrink-0">
                      {entry.loginRole || entry.method}
                    </span>
                  </div>
                  <p className="text-amber-300/90 text-xs mt-2 flex items-center gap-1">
                    <FiClock size={12} />
                    {formatDate(entry.createdAt)}
                  </p>
                  {(entry.ip || entry.userAgent) && (
                    <p className="text-stone-600 text-[10px] mt-1 truncate" title={entry.userAgent}>
                      {entry.ip ? `IP ${entry.ip}` : ''}{entry.ip && entry.userAgent ? ' · ' : ''}{entry.userAgent ? entry.userAgent.slice(0, 60) : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
