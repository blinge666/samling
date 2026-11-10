import { useEffect, useState } from 'react'

export type Tema = 'auto' | 'lys' | 'mørk'
const NØKKEL = 'samling.tema'

function les(): Tema {
  try {
    const v = localStorage.getItem(NØKKEL)
    if (v === 'lys' || v === 'mørk') return v
  } catch {
    // localStorage kan være utilgjengelig (privat modus) – bruk auto
  }
  return 'auto'
}

function bruk(tema: Tema) {
  const mørk =
    tema === 'mørk' ||
    (tema === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', mørk)
}

export function useTema(): [Tema, () => void] {
  const [tema, setTema] = useState<Tema>(les)

  useEffect(() => {
    bruk(tema)
    try {
      if (tema === 'auto') localStorage.removeItem(NØKKEL)
      else localStorage.setItem(NØKKEL, tema)
    } catch {
      // ignorer
    }
    if (tema !== 'auto') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const lytter = () => bruk('auto')
    mq.addEventListener('change', lytter)
    return () => mq.removeEventListener('change', lytter)
  }, [tema])

  const neste = () => setTema((t) => (t === 'auto' ? 'lys' : t === 'lys' ? 'mørk' : 'auto'))
  return [tema, neste]
}
