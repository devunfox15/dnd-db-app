import * as React from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

type ThemeProviderState = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const THEME_STORAGE_KEY = 'theme'
const COLOR_SCHEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

const ThemeProviderContext = React.createContext<ThemeProviderState | null>(null)

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(COLOR_SCHEME_MEDIA_QUERY).matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme()
  }

  return theme
}

function applyThemeClass(resolvedTheme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isTheme(storedTheme) ? storedTheme : 'system'
}

function getInitialResolvedTheme(initialTheme: Theme): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return resolveTheme(initialTheme)
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>(() => getInitialTheme())
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(() =>
    getInitialResolvedTheme(getInitialTheme())
  )

  React.useEffect(() => {
    const nextResolvedTheme = resolveTheme(theme)
    applyThemeClass(nextResolvedTheme)
    setResolvedTheme(nextResolvedTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  React.useEffect(() => {
    if (theme !== 'system') {
      return
    }

    const mediaQueryList = window.matchMedia(COLOR_SCHEME_MEDIA_QUERY)
    const handleColorSchemeChange = () => {
      const nextResolvedTheme = mediaQueryList.matches ? 'dark' : 'light'
      applyThemeClass(nextResolvedTheme)
      setResolvedTheme(nextResolvedTheme)
    }

    mediaQueryList.addEventListener('change', handleColorSchemeChange)
    return () => {
      mediaQueryList.removeEventListener('change', handleColorSchemeChange)
    }
  }, [theme])

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme]
  )

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

function useTheme() {
  const context = React.useContext(ThemeProviderContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

const themeInitScript = `
(function () {
  try {
    var storageKey = '${THEME_STORAGE_KEY}';
    var storedTheme = window.localStorage.getItem(storageKey);
    var theme =
      storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
        ? storedTheme
        : 'system';
    var resolvedTheme =
      theme === 'system'
        ? window.matchMedia('${COLOR_SCHEME_MEDIA_QUERY}').matches
          ? 'dark'
          : 'light'
        : theme;

    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  } catch (_) {}
})();
`

export { ThemeProvider, themeInitScript, useTheme }
export type { Theme, ResolvedTheme }
