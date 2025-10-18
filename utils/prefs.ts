// utils/prefs.ts
export type ThemePref = 'system' | 'light' | 'dark'
export type DensityPref = 'comfortable' | 'compact'

export function setTheme(pref: ThemePref) {
  try {
    localStorage.setItem('al:theme', pref)
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const useDark = pref === 'dark' || (pref === 'system' && systemDark)
    document.documentElement.classList.toggle('dark', useDark)
  } catch {}
}

export function getTheme(): ThemePref {
  try { return (localStorage.getItem('al:theme') as ThemePref) || 'system' } catch { return 'system' }
}

export function setDensity(pref: DensityPref) {
  try {
    localStorage.setItem('al:density', pref)
    document.documentElement.classList.toggle('compact', pref === 'compact')
  } catch {}
}

export function getDensity(): DensityPref {
  try { return (localStorage.getItem('al:density') as DensityPref) || 'comfortable' } catch { return 'comfortable' }
}
