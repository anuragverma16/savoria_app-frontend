import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FiMessageSquare, FiStar } from 'react-icons/fi'
import { restaurantAPI } from '../../api/dineflow'
import { formatMenuRating, formatReviewDate } from '../../utils/menuRating'

function StarRow({ rating, size = 12 }) {
  const stars = Math.round(Number(rating) || 0)
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <FiStar
          key={n}
          size={size}
          fill={n <= stars ? 'currentColor' : 'none'}
          className={n <= stars ? '' : 'text-white/20'}
        />
      ))}
    </span>
  )
}

export default function MenuReviewsAdminPanel({ restaurantId }) {
  const [reviews, setReviews] = useState([])
  const [menuSummary, setMenuSummary] = useState([])
  const [stats, setStats] = useState({ totalReviews: 0, avgRating: 0 })
  const [loading, setLoading] = useState(true)
  const [filterItem, setFilterItem] = useState('all')

  useEffect(() => {
    if (!restaurantId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await restaurantAPI(restaurantId).getMenuReviews()
        if (cancelled) return
        setReviews(data.reviews || [])
        setMenuSummary(data.menuSummary || [])
        setStats(data.stats || { totalReviews: 0, avgRating: 0 })
      } catch {
        if (!cancelled) {
          setReviews([])
          setMenuSummary([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [restaurantId])

  const filteredReviews = useMemo(() => {
    if (filterItem === 'all') return reviews
    return reviews.filter((r) => String(r.menuItem?._id || r.menuItem) === String(filterItem))
  }, [reviews, filterItem])

  const ratedItems = useMemo(
    () => menuSummary.filter((item) => (item.rating?.count || 0) > 0),
    [menuSummary],
  )

  if (loading) {
    return (
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-8 animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded-xl" />
          <div className="h-16 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <section className="mt-10 pt-8 border-t border-white/10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiMessageSquare className="text-amber-400" size={20} />
            <h2 className="text-xl font-bold">Customer Reviews</h2>
          </div>
          <p className="text-sm text-white/40">
            Menu-wise ratings from diners — averages update automatically when reviews are submitted.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatPill label="Total reviews" value={stats.totalReviews} color="text-white" />
          <StatPill
            label="Overall avg"
            value={stats.totalReviews ? stats.avgRating.toFixed(1) : '—'}
            color="text-amber-400"
          />
          <StatPill label="Rated dishes" value={ratedItems.length} color="text-emerald-400" />
        </div>
      </div>

      {ratedItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Ratings by dish</h3>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {ratedItems.map((item) => {
              const r = formatMenuRating(item.rating)
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setFilterItem(String(item._id))}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    filterItem === String(item._id)
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <p className="font-medium text-sm truncate mb-1">{item.name}</p>
                  <div className="flex items-center gap-2">
                    <StarRow rating={r.average} size={13} />
                    <span className="text-amber-400 font-bold text-sm">{r.label}</span>
                    <span className="text-xs text-white/40">({r.count} review{r.count !== 1 ? 's' : ''})</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filterItem}
          onChange={(e) => setFilterItem(e.target.value)}
          className="dineflow-select px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 sm:min-w-[200px]"
        >
          <option value="all" className="bg-slate-900">All dishes</option>
          {menuSummary.map((item) => (
            <option key={item._id} value={item._id} className="bg-slate-900">{item.name}</option>
          ))}
        </select>
        {filterItem !== 'all' && (
          <button
            type="button"
            onClick={() => setFilterItem('all')}
            className="text-xs text-emerald-400 hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
          <FiStar className="mx-auto text-3xl text-white/20 mb-3" />
          <p className="text-white/50">No customer reviews yet</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredReviews.map((review) => (
            <motion.li
              key={review._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-sm">{review.menuItem?.name || 'Dish'}</p>
                  <p className="text-xs text-white/40">
                    {review.guestName || 'Guest'}
                    {formatReviewDate(review.createdAt) ? ` · ${formatReviewDate(review.createdAt)}` : ''}
                  </p>
                </div>
                <StarRow rating={review.rating} size={14} />
              </div>
              {review.comment ? (
                <p className="text-sm text-white/60 leading-relaxed">{review.comment}</p>
              ) : (
                <p className="text-xs text-white/30 italic">No written comment</p>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </section>
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
