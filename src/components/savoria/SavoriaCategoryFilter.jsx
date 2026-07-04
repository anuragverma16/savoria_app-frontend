import { useRef, useEffect } from 'react'

export default function SavoriaCategoryFilter({ active, onChange, categories = [] }) {
  const scrollRef = useRef(null)
  const activeRef = useRef(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  const pills = [{ id: 'all', name: 'All', icon: '✨' }, ...categories]

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {pills.map((cat) => (
        <button
          key={cat.id}
          ref={active === cat.id ? activeRef : null}
          type="button"
          onClick={() => onChange(cat.id)}
          className={`sv-category-pill ${active === cat.id ? 'active' : ''}`}
        >
          <span className="mr-1">{cat.icon}</span>
          {cat.name}
        </button>
      ))}
    </div>
  )
}
