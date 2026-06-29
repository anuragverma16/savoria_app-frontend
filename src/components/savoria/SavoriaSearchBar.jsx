import { useEffect, useRef, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import gsap from 'gsap'

export default function SavoriaSearchBar({ value, onChange, placeholder = 'Search dishes…' }) {
  const wrapRef = useRef(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!wrapRef.current) return
    gsap.to(wrapRef.current, {
      scale: focused ? 1.02 : 1,
      duration: 0.35,
      ease: 'power2.out',
    })
  }, [focused])

  return (
    <div ref={wrapRef} className="sv-search-wrap">
      <div className={`sv-glass flex items-center gap-3 px-4 py-3 rounded-2xl transition-shadow ${focused ? 'ring-2 ring-[var(--sv-accent-glow)]' : ''}`}>
        <FiSearch className="text-[var(--sv-text-muted)] flex-shrink-0" size={20} />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[var(--sv-text)] placeholder:text-[var(--sv-text-muted)] text-sm"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[var(--sv-text-muted)] hover:text-[var(--sv-text)]"
            aria-label="Clear search"
          >
            <FiX size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
