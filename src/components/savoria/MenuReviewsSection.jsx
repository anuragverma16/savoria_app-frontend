import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FiMessageSquare, FiStar } from 'react-icons/fi'
import { publicAPI } from '../../api/dineflow'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'
import { formatMenuRating, formatReviewDate } from '../../utils/menuRating'

function StarRow({ rating, size = 12 }) {
  const stars = Math.round(Number(rating) || 0)
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <FiStar
          key={n}
          size={size}
          fill={n <= stars ? 'currentColor' : 'none'}
          className={n <= stars ? '' : 'text-[var(--sv-text-muted)]/30'}
        />
      ))}
    </span>
  )
}

export default function MenuReviewsSection() {
  const { restaurant } = useSavoriaGuest()

  const rid = restaurant?._id
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const loadReviews = useCallback(async () => {
    if (!rid) return
    setLoading(true)
    try {
      const { data } = await publicAPI.getMenuReviews({ restaurantId: rid, limit: 30 })
      setReviews(data.reviews || [])
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [rid])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  if (!rid) return null

  return (
    <section className="mt-10 pt-8 border-t border-[var(--sv-border)]/60">
      <div className="flex items-center gap-2 mb-1">
        <FiMessageSquare className="text-[var(--sv-accent)]" size={20} />
        <h2 className="sv-display font-bold text-lg text-[var(--sv-text)]">Customer Reviews</h2>
      </div>
      <p className="text-sm text-[var(--sv-text-muted)] mb-6">
        Ratings come from diners after their order — you can rate your dishes on the order success page.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="sv-glass rounded-xl h-20 animate-pulse border border-[var(--sv-border)]/30" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="sv-empty-state sv-glass rounded-2xl py-10">
          <div className="sv-empty-state-icon text-2xl">⭐</div>
          <p className="font-medium text-[var(--sv-text)]">No reviews yet</p>
          <p className="text-sm text-[var(--sv-text-muted)] mt-1">Order a dish and rate it after checkout!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const dishRating = formatMenuRating(review.menuItem?.rating)
            return (
              <motion.li
                key={review._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="sv-glass rounded-xl p-4 border border-[var(--sv-border)]/40"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[var(--sv-text)] truncate">
                      {review.menuItem?.name || 'Dish'}
                    </p>
                    <p className="text-xs text-[var(--sv-text-muted)]">
                      {review.guestName || 'Guest'}
                      {formatReviewDate(review.createdAt) ? ` · ${formatReviewDate(review.createdAt)}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StarRow rating={review.rating} size={14} />
                    {dishRating.hasReviews && (
                      <p className="text-[10px] text-[var(--sv-text-muted)] mt-0.5">
                        Dish avg {dishRating.label} ({dishRating.count})
                      </p>
                    )}
                  </div>
                </div>
                {review.comment ? (
                  <p className="text-sm text-[var(--sv-text-muted)] leading-relaxed">{review.comment}</p>
                ) : null}
              </motion.li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
