import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { FiUser, FiShield } from 'react-icons/fi'
import { restaurantAPI } from '../../../api/dineflow'
import toast from 'react-hot-toast'

export default function StaffManagementPage() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const rid = activeRestaurant?._id
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!rid) return
    setLoading(true)
    try {
      const { data } = await restaurantAPI(rid).staff()
      setStaff(data.staff || [])
    } catch {
      toast.error('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [rid])

  const activeStaff = staff.filter((m) => m.isActive)
  const inactiveStaff = staff.filter((m) => !m.isActive)

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Staff</h1>
          <p className="text-white/40 text-sm flex items-center gap-1.5">
            <FiShield size={14} className="text-orange-400" />
            Staff accounts are added by Super Admin only
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-white/40 py-12 text-center">Loading staff...</p>
      ) : activeStaff.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/15">
          <FiUser className="mx-auto text-4xl text-white/20 mb-4" />
          <p className="text-white/60 font-medium mb-1">No staff yet</p>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            Ask your Super Admin to create staff accounts from the platform panel.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-white/30 text-xs uppercase border-b border-white/5">
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Phone</th>
                <th className="text-left p-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {activeStaff.map((m) => (
                <tr key={m._id} className="border-b border-white/5 text-white/70">
                  <td className="p-4 font-medium text-white/90">{m.user?.name}</td>
                  <td className="p-4">{m.user?.email}</td>
                  <td className="p-4">{m.user?.phone || '—'}</td>
                  <td className="p-4 capitalize">{m.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inactiveStaff.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-white/50 mb-3">Inactive staff</h3>
          <div className="space-y-2">
            {inactiveStaff.map((m) => (
              <div key={m._id} className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-xl bg-white/5 border border-white/10 opacity-70">
                <div>
                  <p className="font-medium">{m.user?.name}</p>
                  <p className="text-xs text-white/40">{m.user?.email}</p>
                </div>
                <span className="text-xs text-white/40 capitalize">{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
