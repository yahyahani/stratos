'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center
        fg-3 hover-fg-1
        transition-colors"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" />
      <line x1="8" y1="1"    x2="8"    y2="2.5"  />
      <line x1="8" y1="13.5" x2="8"    y2="15"   />
      <line x1="1" y1="8"    x2="2.5"  y2="8"    />
      <line x1="13.5" y1="8" x2="15"   y2="8"    />
      <line x1="2.93"  y1="2.93"  x2="4.05"  y2="4.05"  />
      <line x1="11.95" y1="11.95" x2="13.07" y2="13.07" />
      <line x1="2.93"  y1="13.07" x2="4.05"  y2="11.95" />
      <line x1="11.95" y1="4.05"  x2="13.07" y2="2.93"  />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z" />
    </svg>
  );
}
