import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiImage,
  FiClock, FiGrid, FiList, FiCoffee, FiStar, FiChevronDown, FiChevronUp,
} from 'react-icons/fi'
import { GiKnifeFork } from 'react-icons/gi'
import { restaurantAPI } from '../../../api/dineflow'
import { ToggleButton, StockToggle } from '../../../components/dineflow/ToggleGroup'
import { MENU_FORM_PORTION_UNITS, formatPortionSize } from '../../../utils/portionSize'
import { INGREDIENT_CHIP_CLASS, INGREDIENT_CHIP_CLASS_SM } from '../../../data/menuCardGradients'
import MenuReviewsAdminPanel from '../../../components/dineflow/MenuReviewsAdminPanel'
import { formatMenuRating } from '../../../utils/menuRating'
import toast from 'react-hot-toast'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1512621776951-a41bdfeb9303?w=600&q=80&fit=crop'
const MAX_ITEMS_USED = 5
const EMPTY_ITEMS_USED = () => Array.from({ length: MAX_ITEMS_USED }, () => '')

function itemsUsedFromForm(itemsUsed = []) {
  return itemsUsed.map((s) => String(s).trim()).filter(Boolean)
}

function itemsUsedToForm(ingredients) {
  const list = Array.isArray(ingredients) ? ingredients : []
  const slots = [...list.slice(0, MAX_ITEMS_USED)]
  while (slots.length < MAX_ITEMS_USED) slots.push('')
  return slots
}

function parseItemIngredients(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((i) => String(i).trim()).filter(Boolean)
  return String(raw).split(/[,;\n]/).map((i) => i.trim()).filter(Boolean)
}

function mergeSavedMenuItem(saved, categories, previous) {
  if (!saved) return previous
  const catId = saved.category?._id || saved.category
  const category = saved.category?.name
    ? saved.category
    : categories.find((c) => c._id === catId) || previous?.category
  return { ...previous, ...saved, category: category || saved.category }
}

function createEmptyItem() {
  return {
    name: '',
    description: '',
    price: '',
    quantity: '0',
    portionSize: '',
    portionUnit: 'gm',
    discount: '0',
    calories: '0',
    category: '',
    isVeg: true,
    isBestseller: false,
    isRecommended: false,
    imageUrl: '',
    imageFile: null,
    prepTime: '15 min',
    tags: '',
    itemsUsed: EMPTY_ITEMS_USED(),
  }
}

const PREP_TIMES = ['10 min', '15 min', '20 min', '25 min', '30 min', '45 min']

const inputCls = 'w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all'

function Label({ children, required }) {
  return (
    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
      {children}{required && <span className="text-emerald-400 ml-0.5">*</span>}
    </label>
  )
}

export default function MenuManagementPage() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [showCat, setShowCat] = useState(false)
  const [catName, setCatName] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(() => createEmptyItem())
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [view, setView] = useState('grid')
  const [saving, setSaving] = useState(false)
  const [previewImg, setPreviewImg] = useState(FALLBACK_IMG)
  const rid = activeRestaurant?._id

  useEffect(() => {
    if (form.imageFile) {
      const url = URL.createObjectURL(form.imageFile)
      setPreviewImg(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewImg(form.imageUrl?.trim() || FALLBACK_IMG)
  }, [form.imageFile, form.imageUrl])

  useEffect(() => { if (rid) load() }, [rid])

  const load = async () => {
    const api = restaurantAPI(rid)
    const [m, c] = await Promise.all([api.menu(), api.categories()])
    setItems(m.data.menuItems)
    setCategories(c.data.categories)
  }

  const stats = useMemo(() => ({
    total: items.length,
    inStock: items.filter((i) => i.isAvailable).length,
    outStock: items.filter((i) => !i.isAvailable).length,
  }), [items])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
      const catId = item.category?._id || item.category
      const matchCat = filterCat === 'all' || catId === filterCat
      return matchSearch && matchCat
    })
  }, [items, search, filterCat])

  const addCategory = async () => {
    if (!catName.trim()) return
    await restaurantAPI(rid).createCategory({ name: catName })
    setCatName('')
    setShowCat(false)
    load()
    toast.success('Category added')
  }

  const openAdd = () => {
    if (!categories.length) {
      toast.error('Add a category first')
      setShowCat(true)
      return
    }
    setForm({ ...createEmptyItem(), category: categories[0]?._id || '' })
    setModal('add')
  }

  const openEdit = (item) => {
    setForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      quantity: item.quantity != null ? String(item.quantity) : '0',
      portionSize: item.portionSize != null ? String(item.portionSize) : '',
      portionUnit: item.portionUnit || 'gm',
      discount: item.discount != null ? String(item.discount) : '0',
      calories: item.calories != null ? String(item.calories) : '0',
      category: item.category?._id || item.category,
      isVeg: item.isVeg,
      isBestseller: item.isBestseller || false,
      isRecommended: item.isRecommended || false,
      imageUrl: item.image?.url || '',
      imageFile: null,
      prepTime: item.prepTime || '15 min',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      itemsUsed: itemsUsedToForm(item.ingredients),
      _id: item._id,
    })
    setModal('edit')
  }

  const buildMenuPayload = () => {
    const usedItems = itemsUsedFromForm(form.itemsUsed)
    const imageUrl = form.imageUrl?.trim() || FALLBACK_IMG
    const base = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      quantity: Math.max(0, Number(form.quantity) || 0),
      portionSize: form.portionSize === '' ? '' : Math.max(0, Number(form.portionSize) || 0),
      portionUnit: form.portionUnit || '',
      discount: Math.min(100, Math.max(0, Number(form.discount) || 0)),
      calories: Math.max(0, Number(form.calories) || 0),
      category: form.category,
      isVeg: form.isVeg,
      isBestseller: form.isBestseller,
      isRecommended: form.isRecommended,
      prepTime: form.prepTime,
      tags: form.tags,
      ingredients: usedItems,
    }

    if (form.imageFile) {
      const fd = new FormData()
      Object.entries(base).forEach(([key, value]) => {
        if (key === 'ingredients') {
          fd.append(key, JSON.stringify(value))
          return
        }
        fd.append(key, typeof value === 'boolean' ? String(value) : String(value ?? ''))
      })
      fd.append('image', form.imageFile)
      return fd
    }

    return {
      ...base,
      image: { url: imageUrl },
    }
  }

  const saveItem = async () => {
    if (!form.name.trim()) {
      toast.error('Item name is required')
      return
    }
    if (!form.price && form.price !== 0) {
      toast.error('Price is required')
      return
    }
    if (Number(form.price) < 0) {
      toast.error('Price cannot be negative')
      return
    }
    if (form.quantity === '' || Number(form.quantity) < 0) {
      toast.error('Valid quantity is required')
      return
    }
    if (!form.category) {
      toast.error('Category is required')
      return
    }

    const payload = buildMenuPayload()
    const mode = modal
    const itemId = form._id
    setSaving(true)
    setModal(null)
    try {
      const api = restaurantAPI(rid)
      if (mode === 'edit') {
        const { data } = await api.updateMenuItem(itemId, payload)
        const merged = mergeSavedMenuItem(
          data.menuItem,
          categories,
          items.find((i) => i._id === itemId),
        )
        setItems((prev) => prev.map((i) => (i._id === itemId ? merged : i)))
        toast.success('Menu item updated')
      } else {
        const { data } = await api.createMenuItem(payload)
        const merged = mergeSavedMenuItem(data.menuItem, categories)
        setItems((prev) => [merged, ...prev])
        toast.success('Menu item added')
      }
    } catch (e) {
      setModal(mode)
      const message = e.response?.data?.message || e.message || 'Save failed'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this menu item permanently?')) return
    await restaurantAPI(rid).deleteMenuItem(id)
    toast.success('Item deleted')
    load()
  }

  const toggleStock = async (id) => {
    const previous = items.find((i) => i._id === id)
    if (!previous) return
    setItems((prev) => prev.map((i) => (
      i._id === id ? { ...i, isAvailable: !i.isAvailable } : i
    )))
    try {
      const { data } = await restaurantAPI(rid).toggleAvailability(id)
      setItems((prev) => prev.map((i) => (
        i._id === id ? mergeSavedMenuItem(data.menuItem, categories, i) : i
      )))
    } catch {
      setItems((prev) => prev.map((i) => (i._id === id ? previous : i)))
      toast.error('Could not update stock')
    }
  }

  const discountedPrice = useMemo(() => {
    const price = Number(form.price) || 0
    const discount = Number(form.discount) || 0
    if (!price || !discount) return null
    return Math.round(price - (price * discount / 100))
  }, [form.price, form.discount])

  const previewItemsUsed = useMemo(
    () => itemsUsedFromForm(form.itemsUsed),
    [form.itemsUsed],
  )

  const updateItemUsed = (index, value) => {
    const itemsUsed = [...form.itemsUsed]
    itemsUsed[index] = value
    setForm({ ...form, itemsUsed })
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FiCoffee className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Menu Management</h1>
              <p className="text-white/40 text-sm">{activeRestaurant?.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <StatPill label="Total items" value={stats.total} color="text-white" />
            <StatPill label="In stock" value={stats.inStock} color="text-emerald-400" />
            <StatPill label="Out of stock" value={stats.outStock} color="text-red-400" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowCat((v) => !v)} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 transition-colors">
            + Category
          </button>
          <button type="button" onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow">
            <FiPlus size={16} /> Add Menu Item
          </button>
        </div>
      </div>

      {/* Add category bar */}
      <AnimatePresence>
        {showCat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="flex gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
              <input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="New category name (e.g. Starters)"
                className={`${inputCls} flex-1`}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <button type="button" onClick={addCategory} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium shrink-0">Add</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes..."
            className={`${inputCls} pl-11`}
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className={`dineflow-select ${inputCls} sm:w-48`}
        >
          <option value="all" className="bg-slate-900">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id} className="bg-slate-900">{c.name}</option>
          ))}
        </select>
        <div className="flex gap-1 shrink-0">
          <ToggleButton active={view === 'grid'} onClick={() => setView('grid')} color="emerald" variant="dark" className="px-4 py-3">
            <FiGrid size={16} />
          </ToggleButton>
          <ToggleButton active={view === 'list'} onClick={() => setView('list')} color="emerald" variant="dark" className="px-4 py-3">
            <FiList size={16} />
          </ToggleButton>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          type="button"
          onClick={() => setFilterCat('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            filterCat === 'all'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
              : 'bg-slate-800 text-white border border-white/20 hover:border-emerald-500/40 hover:text-emerald-300'
          }`}
        >
          All ({items.length})
        </button>
        {categories.map((c) => {
          const count = items.filter((i) => (i.category?._id || i.category) === c._id).length
          return (
            <button
              key={c._id}
              type="button"
              onClick={() => setFilterCat(c._id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filterCat === c._id
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'bg-slate-800 text-white border border-white/20 hover:border-emerald-500/40 hover:text-emerald-300'
              }`}
            >
              {c.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
          <FiCoffee className="mx-auto text-4xl text-white/20 mb-4" />
          <p className="text-white/50 font-medium">No menu items found</p>
          <button type="button" onClick={openAdd} className="mt-4 px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm">Add Menu Item</button>
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <MenuCard key={item._id} item={item} onEdit={openEdit} onDelete={deleteItem} onToggleStock={toggleStock} />
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((item) => (
            <MenuRow key={item._id} item={item} onEdit={openEdit} onDelete={deleteItem} onToggleStock={toggleStock} />
          ))}
        </div>
      )}

      <MenuReviewsAdminPanel restaurantId={rid} />
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => { if (!saving) setModal(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl shadow-black/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-transparent">
                <div>
                  <h2 className="font-semibold text-lg">{modal === 'edit' ? 'Edit Menu Item' : 'Add New Dish'}</h2>
                </div>
                <button type="button" onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                  <FiX size={20} />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(92vh-140px)]">
                <div className="p-6 grid md:grid-cols-5 gap-6">
                  {/* Live preview */}
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Preview</p>
                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-950/50">
                      <div className="relative aspect-[4/3]">
                        <img src={previewImg} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = FALLBACK_IMG }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        {!form.isVeg ? (
                          <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/90 text-white text-[10px] font-bold uppercase">
                            <GiKnifeFork size={12} /> Non-veg
                          </span>
                        ) : (
                          <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/90 text-white text-[10px] font-bold uppercase">
                            Veg
                          </span>
                        )}
                        {form.isBestseller && (
                          <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/90 text-white text-[10px] font-bold">
                            <FiStar size={10} /> Bestseller
                          </span>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="font-semibold text-white truncate">{form.name || 'Dish name'}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-emerald-400 font-bold text-lg">₹{form.price || '0'}</p>
                            {discountedPrice != null && (
                              <p className="text-amber-300 text-sm font-semibold">₹{discountedPrice} after {form.discount}% off</p>
                            )}
                            {form.quantity !== '' && (
                              <p className="text-white/60 text-xs">Stock: {form.quantity}</p>
                            )}
                            {formatPortionSize(form) && (
                              <p className="text-white/60 text-xs">{formatPortionSize(form)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 text-xs text-white/40 line-clamp-2 min-h-[2.5rem]">
                        {form.description || 'Description will appear here...'}
                      </div>
                      {previewItemsUsed.length > 0 && (
                        <div className="px-3 pb-3 text-[10px] border-t border-white/5 pt-2">
                          <span className="uppercase tracking-wider text-emerald-400/70">Items used</span>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {previewItemsUsed.map((ing) => (
                              <span key={ing} className={INGREDIENT_CHIP_CLASS_SM}>
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form */}
                  <div className="md:col-span-3 space-y-5">
                    <section>
                      <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-3">Basic info</p>
                      <div className="space-y-3">
                        <div>
                          <Label required>Item name</Label>
                          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Butter Chicken" className={inputCls} />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short appetizing description..." rows={3} className={`${inputCls} resize-none`} />
                        </div>
                      </div>
                    </section>

                    <section>
                      <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-3">Pricing & category</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label required>Price (₹)</Label>
                          <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="299" className={inputCls} />
                        </div>
                        <div>
                          <Label required>Stock quantity</Label>
                          <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 50" className={inputCls} />
                        </div>
                        <div>
                          <Label>Portion size</Label>
                          <input type="number" min="0" step="0.01" value={form.portionSize} onChange={(e) => setForm({ ...form, portionSize: e.target.value })} placeholder="e.g. 250" className={inputCls} />
                        </div>
                        <div>
                          <Label>Portion unit</Label>
                          <select value={form.portionUnit} onChange={(e) => setForm({ ...form, portionUnit: e.target.value })} className={`dineflow-select ${inputCls}`}>
                            {MENU_FORM_PORTION_UNITS.map((u) => (
                              <option key={u.value} value={u.value} className="bg-slate-900">{u.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Discount (%)</Label>
                          <input type="number" min="0" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="0" className={inputCls} />
                        </div>
                        <div>
                          <Label>Calories</Label>
                          <input type="number" min="0" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="0" className={inputCls} />
                        </div>
                        <div className="col-span-2">
                          <Label required>Category</Label>
                          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`dineflow-select ${inputCls}`}>
                            <option value="">Select category...</option>
                            {categories.map((c) => <option key={c._id} value={c._id} className="bg-slate-900">{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </section>

                    <section>
                      <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-3">Details</p>
                      <div className="space-y-3">
                        <div>
                          <Label><FiImage className="inline mr-1 -mt-0.5" size={12} /> Upload image</Label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              setForm({ ...form, imageFile: file, imageUrl: file ? '' : form.imageUrl })
                            }}
                            className={`${inputCls} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:text-emerald-300 file:text-xs`}
                          />
                        </div>
                        <div>
                          <Label><FiImage className="inline mr-1 -mt-0.5" size={12} /> Or image URL</Label>
                          <input
                            value={form.imageUrl}
                            onChange={(e) => setForm({ ...form, imageUrl: e.target.value, imageFile: null })}
                            placeholder="https://..."
                            className={inputCls}
                            disabled={Boolean(form.imageFile)}
                          />
                        </div>
                        <div>
                          <Label><FiClock className="inline mr-1 -mt-0.5" size={12} /> Prep time</Label>
                          <select value={form.prepTime} onChange={(e) => setForm({ ...form, prepTime: e.target.value })} className={`dineflow-select ${inputCls}`}>
                            {PREP_TIMES.map((t) => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label>Tags (comma separated)</Label>
                          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="spicy, chef special" className={inputCls} />
                        </div>
                        <div>
                          <Label>Items used in this product (up to {MAX_ITEMS_USED})</Label>
                          <p className="text-[10px] text-white/30 mb-2">
                            Listed on the menu under &quot;View more · ingredients&quot;.
                          </p>
                          <div className="space-y-2">
                            {form.itemsUsed.map((value, index) => (
                              <input
                                key={index}
                                value={value}
                                onChange={(e) => updateItemUsed(index, e.target.value)}
                                placeholder={`Item ${index + 1} e.g. ${['tomato', 'basil', 'cheese', 'chicken', 'rice'][index] || 'ingredient'}`}
                                className={inputCls}
                              />
                            ))}
                          </div>
                          {previewItemsUsed.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {previewItemsUsed.map((ing) => (
                                <span key={ing} className={INGREDIENT_CHIP_CLASS_SM}>
                                  {ing}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ToggleButton active={form.isVeg} onClick={() => setForm({ ...form, isVeg: true })} color="emerald" variant="dark" className="flex items-center gap-1.5 px-3 py-2">
                            Vegetarian
                          </ToggleButton>
                          <ToggleButton active={!form.isVeg} onClick={() => setForm({ ...form, isVeg: false })} color="red" variant="dark" className="flex items-center gap-1.5 px-3 py-2">
                            <GiKnifeFork size={14} /> Non-veg
                          </ToggleButton>
                          <ToggleButton active={form.isBestseller} onClick={() => setForm({ ...form, isBestseller: !form.isBestseller })} color="amber" variant="dark" className="flex items-center gap-1.5 px-3 py-2">
                            <FiStar size={14} /> Bestseller
                          </ToggleButton>
                          <ToggleButton active={form.isRecommended} onClick={() => setForm({ ...form, isRecommended: !form.isRecommended })} color="violet" variant="dark" className="flex items-center gap-1.5 px-3 py-2">
                            Recommended
                          </ToggleButton>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-white/10 bg-slate-950/50">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveItem}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {saving ? 'Saving...' : modal === 'edit' ? 'Save Changes' : 'Add to Menu'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatPill({ label, value, color }) {
  return (
    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
    </div>
  )
}

function MenuItemIngredientsBlock({ item, compact = false }) {
  const [expanded, setExpanded] = useState(false)
  const ingredients = parseItemIngredients(item.ingredients)
  if (!ingredients.length) return null

  return (
    <div className={compact ? 'mt-1' : 'mb-3'}>
      {!expanded && (
        <div className={`flex flex-wrap gap-1 ${compact ? 'mb-1' : 'mb-2'} max-h-5 overflow-hidden`}>
          {ingredients.slice(0, compact ? 3 : 4).map((ing) => (
            <span key={ing} className={INGREDIENT_CHIP_CLASS_SM}>
              {ing}
            </span>
          ))}
          {ingredients.length > (compact ? 3 : 4) && (
            <span className="text-[9px] text-white/40">+{ingredients.length - (compact ? 3 : 4)}</span>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
      >
        {expanded ? (
          <>View less <FiChevronUp size={14} /></>
        ) : (
          <>View more · ingredients <FiChevronDown size={14} /></>
        )}
      </button>
      {expanded && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {ingredients.map((ing) => (
            <li key={ing} className={INGREDIENT_CHIP_CLASS}>
              {ing}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MenuCard({ item, onEdit, onDelete, onToggleStock }) {
  const img = item.image?.url || FALLBACK_IMG
  const ratingInfo = formatMenuRating(item.rating)
  return (
    <div
      className={`rounded-2xl overflow-hidden border bg-slate-900/50 ${item.isAvailable ? 'border-white/10' : 'border-red-500/20 opacity-80'}`}
    >
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="relative aspect-[16/10] w-full overflow-hidden block text-left"
      >
        <img src={img} alt={item.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
        {item.category?.name && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-white text-slate-900 text-xs font-bold uppercase tracking-wide shadow-lg pointer-events-none">
            {item.category.name}
          </span>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5 pointer-events-none">
          {item.isVeg ? (
            <span className="w-5 h-5 rounded border-2 border-emerald-500 flex items-center justify-center bg-white">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </span>
          ) : (
            <span className="w-5 h-5 rounded border-2 border-red-500 flex items-center justify-center bg-white">
              <span className="w-2 h-2 rounded-full bg-red-500" />
            </span>
          )}
          {item.isBestseller && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[9px] font-bold text-white flex items-center gap-0.5">
              <FiStar size={8} /> HOT
            </span>
          )}
        </div>
        <span
          className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold uppercase pointer-events-none ${
            item.isAvailable ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {item.isAvailable ? 'In Stock' : 'Out of Stock'}
        </span>
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
          <h3 className="font-semibold text-white truncate text-base">{item.name}</h3>
          <div className="flex items-center justify-between mt-1 gap-2 flex-wrap">
            <span className="text-emerald-400 font-bold text-lg">₹{item.price}</span>
            {ratingInfo.hasReviews && (
              <span className="text-xs text-amber-400 flex items-center gap-0.5 bg-black/40 px-2 py-0.5 rounded-md">
                <FiStar size={11} fill="currentColor" />
                {ratingInfo.label}
                <span className="text-white/50">({ratingInfo.count})</span>
              </span>
            )}
            <span className="text-xs text-white/70 bg-black/40 px-2 py-0.5 rounded-md">
              Stock: {item.quantity ?? 0}
            </span>
            {formatPortionSize(item) && (
              <span className="text-xs text-white/80 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                {formatPortionSize(item)}
              </span>
            )}
            {item.prepTime && (
              <span className="text-xs text-white/80 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md">
                <FiClock size={11} /> {item.prepTime}
              </span>
            )}
          </div>
        </div>
      </button>
      <div className="p-4">
        <p className="text-white/50 text-xs line-clamp-2 min-h-[2rem]">{item.description || 'No description'}</p>
        <MenuItemIngredientsBlock item={item} />
        <div className="flex gap-2 mt-3">
          <StockToggle inStock={item.isAvailable} onClick={() => onToggleStock(item._id)} className="flex-1 py-2" />
          <button type="button" onClick={() => onEdit(item)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-emerald-400 transition-colors">
            <FiEdit2 size={14} />
          </button>
          <button type="button" onClick={() => onDelete(item._id)} className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function MenuRow({ item, onEdit, onDelete, onToggleStock }) {
  const img = item.image?.url || FALLBACK_IMG
  const ratingInfo = formatMenuRating(item.rating)
  return (
    <div className={`flex gap-4 p-4 rounded-2xl border bg-white/[0.03] ${item.isAvailable ? 'border-white/10' : 'border-red-500/20'}`}>
      <img src={img} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium">{item.name}</h3>
              {item.category?.name && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-white text-xs font-bold uppercase">
                  {item.category.name}
                </span>
              )}
            </div>
            <p className="text-xs text-white/50">
              {item.prepTime}
              {formatPortionSize(item) ? ` · ${formatPortionSize(item)}` : ''}
              {' · '}Stock {item.quantity ?? 0}
              {ratingInfo.hasReviews ? ` · ★ ${ratingInfo.label} (${ratingInfo.count})` : ''}
            </p>
          </div>
          <span className="text-emerald-400 font-bold shrink-0">₹{item.price}</span>
        </div>
        <p className="text-xs text-white/50 mt-1 line-clamp-1">{item.description || 'No description'}</p>
        <MenuItemIngredientsBlock item={item} compact />
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <StockToggle inStock={item.isAvailable} onClick={() => onToggleStock(item._id)} className="text-[10px] px-2 py-1" />
        <button type="button" onClick={() => onEdit(item)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10"><FiEdit2 size={14} /></button>
        <button type="button" onClick={() => onDelete(item._id)} className="p-2 rounded-lg bg-red-500/10 text-red-400"><FiTrash2 size={14} /></button>
      </div>
    </div>
  )
}
