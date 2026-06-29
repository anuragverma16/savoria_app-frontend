import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { FiSearch, FiCoffee, FiRefreshCw } from 'react-icons/fi'
import { restaurantAPI } from '../../../api/dineflow'
import { StockToggle } from '../../../components/dineflow/ToggleGroup'
import toast from 'react-hot-toast'

export default function StaffMenuStockPage() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const rid = activeRestaurant?._id

  useEffect(() => { if (rid) load() }, [rid])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await restaurantAPI(rid).menu()
      setItems(data.menuItems || [])
    } catch {
      toast.error('Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  const toggleStock = async (id) => {
    try {
      const { data } = await restaurantAPI(rid).toggleAvailability(id)
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, isAvailable: data.item?.isAvailable ?? !i.isAvailable } : i)))
      toast.success(data.item?.isAvailable ? 'Back in stock' : 'Marked out of stock')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    }
  }

  const stats = useMemo(() => ({
    inStock: items.filter((i) => i.isAvailable).length,
    outStock: items.filter((i) => !i.isAvailable).length,
  }), [items])

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all'
      || (filter === 'in' && item.isAvailable)
      || (filter === 'out' && !item.isAvailable)
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Menu Stock</h1>
          <p className="text-white/40 text-sm">{activeRestaurant?.name}</p>
        </div>
        <button type="button" onClick={load} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10">
          <FiRefreshCw size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-xs text-emerald-400">{stats.inStock} in stock</span>
        <span className="px-3 py-1 rounded-lg bg-red-500/10 text-xs text-red-400">{stats.outStock} out of stock</span>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500/50"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="dineflow-select bg-slate-800 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200"
        >
          <option value="all" className="bg-slate-900">All items</option>
          <option value="in" className="bg-slate-900">In stock</option>
          <option value="out" className="bg-slate-900">Out of stock</option>
        </select>
      </div>

      {loading ? (
        <p className="text-white/40">Loading menu...</p>
      ) : filtered.length === 0 ? (
        <p className="text-white/40">No menu items found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item._id} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                {item.image?.url ? (
                  <img src={item.image.url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <FiCoffee className="text-white/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-white/40">
                  {item.category?.name || 'Uncategorized'} · ₹{item.price}
                </p>
              </div>
              <StockToggle inStock={item.isAvailable} onClick={() => toggleStock(item._id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
