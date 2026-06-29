import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { FiShoppingBag, FiDollarSign, FiUsers, FiGrid, FiCoffee, FiRefreshCw } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { restaurantAPI } from '../../../api/dineflow'
import toast from 'react-hot-toast'

const STATUS_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#64748b']

export default function AnalyticsPage() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const rid = activeRestaurant?._id

  const load = async () => {
    if (!rid) return
    setLoading(true)
    setError(null)
    try {
      const { data: res } = await restaurantAPI(rid).analytics()
      setData(res.analytics)
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to load analytics'
      setError(msg)
      setData(null)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [rid])

  if (loading) {
    return <div className="p-8 text-white/40">Loading analytics...</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button type="button" onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm">
          <FiRefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return <div className="p-8 text-white/40">No analytics data available.</div>
  }

  const stats = [
    { icon: FiShoppingBag, label: 'Total Orders', value: data.totalOrders, color: 'text-blue-400' },
    { icon: FiDollarSign, label: 'Revenue', value: `₹${(data.revenue || 0).toLocaleString()}`, color: 'text-emerald-400' },
    { icon: FiUsers, label: 'Customers', value: data.customers || 0, color: 'text-violet-400' },
    { icon: FiGrid, label: 'Staff', value: data.staff || 0, color: 'text-amber-400' },
    { icon: FiCoffee, label: 'Menu Items', value: data.menuItems || 0, color: 'text-pink-400' },
    { icon: FiGrid, label: 'Tables', value: data.tables || 0, color: 'text-cyan-400' },
  ]

  const statusData = Object.entries(data.statusBreakdown || {}).map(([name, value]) => ({ name, value }))
  const topItems = (data.topItems || []).map((i) => ({ name: i._id, qty: i.qty, revenue: i.revenue }))
  const daily = (data.dailyRevenue || []).map((d) => ({ date: d._id?.slice(5), orders: d.orders, revenue: d.revenue }))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">Analytics</h1>
      <p className="text-white/40 text-sm mb-8">{activeRestaurant?.name}</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <s.icon className={`text-xl mb-2 ${s.color}`} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-4">Orders by status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/40 text-sm py-16 text-center">No orders yet</p>
          )}
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-4">Last 7 days</h3>
          {daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={daily}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/40 text-sm py-16 text-center">No orders in the last 7 days</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-4">Top selling items</h3>
          <div className="space-y-2">
            {topItems.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                <span className="text-white/70"><span className="text-white/30 mr-2">#{i + 1}</span>{item.name}</span>
                <span className="text-emerald-400">{item.qty} sold · ₹{Math.round(item.revenue)}</span>
              </div>
            ))}
            {topItems.length === 0 && <p className="text-white/40 text-sm">No order data yet</p>}
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-4">Summary</h3>
          <ul className="space-y-3 text-sm text-white/60">
            <li className="flex justify-between"><span>Completed orders</span><span className="text-white">{data.completedOrders || 0}</span></li>
            <li className="flex justify-between"><span>Avg order value</span><span className="text-emerald-400">₹{data.avgOrderValue || 0}</span></li>
            <li className="flex justify-between"><span>Registered customers</span><span className="text-white">{data.customers || 0}</span></li>
            <li className="flex justify-between"><span>Active staff</span><span className="text-white">{data.staff || 0}</span></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
