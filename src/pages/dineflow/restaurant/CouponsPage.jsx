import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiTag, FiPercent, FiCalendar, FiShoppingBag,
} from 'react-icons/fi'
import { restaurantAPI } from '../../../api/dineflow'
import { ToggleButton, StatusSwitch } from '../../../components/dineflow/ToggleGroup'
import toast from 'react-hot-toast'

const EMPTY = {
  code: '',
  description: '',
  discountType: 'percentage',
  discount: '',
  minOrder: '0',
  maxDiscount: '0',
  usageLimit: '0',
  expiresAt: '',
}

const inputCls = 'w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all'

function Label({ children, required }) {
  return (
    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
      {children}{required && <span className="text-violet-400 ml-0.5">*</span>}
    </label>
  )
}

function CouponTicket({ coupon, preview, restaurantName, compact }) {
  const data = preview || coupon
  const isActive = preview ? true : coupon?.isActive
  const code = (data?.code || 'SAMPLE').toUpperCase()
  const discountType = data?.discountType || 'percentage'
  const discount = data?.discount || '0'
  const minOrder = data?.minOrder || 0
  const description = data?.description || 'Enjoy your special discount'
  const expiresAt = data?.expiresAt
  const usedCount = coupon?.usedCount ?? 0
  const usageLimit = data?.usageLimit || coupon?.usageLimit || 0

  const discountLabel = discountType === 'flat' ? `₹${discount}` : `${discount}%`
  const size = compact ? 'max-w-[320px]' : 'w-full'

  return (
    <div className={`relative ${size} ${!isActive && !preview ? 'opacity-55 grayscale' : ''}`}>
      {/* Tag ribbon */}
      <div className="absolute -top-2 left-6 z-10">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-violet-900/40 rotate-[-2deg]">
          <FiTag size={10} /> Coupon
        </span>
      </div>

      <div className="relative flex rounded-2xl overflow-hidden shadow-xl shadow-black/40 border border-violet-500/20">
        {/* Left stub — perforated tear line */}
        <div className="relative w-[28%] min-w-[88px] bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 flex flex-col items-center justify-center py-6 px-2 text-center">
          <div className="absolute right-0 top-0 bottom-0 w-3 flex flex-col justify-around py-1">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-slate-950 -mr-1.5" />
            ))}
          </div>
          <p className="text-[9px] uppercase tracking-widest text-violet-200/80 mb-1">Save</p>
          <p className="text-2xl sm:text-3xl font-black text-white leading-none">{discountLabel}</p>
          <p className="text-[10px] font-bold text-violet-200 mt-1 uppercase">OFF</p>
        </div>

        {/* Main body */}
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/80 p-4 sm:p-5 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 opacity-60" />

          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1 truncate">
            {restaurantName || 'Your Restaurant'}
          </p>

          <div className="inline-flex items-center gap-2 mb-2">
            <span className="font-mono text-lg sm:text-xl font-black text-white tracking-wider border-2 border-dashed border-violet-400/50 px-3 py-1 rounded-lg bg-violet-500/10">
              {code}
            </span>
          </div>

          <p className="text-xs text-white/60 line-clamp-2 mb-3">{description}</p>

          <div className="space-y-1 text-[10px] sm:text-xs text-white/45">
            <p className="flex items-center gap-1.5">
              <FiShoppingBag size={11} className="text-violet-400 shrink-0" />
              Min. order <span className="text-white font-semibold">₹{minOrder}</span>
            </p>
            {expiresAt && (
              <p className="flex items-center gap-1.5">
                <FiCalendar size={11} className="text-violet-400 shrink-0" />
                Valid till <span className="text-white font-medium">{new Date(expiresAt).toLocaleDateString()}</span>
              </p>
            )}
            {!preview && usageLimit > 0 && (
              <p className="text-violet-300/80">Used {usedCount} / {usageLimit} times</p>
            )}
          </div>

          {!preview && (
            <span className={`absolute top-3 right-3 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
              isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {isActive ? 'Active' : 'Expired'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CouponsPage() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const [coupons, setCoupons] = useState([])
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const rid = activeRestaurant?._id

  useEffect(() => { if (rid) load() }, [rid])

  const load = async () => {
    const { data } = await restaurantAPI(rid).coupons()
    setCoupons(data.coupons || [])
  }

  const openNew = () => {
    setForm(EMPTY)
    setEditingId(null)
    setModal(true)
  }

  const openEdit = (c) => {
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType || 'percentage',
      discount: String(c.discount),
      minOrder: String(c.minOrder || 0),
      maxDiscount: String(c.maxDiscount || 0),
      usageLimit: String(c.usageLimit || 0),
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    })
    setEditingId(c._id)
    setModal(true)
  }

  const save = async () => {
    if (!form.code || !form.discount) {
      toast.error('Code and discount are required')
      return
    }
    const payload = {
      code: form.code.toUpperCase(),
      description: form.description,
      discountType: form.discountType,
      discount: Number(form.discount),
      minOrder: Number(form.minOrder) || 0,
      maxDiscount: Number(form.maxDiscount) || 0,
      usageLimit: Number(form.usageLimit) || 0,
      expiresAt: form.expiresAt || undefined,
    }
    setSaving(true)
    try {
      const api = restaurantAPI(rid)
      if (editingId) {
        await api.updateCoupon(editingId, payload)
        toast.success('Coupon updated')
      } else {
        await api.createCoupon(payload)
        toast.success('Coupon created')
      }
      setModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this coupon?')) return
    await restaurantAPI(rid).deleteCoupon(id)
    toast.success('Coupon deleted')
    load()
  }

  const toggle = async (id) => {
    await restaurantAPI(rid).toggleCoupon(id)
    load()
  }

  const previewData = {
    ...form,
    minOrder: Number(form.minOrder) || 0,
    usageLimit: Number(form.usageLimit) || 0,
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <FiTag className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Coupons</h1>
              <p className="text-white/40 text-sm">{activeRestaurant?.name}</p>
            </div>
          </div>
          <p className="text-white/35 text-sm mt-2">{coupons.length} discount code{coupons.length !== 1 ? 's' : ''} created</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-violet-500/25"
        >
          <FiPlus size={16} /> Create Coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-violet-500/20 bg-violet-500/5">
          <FiTag className="mx-auto text-4xl text-violet-400/30 mb-4" />
          <p className="text-white/50 font-medium">No coupons yet</p>
          <button type="button" onClick={openNew} className="mt-4 px-5 py-2 rounded-xl bg-violet-500 text-white text-sm">Create Coupon</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {coupons.map((c) => (
            <div key={c._id} className="space-y-3">
              <CouponTicket coupon={c} restaurantName={activeRestaurant?.name} />
              <div className="flex gap-2 px-1">
                <StatusSwitch
                  active={c.isActive}
                  onClick={() => toggle(c._id)}
                  activeLabel="Deactivate"
                  inactiveLabel="Activate"
                />
                <button type="button" onClick={() => openEdit(c)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-violet-400 transition-colors">
                  <FiEdit2 size={14} />
                </button>
                <button type="button" onClick={() => remove(c._id)} className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-transparent">
                <div>
                  <h2 className="font-semibold text-lg">{editingId ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                </div>
                <button type="button" onClick={() => setModal(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/50">
                  <FiX size={20} />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(92vh-130px)] p-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Live preview */}
                  <div>
                    <p className="text-xs font-semibold text-violet-400/80 uppercase tracking-wider mb-4">Live preview</p>
                    <CouponTicket preview={previewData} restaurantName={activeRestaurant?.name} compact />
                  </div>

                  {/* Form */}
                  <div className="space-y-5">
                    <section>
                      <p className="text-xs font-semibold text-violet-400/80 uppercase tracking-wider mb-3">Coupon code</p>
                      <Label required>Promo code</Label>
                      <input
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. WELCOME10"
                        className={`${inputCls} font-mono text-lg tracking-widest uppercase`}
                      />
                    </section>

                    <section>
                      <p className="text-xs font-semibold text-violet-400/80 uppercase tracking-wider mb-3">Discount</p>
                      <div className="flex gap-2 mb-3">
                        <ToggleButton
                          active={form.discountType === 'percentage'}
                          onClick={() => setForm({ ...form, discountType: 'percentage' })}
                          color="violet"
                          variant="dark"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5"
                        >
                          <FiPercent size={14} /> Percentage
                        </ToggleButton>
                        <ToggleButton
                          active={form.discountType === 'flat'}
                          onClick={() => setForm({ ...form, discountType: 'flat' })}
                          color="violet"
                          variant="dark"
                          className="flex-1 py-2.5"
                        >
                          Flat ₹ OFF
                        </ToggleButton>
                      </div>
                      <Label required>{form.discountType === 'flat' ? 'Amount (₹)' : 'Percentage (%)'}</Label>
                      <input
                        type="number"
                        min="0"
                        value={form.discount}
                        onChange={(e) => setForm({ ...form, discount: e.target.value })}
                        placeholder={form.discountType === 'flat' ? '50' : '10'}
                        className={inputCls}
                      />
                    </section>

                    <section>
                      <p className="text-xs font-semibold text-violet-400/80 uppercase tracking-wider mb-3">Rules</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Min order (₹)</Label>
                          <input type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <Label>Usage limit</Label>
                          <input type="number" min="0" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="0 = unlimited" className={inputCls} />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label>Expiry date</Label>
                        <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputCls} />
                      </div>
                    </section>

                    <section>
                      <Label>Description (shown on coupon)</Label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="e.g. 10% off on your first order"
                        rows={2}
                        className={`${inputCls} resize-none`}
                      />
                    </section>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-white/10 bg-slate-950/50">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/5">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold disabled:opacity-50 shadow-lg shadow-violet-500/20"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
