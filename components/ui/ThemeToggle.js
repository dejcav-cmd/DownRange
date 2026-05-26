'use client'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '5px 12px 5px 8px',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Track */}
      <div style={{
        width: '32px',
        height: '18px',
        borderRadius: '9px',
        background: isDark ? '#1F2428' : '#C8922A',
        position: 'relative',
        transition: 'background 0.25s ease',
        flexShrink: 0,
      }}>
        {/* Knob */}
        <div style={{
          position: 'absolute',
          top: '3px',
          left: isDark ? '3px' : '17px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: isDark ? '#6B7280' : '#fff',
          transition: 'left 0.25s ease, background 0.25s ease',
        }} />
      </div>
      {/* Icon + label */}
      <span style={{
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: '10px',
        letterSpacing: '0.08em',
        color: 'var(--text-dim)',
        userSelect: 'none',
      }}>
        {isDark ? '☽ DARK' : '☀ LIGHT'}
      </span>
    </button>
  )
}
