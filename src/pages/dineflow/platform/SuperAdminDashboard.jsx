import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiGrid, FiUsers, FiShoppingBag, FiDollarSign, FiMapPin,
  FiPause, FiPlay, FiBarChart2, FiCoffee, FiTrendingUp, FiPlus, FiUserPlus, FiMail, FiTrash2,
} from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { platformAPI } from '../../../api/dineflow'
import { ToggleButton, ToggleGroup } from '../../../components/dineflow/ToggleGroup'
import OrderHistoryTable from '../../../components/dineflow/OrderHistoryTable'
import { setActiveRestaurant, setImpersonating, setViewAsPanel, clearTenant } from '../../../store/slices/tenantSlice'
import toast from 'react-hot-toast'
import { showErrorToast, showSuccessToast } from '../../../utils/appToast'
import PlatformProvisionModal from '../../../components/platform/PlatformProvisionModal'
import PlatformUsersPanel from '../../../components/platform/PlatformUsersPanel'
import { normalizeProvisionPhone } from '../../../utils/platformProvisionOtp'

const FOOD_COLORS = ['#f97316', '#ef4444', '#f59e0b', '#84cc16', '#fb923c', '#dc2626', '#eab308']

const TABS = [
  { id: 'restaurants', label: 'Restaurants', icon: FiMapPin, color: 'orange' },
  { id: 'users', label: 'Users', icon: FiUsers, color: 'violet' },
  { id: 'orders', label: 'Order History', icon: FiShoppingBag, color: 'gold' },
  { id: 'messages', label: 'Messages', icon: FiMail, color: 'green' },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2, color: 'gold' },
]

const PANELS = [
  { id: 'admin', label: 'Admin', path: 'admin', color: 'orange' },
  { id: 'staff', label: 'Staff', path: 'staff', color: 'gold' },
  { id: 'user', label: 'Customer', path: 'user', color: 'tomato' },
]

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className="p-5 rounded-2xl platform-card"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
        <Icon className="text-xl text-white" />
      </div>
      <p className="text-2xl font-bold text-stone-50">{value}</p>
      <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">{label}</p>
    </motion.div>
  )
}

function ChartCard({ title, icon: Icon, children, empty }) {
  return (
    <div className="p-6 rounded-2xl platform-card">
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-orange-200">
        <Icon className="text-orange-400" /> {title}
      </h3>
      {empty ? (
        <p className="text-stone-500 text-sm py-16 text-center">No data yet — orders will appear here</p>
      ) : children}
    </div>
  )
}

const EMPTY_ADMIN_FORM = {
  restaurantName: '',
  city: '',
  adminName: '',
  adminEmail: '',
  adminPhone: '',
}

export default function SuperAdminDashboard() {
  const { user } = useSelector((s) => s.auth)
  const [tab, setTab] = useState('analytics')
  const [overview, setOverview] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [platformOrders, setPlatformOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createMode, setCreateMode] = useState('restaurant')
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('')
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM)
  const [saving, setSaving] = useState(false)
  const submitLockRef = useRef(false)
  const createIdempotencyKeyRef = useRef('')
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [newContactCount, setNewContactCount] = useState(0)
  const [selectedContact, setSelectedContact] = useState(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(clearTenant())
    load()
  }, [dispatch])

  useEffect(() => {
    if (tab === 'orders') loadOrders()
    if (tab === 'messages') loadContacts()
  }, [tab])

  const loadContacts = async () => {
    setContactsLoading(true)
    try {
      const { data } = await platformAPI.contacts({ limit: 100 })
      setContacts(data.contacts || [])
      setNewContactCount(data.newCount || 0)
    } catch {
      toast.error('Failed to load contact messages')
    } finally {
      setContactsLoading(false)
    }
  }

  const refreshContactCount = async () => {
    try {
      const { data } = await platformAPI.contacts({ limit: 1 })
      setNewContactCount(data.newCount || 0)
    } catch { /* ignore */ }
  }

  const loadOrders = async () => {
    setOrdersLoading(true)
    try {
      const { data } = await platformAPI.orders({ limit: 100 })
      setPlatformOrders(data.orders || [])
    } catch {
      toast.error('Failed to load order history')
    } finally {
      setOrdersLoading(false)
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const [o, r] = await Promise.all([platformAPI.overview(), platformAPI.restaurants()])
      setOverview(o.data.overview)
      setRestaurants(r.data.restaurants || [])
      refreshContactCount()
    } catch {
      toast.error('Failed to load platform data')
    } finally {
      setLoading(false)
    }
  }

  const enterRestaurant = (restaurant, panelId = 'admin') => {
    const panel = PANELS.find((p) => p.id === panelId) || PANELS[0]
    dispatch(setActiveRestaurant(restaurant))
    dispatch(setImpersonating(true))
    dispatch(setViewAsPanel(panelId))
    navigate(`/restaurant/${restaurant._id}/${panel.path}`)
    toast.success(`${restaurant.name} — ${panel.label}`)
  }

  const toggleStatus = async (r) => {
    try {
      if (r.status === 'active') await platformAPI.suspend(r._id)
      else await platformAPI.activate(r._id)
      toast.success('Status updated')
      load()
    } catch { toast.error('Failed') }
  }

  const newCreateIdempotencyKey = () => {
    createIdempotencyKeyRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `create-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  const openCreateRestaurant = () => {
    newCreateIdempotencyKey()
    setCreateMode('restaurant')
    setSelectedRestaurantId('')
    setAdminForm(EMPTY_ADMIN_FORM)
    setShowCreateModal(true)
  }

  const openAddAdmin = (restaurantId) => {
    newCreateIdempotencyKey()
    setCreateMode('admin')
    setSelectedRestaurantId(restaurantId)
    setAdminForm(EMPTY_ADMIN_FORM)
    setShowCreateModal(true)
  }

  const openAddStaff = (restaurantId) => {
    newCreateIdempotencyKey()
    setCreateMode('staff')
    setSelectedRestaurantId(restaurantId)
    setAdminForm(EMPTY_ADMIN_FORM)
    setShowCreateModal(true)
  }

  const setAdminField = (key) => (e) => setAdminForm({ ...adminForm, [key]: e.target.value })

  const openContact = async (contact) => {
    setSelectedContact(contact)
    if (contact.status === 'new') {
      try {
        await platformAPI.updateContact(contact._id, { status: 'read' })
        setContacts((prev) => prev.map((c) => (
          c._id === contact._id ? { ...c, status: 'read' } : c
        )))
        setNewContactCount((n) => Math.max(0, n - 1))
      } catch { /* ignore */ }
    }
  }

  const deleteContact = async (id) => {
    if (!confirm('Delete this message?')) return
    try {
      await platformAPI.deleteContact(id)
      showSuccessToast('Message removed', 'The contact message was deleted.')
      if (selectedContact?._id === id) setSelectedContact(null)
      loadContacts()
    } catch {
      showErrorToast('Delete failed', 'Could not remove this message. Try again.')
    }
  }

  const formatContactDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    if (submitLockRef.current || saving) return

    const phone = normalizeProvisionPhone(adminForm.adminPhone)
    if (phone.length < 10) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }

    submitLockRef.current = true
    setSaving(true)
    try {
      const payloadBase = {
        name: adminForm.adminName.trim(),
        email: adminForm.adminEmail.trim().toLowerCase(),
        phone,
      }

      if (createMode === 'restaurant') {
        const { data } = await platformAPI.createRestaurant({
          name: adminForm.restaurantName.trim(),
          city: adminForm.city.trim(),
          adminName: payloadBase.name,
          adminEmail: payloadBase.email,
          adminPhone: payloadBase.phone,
        }, createIdempotencyKeyRef.current)
        toast.success(`Restaurant created. ID: ${data.restaurant._id}`)
      } else if (createMode === 'staff') {
        const { data } = await platformAPI.createRestaurantStaff(selectedRestaurantId, {
          ...payloadBase,
          role: 'staff',
        })
        toast.success(`Staff added: ${data.user.email}`)
      } else {
        const { data } = await platformAPI.createRestaurantAdmin(selectedRestaurantId, payloadBase)
        toast.success(`Admin added: ${data.admin.email}`)
      }
      setShowCreateModal(false)
      setAdminForm(EMPTY_ADMIN_FORM)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      submitLockRef.current = false
      setSaving(false)
    }
  }

  const selectedRestaurant = restaurants.find((r) => r._id === selectedRestaurantId)

  const planData = overview
    ? Object.entries(overview.planBreakdown || {}).map(([name, value]) => ({ name, value }))
    : []
  const statusData = overview
    ? Object.entries(overview.statusBreakdown || {}).map(([name, value]) => ({ name, value }))
    : []
  const daily = (overview?.dailyRevenue || []).map((d) => ({
    date: d._id?.slice(5) || '',
    orders: d.orders,
    revenue: d.revenue,
  }))
  const metricsBar = overview ? [
    { name: 'Orders', v: overview.totalOrders || 0 },
    { name: 'Revenue', v: overview.totalRevenue || 0 },
    { name: 'Staff', v: overview.totalStaff || 0 },
    { name: 'Customers', v: overview.totalCustomers || 0 },
  ] : []
  const topItems = overview?.topItems || []

  const tooltipStyle = { background: '#1c1410', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, color: '#fafaf9' }

  return (
    <div className="pb-12">
      <div className="mb-8">
          <p className="df-text-accent text-xs font-semibold uppercase tracking-widest mb-1">Super Admin</p>
          <h1 className="text-3xl font-bold text-white">My Restaurants</h1>
        </div>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Stat icon={FiMapPin} label="Restaurants" value={overview.totalRestaurants} accent="bg-gradient-to-br from-orange-500 to-red-600" />
          <Stat icon={FiPlay} label="Active" value={overview.activeRestaurants} accent="bg-gradient-to-br from-lime-500 to-emerald-600" />
          <Stat icon={FiUsers} label="Customers" value={overview.totalCustomers} accent="bg-gradient-to-br from-amber-500 to-orange-600" />
          <Stat icon={FiGrid} label="Staff" value={overview.totalStaff} accent="bg-gradient-to-br from-yellow-500 to-amber-600" />
          <Stat icon={FiShoppingBag} label="Orders" value={overview.totalOrders} accent="bg-gradient-to-br from-red-500 to-rose-600" />
          <Stat icon={FiDollarSign} label="Revenue" value={`₹${(overview.totalRevenue || 0).toLocaleString()}`} accent="bg-gradient-to-br from-orange-400 to-amber-500" />
        </div>
      )}

      <ToggleGroup className="mb-8">
        {TABS.map((t) => (
          <ToggleButton
            key={t.id}
            active={tab === t.id}
            onClick={() => setTab(t.id)}
            color={t.color}
            variant="dark"
            className="flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <t.icon size={15} /> {t.label}
            {t.id === 'messages' && newContactCount > 0 && (
              <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold inline-flex items-center justify-center">
                {newContactCount > 99 ? '99+' : newContactCount}
              </span>
            )}
          </ToggleButton>
        ))}
      </ToggleGroup>

      <AnimatePresence mode="wait">
        {tab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {loading ? (
              <p className="text-stone-500 py-12 text-center">Loading analytics...</p>
            ) : (
              <>
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  <ChartCard title="Revenue — last 7 days" icon={FiTrendingUp} empty={daily.length === 0}>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={daily}>
                        <XAxis dataKey="date" stroke="#78716c" fontSize={11} />
                        <YAxis stroke="#78716c" fontSize={11} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316' }} name="Revenue ₹" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Orders by status" icon={FiBarChart2} empty={statusData.length === 0}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78} label>
                          {statusData.map((_, i) => <Cell key={i} fill={FOOD_COLORS[i % FOOD_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  <ChartCard title="Platform metrics" icon={FiBarChart2} empty={!overview?.totalOrders}>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={metricsBar}>
                        <XAxis dataKey="name" stroke="#78716c" fontSize={12} />
                        <YAxis stroke="#78716c" fontSize={12} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="v" fill="url(#foodBar)" radius={[8, 8, 0, 0]} />
                        <defs>
                          <linearGradient id="foodBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#dc2626" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Subscription plans" icon={FiGrid} empty={planData.length === 0}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={planData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78} label>
                          {planData.map((_, i) => <Cell key={i} fill={FOOD_COLORS[i % FOOD_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                <div className="p-6 rounded-2xl platform-card">
                  <h3 className="font-semibold mb-4 text-orange-200 flex items-center gap-2">
                    <FiCoffee className="text-orange-400" /> Top selling dishes
                  </h3>
                  {topItems.length === 0 ? (
                    <p className="text-stone-500 text-sm">No orders yet</p>
                  ) : (
                    <div className="space-y-2">
                      {topItems.map((item, i) => (
                        <div key={item._id} className="flex justify-between text-sm py-2 border-b border-orange-500/10">
                          <span className="text-stone-300">
                            <span className="text-orange-500/60 mr-2">#{i + 1}</span>
                            {item._id}
                          </span>
                          <span className="text-amber-400 font-medium">{item.qty} sold · ₹{Math.round(item.revenue || 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {overview && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="platform-card p-4 rounded-xl">
                      <p className="text-stone-500 text-xs">Avg order</p>
                      <p className="text-orange-300 font-bold text-lg">₹{overview.avgOrderValue || 0}</p>
                    </div>
                    <div className="platform-card p-4 rounded-xl">
                      <p className="text-stone-500 text-xs">Menu items</p>
                      <p className="text-amber-300 font-bold text-lg">{overview.menuItems || 0}</p>
                    </div>
                    <div className="platform-card p-4 rounded-xl">
                      <p className="text-stone-500 text-xs">Tables</p>
                      <p className="text-lime-300 font-bold text-lg">{overview.tables || 0}</p>
                    </div>
                    <div className="platform-card p-4 rounded-xl">
                      <p className="text-stone-500 text-xs">7-day orders</p>
                      <p className="text-red-300 font-bold text-lg">{daily.reduce((s, d) => s + d.orders, 0)}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {tab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <PlatformUsersPanel restaurants={restaurants} />
          </motion.div>
        )}

        {tab === 'messages' && (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-100">Contact messages</h2>
                <p className="text-stone-500 text-sm">Messages from the landing page contact form</p>
              </div>
              {newContactCount > 0 && (
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {newContactCount} new
                </span>
              )}
            </div>

            {contactsLoading ? (
              <p className="text-stone-500 py-12 text-center">Loading messages...</p>
            ) : contacts.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5">
                <FiMail className="mx-auto text-4xl text-emerald-400/50 mb-4" />
                <p className="text-stone-300 font-medium mb-1">No messages yet</p>
                <p className="text-stone-500 text-sm">When visitors submit the contact form, messages appear here.</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {contacts.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => openContact(c)}
                      className={`w-full text-left p-4 rounded-2xl platform-card transition-all hover:border-emerald-500/35 ${
                        selectedContact?._id === c._id ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-100 truncate">{c.name}</p>
                          <p className="text-stone-400 text-sm truncate">{c.email}</p>
                        </div>
                        {c.status === 'new' && (
                          <span className="shrink-0 text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            New
                          </span>
                        )}
                      </div>
                      {c.restaurantName && (
                        <p className="text-stone-500 text-xs mb-1 truncate">Restaurant: {c.restaurantName}</p>
                      )}
                      <p className="text-stone-400 text-sm line-clamp-2">{c.message}</p>
                      <p className="text-stone-600 text-[11px] mt-2">{formatContactDate(c.createdAt)}</p>
                    </button>
                  ))}
                </div>

                <div className="platform-card p-5 rounded-2xl min-h-[280px]">
                  {selectedContact ? (
                    <>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-stone-100">{selectedContact.name}</h3>
                          <a href={`mailto:${selectedContact.email}`} className="text-emerald-400 text-sm hover:underline">
                            {selectedContact.email}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteContact(selectedContact._id)}
                          className="p-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10"
                          title="Delete message"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                      {selectedContact.restaurantName && (
                        <p className="text-stone-400 text-sm mb-3">
                          <span className="text-stone-500">Restaurant:</span> {selectedContact.restaurantName}
                        </p>
                      )}
                      {selectedContact.phone && (
                        <p className="text-stone-400 text-sm mb-3">
                          <span className="text-stone-500">Phone:</span> {selectedContact.phone}
                        </p>
                      )}
                      <p className="text-stone-500 text-xs mb-4">{formatContactDate(selectedContact.createdAt)}</p>
                      <div className="p-4 rounded-xl bg-stone-950/50 border border-white/5">
                        <p className="text-stone-200 text-sm whitespace-pre-wrap leading-relaxed">{selectedContact.message}</p>
                      </div>
                      <a
                        href={`mailto:${selectedContact.email}?subject=${encodeURIComponent(`Re: Savoria — ${selectedContact.restaurantName || 'your inquiry'}`)}`}
                        className="inline-flex mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                      >
                        Reply by email
                      </a>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <FiMail className="text-stone-600 mb-3" size={36} />
                      <p className="text-stone-500 text-sm">Select a message to read the full details</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-stone-100">Order History</h2>
              <p className="text-stone-500 text-sm">All orders across your restaurants — customer, address, restaurant, date & amount</p>
            </div>
            {ordersLoading ? (
              <p className="text-stone-500 py-12 text-center">Loading order history...</p>
            ) : (
              <OrderHistoryTable
                orders={platformOrders}
                showRestaurant
                variant="platform"
                emptyMessage="No orders yet — orders will appear here when customers place them."
              />
            )}
          </motion.div>
        )}

        {tab === 'restaurants' && (
          <motion.div
            key="restaurants"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-stone-100">Restaurants & admins</h2>
                <p className="text-stone-500 text-sm">Add restaurants, admins, and staff with restaurant name, phone, and email verification</p>
              </div>
              <button
                type="button"
                onClick={openCreateRestaurant}
                className="df-btn-primary shrink-0"
              >
                <FiPlus size={16} /> Add restaurant & admin
              </button>
            </div>

            {restaurants.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-orange-500/30 bg-orange-500/5">
                <FiCoffee className="mx-auto text-4xl text-orange-400/50 mb-4" />
                <p className="text-stone-300 font-medium mb-1">No restaurants yet</p>
                <p className="text-stone-500 text-sm max-w-md mx-auto mb-6">
                  Super Admin creates restaurants, admins, and staff here.
                </p>
                <button type="button" onClick={openCreateRestaurant} className="df-btn-primary">
                  <FiPlus size={16} /> Create first restaurant
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {restaurants.map((r) => (
                  <motion.div
                    key={r._id}
                    layout
                    className="p-5 rounded-2xl platform-card hover:border-orange-500/35 transition-all flex flex-col lg:flex-row lg:items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-bold text-lg shrink-0 shadow-lg shadow-orange-500/20">
                      {r.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-stone-100">{r.name}</h3>
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                          r.status === 'active'
                            ? 'bg-lime-500/20 text-lime-300 border border-lime-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>{r.status}</span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {r.subscription?.plan || 'free'}
                        </span>
                      </div>
                      <p className="text-stone-400 text-sm">
                        {r.address?.city || '—'} · {r.slug} · {r.stats?.totalOrders || 0} orders
                      </p>
                      <p className="text-stone-500 text-[11px] mt-1 font-mono truncate" title={r._id}>
                        Restaurant ID: {r._id}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25 font-medium">
                          {r.userCounts?.teamTotal ?? 0} admin & staff
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/25">
                          {r.userCounts?.admins ?? 0} admin
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/25">
                          {r.userCounts?.staff ?? 0} staff
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                          {r.userCounts?.customers ?? 0} customers
                        </span>
                      </div>
                    </div>

                    <ToggleGroup>
                      {PANELS.map((p) => (
                        <ToggleButton
                          key={p.id}
                          active={false}
                          onClick={() => enterRestaurant(r, p.id)}
                          color={p.color}
                          variant="dark"
                          className="px-4 py-2 text-xs"
                        >
                          {p.label}
                        </ToggleButton>
                      ))}
                    </ToggleGroup>

                    <button
                      type="button"
                      onClick={() => openAddAdmin(r._id)}
                      className="p-2.5 rounded-xl border border-blue-500/35 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 transition-all shrink-0"
                      title="Add admin"
                    >
                      <FiUserPlus size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openAddStaff(r._id)}
                      className="p-2.5 rounded-xl border border-lime-500/35 bg-lime-500/15 text-lime-300 hover:bg-lime-500/25 transition-all shrink-0"
                      title="Add staff"
                    >
                      <FiUsers size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleStatus(r)}
                      className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                        r.status === 'active'
                          ? 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25'
                          : 'bg-lime-500/15 border-lime-500/35 text-lime-300 hover:bg-lime-500/25'
                      }`}
                      title={r.status === 'active' ? 'Suspend' : 'Activate'}
                    >
                      {r.status === 'active' ? <FiPause size={16} /> : <FiPlay size={16} />}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <PlatformProvisionModal
        open={showCreateModal}
        createMode={createMode}
        selectedRestaurant={selectedRestaurant}
        form={adminForm}
        onFieldChange={setAdminField}
        onPhoneChange={(e) => setAdminForm({
          ...adminForm,
          adminPhone: e.target.value.replace(/\D/g, '').slice(0, 10),
        })}
        onSubmit={handleCreateAdmin}
        onClose={() => setShowCreateModal(false)}
        saving={saving}
      />
    </div>
  )
}
