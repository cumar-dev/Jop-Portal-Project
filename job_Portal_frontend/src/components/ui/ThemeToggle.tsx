import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

interface ThemeToggleProps {
  className?: string
  /** Compact icon-only for headers */
  compact?: boolean
}

export function ThemeToggle({ className = '', compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-ink transition hover:bg-subtle ${className}`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-ink transition hover:bg-subtle ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4" />
          Light
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          Dark
        </>
      )}
    </button>
  )
}
