import { useDispatch, useSelector } from 'react-redux'
import { setAccent } from '../../store/slices/uiSlice'
import { applyAccent } from '../../utils/themeInit'

const LABELS = { orange: 'Orange', blue: 'Blue', green: 'Green' }
const ACCENT_CYCLE = ['orange', 'blue', 'green']

export default function ThemeToggle({ className = '' }) {
  const dispatch = useDispatch()
  const accent = useSelector((s) => s.ui?.accent) || 'orange'

  const cycle = (e) => {
    e.stopPropagation()
    const idx = ACCENT_CYCLE.indexOf(accent)
    const next = ACCENT_CYCLE[(idx + 1) % ACCENT_CYCLE.length]
    applyAccent(next)
    dispatch(setAccent(next))
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className={`df-theme-key relative z-20 pointer-events-auto shrink-0 ${className}`}
      title={`Theme: ${LABELS[accent] || accent} — click to change`}
      aria-label={`Change color theme, current ${LABELS[accent] || accent}`}
    >
      <span className="df-theme-key-dot" />
    </button>
  )
}
