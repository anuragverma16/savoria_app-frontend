import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { FiMaximize2 } from 'react-icons/fi'
import { publicAPI } from '../../../api/dineflow'

function buildMenuTarget(data, tableNo) {
  const rid = data.restaurant?._id
  const tableId = data.table?._id
  if (!rid || !tableId) return null
  const next = new URLSearchParams()
  next.set('restaurantId', String(rid))
  next.set('tableId', String(tableId))
  const no = data.table?.tableNumber ?? tableNo
  if (no != null && no !== '') next.set('no', String(no))
  return `/order/menu?${next.toString()}`
}

/** Public QR entry — /r/:slug/t/:tableNumber → guest menu */
export default function TableSlugQrRoute() {
  const { slug, tableNo } = useParams()
  const [target, setTarget] = useState(null)
  const [failed, setFailed] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!slug || !tableNo) {
      setFailed(true)
      setErrorMessage('Missing restaurant or table in this link.')
      return
    }

    let cancelled = false

    publicAPI.resolveTableBySlugNumber(slug, tableNo)
      .then(({ data }) => {
        if (cancelled) return
        const menuPath = buildMenuTarget(data, tableNo)
        if (!menuPath) {
          setFailed(true)
          setErrorMessage('Could not resolve this table. Ask staff for a new QR code.')
          return
        }
        setTarget(menuPath)
      })
      .catch((err) => {
        if (cancelled) return
        setFailed(true)
        const msg = err.response?.data?.message
          || (err.response ? 'This table link is invalid or unavailable.' : 'Cannot reach server. Check your connection.')
        setErrorMessage(msg)
      })

    return () => { cancelled = true }
  }, [slug, tableNo])

  if (target) return <Navigate to={target} replace />

  if (failed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <p className="text-white font-semibold mb-2">Cannot open table menu</p>
          <p className="text-white/50 text-sm mb-4">{errorMessage}</p>
          <p className="text-white/35 text-xs">
            Scan the QR on your table, or ask staff to regenerate QR codes in Admin → Tables.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <FiMaximize2 className="text-emerald-400 mb-4 animate-pulse" size={40} />
      <p className="text-white font-semibold">Opening menu…</p>
    </div>
  )
}
