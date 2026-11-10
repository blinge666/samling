import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

/** Toppfelt for undersider: tilbake-knapp, tittel og valgfrie handlinger til høyre. */
export function Topp({
  tittel,
  tilbake,
  children,
}: {
  tittel?: string
  tilbake: string
  children?: ReactNode
}) {
  const naviger = useNavigate()
  return (
    <header className="sticky top-0 z-10 -mx-4 flex items-center gap-1 bg-bg/90 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur">
      <button
        type="button"
        className="ikonknapp"
        aria-label="Tilbake"
        onClick={() => {
          // Gå tilbake i historikken når vi kom innenfra appen, ellers til en trygg side
          if (window.history.state?.idx > 0) naviger(-1)
          else naviger(tilbake, { replace: true })
        }}
      >
        <ArrowLeft className="size-5" />
      </button>
      <h1 className="min-w-0 flex-1 truncate font-serif text-lg">{tittel}</h1>
      {children}
    </header>
  )
}
