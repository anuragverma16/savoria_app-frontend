import { useEffect, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { FiMaximize2 } from 'react-icons/fi'
import { publicAPI } from '../../../api/dineflow'

/** Legacy /r/:slug/order links → public book-table entry */
export default function QRMenuRoute() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const [target, setTarget] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const tableToken = searchParams.get('table')
    if (!tableToken || !slug) {
      setFailed(true)
      return
    }

    publicAPI.validateTable(slug, tableToken)
      .then(({ data }) => {
        const rid = data.restaurant?._id
        if (!rid) {
          setFailed(true)
          return
        }
        const next = new URLSearchParams(searchParams)
        next.set('rid', rid)
        if (data.table?.tableNumber) next.set('no', String(data.table.tableNumber))
        if (data.restaurant?.slug) next.set('slug', data.restaurant.slug)
        setTarget(`/order/tables?${next.toString()}`)
      })
      .catch(() => setFailed(true))
  }, [slug, searchParams])

  if (target) return <Navigate to={target} replace />

  if (failed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-white font-semibold mb-2">Invalid table QR</p>
          <p className="text-white/50 text-sm">Ask staff to print a new table QR from admin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <FiMaximize2 className="text-emerald-400 mb-4 animate-pulse" size={40} />
      <p className="text-white font-semibold">Opening table link…</p>
    </div>
  )
}
