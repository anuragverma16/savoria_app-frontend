import { FiMoon, FiSun } from 'react-icons/fi'
import { useSavoriaGuest } from '../../contexts/SavoriaGuestContext'

export default function SavoriaThemeToggle() {
  const { theme, toggleTheme } = useSavoriaGuest()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="sv-glass w-10 h-10 rounded-full flex items-center justify-center text-[var(--sv-text)] hover:scale-105 transition-transform"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} className="text-[var(--sv-accent)]" />}
    </button>
  )
}
