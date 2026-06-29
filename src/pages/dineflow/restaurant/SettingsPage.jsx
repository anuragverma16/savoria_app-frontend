import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { restaurantAPI } from '../../../api/dineflow'
import { setActiveRestaurant } from '../../../store/slices/tenantSlice'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const dispatch = useDispatch()
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const rid = activeRestaurant?._id

  useEffect(() => {
    if (!rid) return
    restaurantAPI(rid).getSettings().then(({ data }) => {
      const r = data.restaurant
      setForm({
        name: r.name || '',
        description: r.description || '',
        phone: r.phone || '',
        email: r.email || '',
        gstNumber: r.gstNumber || '',
        ownerName: r.ownerName || '',
        street: r.address?.street || '',
        city: r.address?.city || '',
        state: r.address?.state || '',
        pincode: r.address?.pincode || '',
        taxRate: r.settings?.taxRate ?? 5,
        serviceCharge: r.settings?.serviceCharge ?? 0,
        allowGuestOrdering: r.settings?.allowGuestOrdering ?? true,
        theme: r.settings?.theme || 'dark',
        upiId: r.settings?.upiId || '',
        upiPayeeName: r.settings?.upiPayeeName || r.name || '',
      })
    })
  }, [rid])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await restaurantAPI(rid).updateSettings({
        name: form.name,
        description: form.description,
        phone: form.phone,
        email: form.email,
        gstNumber: form.gstNumber,
        ownerName: form.ownerName,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        settings: {
          taxRate: Number(form.taxRate),
          serviceCharge: Number(form.serviceCharge),
          allowGuestOrdering: form.allowGuestOrdering,
          theme: form.theme,
          upiId: form.upiId?.trim() || '',
          upiPayeeName: form.upiPayeeName?.trim() || form.name,
        },
      })
      dispatch(setActiveRestaurant(data.restaurant))
      toast.success('Settings saved')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!form) return <div className="p-8 text-white/40">Loading settings...</div>

  const field = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500'

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Restaurant Settings</h1>
      <p className="text-white/40 text-sm mb-8">{activeRestaurant?.name}</p>

      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Basic info</h2>
          <input value={form.name} onChange={set('name')} placeholder="Restaurant name" className={field} />
          <textarea value={form.description} onChange={set('description')} placeholder="Description" rows={3} className={field} />
          <input value={form.ownerName} onChange={set('ownerName')} placeholder="Owner name" className={field} />
          <input value={form.gstNumber} onChange={set('gstNumber')} placeholder="GST number" className={field} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Contact</h2>
          <input value={form.phone} onChange={set('phone')} placeholder="Phone" className={field} />
          <input value={form.email} onChange={set('email')} placeholder="Email" className={field} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Address</h2>
          <input value={form.street} onChange={set('street')} placeholder="Street" className={field} />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.city} onChange={set('city')} placeholder="City" className={field} />
            <input value={form.state} onChange={set('state')} placeholder="State" className={field} />
          </div>
          <input value={form.pincode} onChange={set('pincode')} placeholder="Pincode" className={field} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Billing & orders</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Tax rate (%)</label>
              <input type="number" value={form.taxRate} onChange={set('taxRate')} className={field} />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Service charge (%)</label>
              <input type="number" value={form.serviceCharge} onChange={set('serviceCharge')} className={field} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={form.allowGuestOrdering} onChange={set('allowGuestOrdering')} />
            Allow guest QR ordering (no login)
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">UPI payments</h2>
          <p className="text-xs text-white/40">Shown when customers pay by UPI — generates a scan-to-pay QR on checkout</p>
          <input value={form.upiId} onChange={set('upiId')} placeholder="UPI ID (e.g. restaurant@upi)" className={field} />
          <input value={form.upiPayeeName} onChange={set('upiPayeeName')} placeholder="Payee name on UPI" className={field} />
        </section>

        <button type="button" onClick={save} disabled={saving} className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-sm disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
