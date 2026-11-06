import React from 'react';
import { useTheme } from '../../utils/theme';
import { MoonIcon, SunIcon } from '../common/Icons';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggle } = useTheme();
  const toLight = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={toLight ? 'Switch to light theme' : 'Switch to dark theme'}
      title={toLight ? 'Light theme' : 'Dark theme'}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-line bg-raised text-fg transition hover:bg-fg/10 ${className}`}
    >
      {toLight ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
};

export default ThemeToggle;
