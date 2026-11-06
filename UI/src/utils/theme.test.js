import { applyTheme, currentTheme, getInitialTheme } from './theme';

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  });

  it('defaults to dark when nothing is saved and the device prefers dark', () => {
    expect(getInitialTheme()).toBe('dark');
  });

  it('follows a light device setting', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    expect(getInitialTheme()).toBe('light');
  });

  it('remembers the chosen theme', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(currentTheme()).toBe('light');
    expect(getInitialTheme()).toBe('light');
  });

  it('ignores invalid saved values', () => {
    localStorage.setItem('theme', 'purple');
    expect(getInitialTheme()).toBe('dark');
  });
});
