import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiUsers, FiShoppingBag, FiClock, FiDollarSign, FiActivity, FiPhone, FiMail,
  FiMapPin, FiFilter, FiHome, FiUser,
} from 'react-icons/fi'
import { platformAPI } from '../../../api/dineflow'
import OrderHistoryTable from '../../../components/dineflow/OrderHistoryTable'
import UserOrderHistoryList from '../../../components/dineflow/UserOrderHistoryList'
import { formatOrderDateTime } from '../../../utils/orderDisplay'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'customers', label: 'Customers' },
  { id: 'orders', label: 'Orders' },
  { id: 'logins', label: 'Login history' },
]

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm"
    >
      <Icon className={`${accent} mb-2`} size={18} />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-white/40 uppercase tracking-wide mt-0.5">{label}</p>
    </motion.div>
  )
}

export default function SuperAdminCustomerDashboard() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const rid = activeRestaurant?._id
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async (userId = selectedUserId) => {
    if (!rid) return
    setLoading(true)
    try {
      const params = userId ? { userId } : {}
      const { data: res } = await platformAPI.customerDashboard(rid, params)
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [rid, selectedUserId])

  useEffect(() => {
    load(selectedUserId)
  }, [load, selectedUserId])

  const customers = data?.customers || []
  const orders = data?.orders || []
  const loginHistory = data?.loginHistory || []
  const stats = data?.stats || {}
  const restaurant = data?.restaurant || activeRestaurant

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter((c) =>
      c.name?.toLowerCase().includes(q)
      || c.email?.toLowerCase().includes(q)
      || String(c.phone || '').includes(q),
    )
  }, [customers, search])

  const selectedCustomer = customers.find((c) => String(c.userId) === String(selectedUserId))

  const ordersWithRestaurant = orders.map((o) => ({
    ...o,
    restaurant: o.restaurant || restaurant,
  }))

  if (loading && !data) {
    return <p className="text-white/50 p-8 text-center">Loading customer insights...</p>
  }

  return (
    <div className="user-panel min-h-full relative">
      <div className="user-panel-glow pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-violet-500/[0.08] to-transparent" />

      <div className="relative p-6 md:p-8 max-w-7xl mx-auto pb-12">
        <Link
          to="/platform"
          className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-violet-400 transition-colors mb-6"
        >
          <FiHome size={16} />
          Back to platform
        </Link>

        <header className="mb-6">
          <p className="text-violet-400/80 text-xs font-semibold uppercase tracking-widest mb-1">Super Admin · Customer insights</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{restaurant?.name}</h1>
          <p className="text-white/45 text-sm mt-1 flex items-center gap-1.5">
            <FiMapPin className="text-violet-400 shrink-0" size={14} />
            {restaurant?.address?.city || 'Restaurant customers, orders & login activity'}
          </p>
        </header>

        {selectedCustomer && (
          <div className="mb-6 p-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-violet-200 text-sm font-semibold">Filtering: {selectedCustomer.name}</p>
              <p className="text-violet-100/60 text-xs mt-0.5">
                {selectedCustomer.orderCount} orders · Last login {formatDate(selectedCustomer.lastLogin)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUserId('')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-violet-200 border border-violet-500/30 hover:bg-violet-500/15"
            >
              Show all customers
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
          <StatCard icon={FiUsers} label="Customers" value={stats.totalCustomers ?? 0} accent="text-violet-400" />
          <StatCard icon={FiShoppingBag} label="Total orders" value={stats.totalOrders ?? 0} accent="text-emerald-400" />
          <StatCard icon={FiDollarSign} label="Revenue" value={`₹${(stats.totalRevenue ?? 0).toLocaleString('en-IN')}`} accent="text-amber-400" />
          <StatCard icon={FiActivity} label="Active orders" value={stats.activeOrders ?? 0} accent="text-sky-400" />
          <StatCard icon={FiClock} label="Logins (7d)" value={stats.loginsLast7Days ?? 0} accent="text-pink-400" />
          <StatCard icon={FiUser} label="Guest orders" value={stats.guestOrders ?? 0} accent="text-orange-400" />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:border-violet-500/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <FiShoppingBag className="text-emerald-400" /> Recent orders
              </h2>
              <OrderHistoryTable
                orders={ordersWithRestaurant.slice(0, 8)}
                variant="panel"
                emptyMessage="No orders at this restaurant yet."
              />
              {orders.length > 8 && (
                <button
                  type="button"
                  onClick={() => setTab('orders')}
                  className="mt-4 text-sm text-violet-400 hover:underline"
                >
                  View all {orders.length} orders
                </button>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <FiClock className="text-amber-400" /> Recent logins
              </h2>
              {loginHistory.length === 0 ? (
                <p className="text-white/40 text-sm py-8 text-center">No login events yet.</p>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {loginHistory.slice(0, 10).map((entry) => (
                    <div key={entry._id} className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                      <div className="flex justify-between gap-2">
                        <p className="font-medium text-white text-sm">{entry.user?.name || 'User'}</p>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                          {entry.loginRole}
                        </span>
                      </div>
                      <p className="text-amber-300/90 text-xs mt-1">{formatDate(entry.createdAt)}</p>
                      {entry.user?.phone && (
                        <p className="text-white/40 text-xs mt-0.5">{entry.user.phone}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'customers' && (
          <section>
            <div className="relative mb-4">
              <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/50"
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <p className="text-white/40 py-12 text-center">No registered customers yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredCustomers.map((c) => {
                  const active = String(c.userId) === String(selectedUserId)
                  return (
                    <button
                      key={c.userId}
                      type="button"
                      onClick={() => setSelectedUserId(String(c.userId))}
                      className={`text-left p-4 rounded-2xl border transition-all ${
                        active
                          ? 'border-violet-500/50 bg-violet-500/10 ring-1 ring-violet-500/25'
                          : 'border-white/10 bg-white/[0.03] hover:border-violet-500/25'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {c.name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">{c.name}</p>
                          <p className="text-white/45 text-xs truncate flex items-center gap-1 mt-0.5">
                            <FiMail size={11} /> {c.email}
                          </p>
                          {c.phone && (
                            <p className="text-white/45 text-xs flex items-center gap-1 mt-0.5">
                              <FiPhone size={11} /> {c.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <p className="text-white/30 uppercase tracking-wide">Last login</p>
                          <p className="text-amber-300/90 mt-0.5">{formatDate(c.lastLogin)}</p>
                        </div>
                        <div>
                          <p className="text-white/30 uppercase tracking-wide">Orders</p>
                          <p className="text-emerald-400 mt-0.5">{c.orderCount} · ₹{Math.round(c.orderTotal || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-white/30 uppercase tracking-wide">Joined</p>
                          <p className="text-white/55 mt-0.5">{formatDate(c.joinedAt)}</p>
                        </div>
                        <div>
                          <p className="text-white/30 uppercase tracking-wide">Last order</p>
                          <p className="text-white/55 mt-0.5">{formatDate(c.lastOrderAt)}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'orders' && (
          <section>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-white">Order history</h2>
                <p className="text-white/40 text-sm">
                  {selectedCustomer ? `Orders by ${selectedCustomer.name}` : 'All orders'} — date, time & price
                </p>
              </div>
              {stats.avgOrderValue > 0 && (
                <p className="text-sm text-amber-300">Avg order: ₹{stats.avgOrderValue.toLocaleString('en-IN')}</p>
              )}
            </div>

            <div className="hidden lg:block mb-6">
              <OrderHistoryTable
                orders={ordersWithRestaurant}
                variant="panel"
                emptyMessage="No orders yet."
              />
            </div>

            <div className="lg:hidden">
              <UserOrderHistoryList
                orders={ordersWithRestaurant}
                defaultRestaurant={restaurant}
                emptyMessage="No orders yet."
              />
            </div>
          </section>
        )}

        {tab === 'logins' && (
          <section>
            <h2 className="font-semibold text-white mb-1">Login history</h2>
            <p className="text-white/40 text-sm mb-4">
              WhatsApp OTP sign-ins {selectedCustomer ? `for ${selectedCustomer.name}` : 'for all customers at this restaurant'}
            </p>

            {loginHistory.length === 0 ? (
              <p className="text-white/40 py-12 text-center">No login events recorded yet.</p>
            ) : (
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-white/30 text-xs uppercase border-b border-white/5">
                      <th className="text-left p-4">Customer</th>
                      <th className="text-left p-4">Phone</th>
                      <th className="text-left p-4">Role</th>
                      <th className="text-left p-4">Date & time</th>
                      <th className="text-left p-4">Device / IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((entry) => (
                      <tr key={entry._id} className="border-b border-white/5 text-white/70">
                        <td className="p-4 font-medium text-white">{entry.user?.name || '—'}</td>
                        <td className="p-4 text-xs">{entry.user?.phone || '—'}</td>
                        <td className="p-4">
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                            {entry.loginRole}
                          </span>
                        </td>
                        <td className="p-4 text-xs whitespace-nowrap text-amber-300/90">
                          {formatOrderDateTime(entry.createdAt)}
                        </td>
                        <td className="p-4 text-[10px] text-white/40 max-w-[200px] truncate" title={entry.userAgent}>
                          {entry.ip || '—'}{entry.userAgent ? ` · ${entry.userAgent.slice(0, 40)}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
