import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Moon, Plus, Search, Sun, SunMoon, X } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { StatusMerke } from '../../components/StatusMerke'
import { TypeIkon } from '../../components/TypeIkon'
import { db } from '../../db/db'
import { formaterKr, søketekst, tellerIVerdi, undertittel } from '../../lib/format'
import { erItemType, TYPE_IDER, TYPER } from '../../model/typeConfig'
import { STATUS_NAVN, STATUSER, type Item, type Status } from '../../model/types'
import { useTema } from '../../settings/theme'

const SORTERINGER = {
  endret: 'Sist endret',
  opprettet: 'Sist lagt til',
  tittel: 'Tittel A–Å',
  verdi: 'Høyest verdi',
} as const
type Sortering = keyof typeof SORTERINGER

const sammenlign = new Intl.Collator('nb').compare

function sorter(items: Item[], s: Sortering): Item[] {
  const kopi = [...items]
  switch (s) {
    case 'tittel':
      return kopi.sort((a, b) => sammenlign(a.tittel, b.tittel))
    case 'verdi':
      return kopi.sort((a, b) => (b.verdi ?? -1) - (a.verdi ?? -1))
    case 'opprettet':
      return kopi.sort((a, b) => b.opprettet.localeCompare(a.opprettet))
    default:
      return kopi.sort((a, b) => b.endret.localeCompare(a.endret))
  }
}

export function ListPage() {
  const alle = useLiveQuery(() => db.items.toArray(), [])
  const [params, setParams] = useSearchParams()
  const [tema, nesteTema] = useTema()

  const typeParam = params.get('type')
  const type = erItemType(typeParam) ? typeParam : null
  const statusParam = params.get('status')
  const status = STATUSER.includes(statusParam as Status) ? (statusParam as Status) : null
  const q = params.get('q') ?? ''
  const sortParam = params.get('sort')
  const sort: Sortering = sortParam && sortParam in SORTERINGER ? (sortParam as Sortering) : 'endret'

  const sett = (nøkkel: string, verdi: string | null) => {
    const neste = new URLSearchParams(params)
    if (verdi) neste.set(nøkkel, verdi)
    else neste.delete(nøkkel)
    setParams(neste, { replace: true })
  }

  const antallPerType = useMemo(() => {
    const m = new Map<string, number>()
    for (const i of alle ?? []) m.set(i.type, (m.get(i.type) ?? 0) + 1)
    return m
  }, [alle])

  const synlige = useMemo(() => {
    const ord = q.toLowerCase().split(/\s+/).filter(Boolean)
    const filtrert = (alle ?? []).filter((i) => {
      if (type && i.type !== type) return false
      if (status && i.status !== status) return false
      if (ord.length === 0) return true
      const tekst = søketekst(i)
      return ord.every((o) => tekst.includes(o))
    })
    return sorter(filtrert, sort)
  }, [alle, type, status, q, sort])

  const totalVerdi = synlige.reduce((sum, i) => sum + (tellerIVerdi(i) ? (i.verdi ?? 0) : 0), 0)
  const TemaIkon = tema === 'lys' ? Sun : tema === 'mørk' ? Moon : SunMoon
  const temaNavn = tema === 'lys' ? 'lyst' : tema === 'mørk' ? 'mørkt' : 'automatisk'
  const harFilter = !!(type || status || q)

  return (
    <div className="pb-28">
      <header className="flex items-end justify-between pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Samling</h1>
          <p className="mt-1 text-sm text-muted">
            {alle === undefined
              ? ' '
              : `${synlige.length} ting${
                  totalVerdi > 0 ? ` · ${formaterKr(totalVerdi)}` : ''
                }`}
          </p>
        </div>
        <button
          type="button"
          className="ikonknapp"
          onClick={nesteTema}
          aria-label={`Tema: ${temaNavn}. Trykk for å bytte.`}
          title={`Tema: ${temaNavn}`}
        >
          <TemaIkon className="size-5" />
        </button>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          className="inndata pr-11 pl-11 [&::-webkit-search-cancel-button]:hidden"
          placeholder="Søk i samlingen"
          aria-label="Søk i samlingen"
          value={q}
          onChange={(e) => sett('q', e.target.value)}
        />
        {q && (
          <button
            type="button"
            className="ikonknapp absolute top-1/2 right-0.5 -translate-y-1/2"
            aria-label="Tøm søk"
            onClick={() => sett('q', null)}
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav
        aria-label="Type"
        className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Brikke aktiv={!type} onClick={() => sett('type', null)}>
          Alle <Antall n={alle?.length ?? 0} />
        </Brikke>
        {TYPE_IDER.map((t) => (
          <Brikke key={t} aktiv={type === t} onClick={() => sett('type', type === t ? null : t)}>
            <TypeIkon type={t} className="size-4" />
            {TYPER[t].flertall} <Antall n={antallPerType.get(t) ?? 0} />
          </Brikke>
        ))}
      </nav>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <select
          className="inndata py-2.5 text-sm"
          aria-label="Status"
          value={status ?? ''}
          onChange={(e) => sett('status', e.target.value || null)}
        >
          <option value="">Alle statuser</option>
          {STATUSER.map((s) => (
            <option key={s} value={s}>
              {STATUS_NAVN[s]}
            </option>
          ))}
        </select>
        <select
          className="inndata py-2.5 text-sm"
          aria-label="Sortering"
          value={sort}
          onChange={(e) => sett('sort', e.target.value === 'endret' ? null : e.target.value)}
        >
          {Object.entries(SORTERINGER).map(([k, navn]) => (
            <option key={k} value={k}>
              {navn}
            </option>
          ))}
        </select>
      </div>

      <main className="mt-4">
        {alle === undefined ? null : synlige.length === 0 ? (
          <Tom harFilter={harFilter} harTing={alle.length > 0} nullstill={() => setParams({}, { replace: true })} />
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-line bg-panel">
            {synlige.map((i) => (
              <li key={i.id} className="border-b border-line last:border-b-0">
                <Link
                  to={`/ting/${i.id}`}
                  className="flex items-center gap-3 px-3 py-3 transition hover:bg-line/30 active:bg-line/50"
                >
                  <span className="flex h-14 w-11 shrink-0 items-center justify-center rounded-md bg-line/60 text-muted">
                    <TypeIkon type={i.type} className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{i.tittel}</span>
                    <span className="block truncate text-sm text-muted">
                      {undertittel(i) || TYPER[i.type].navn}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {i.status !== 'eid' && <StatusMerke status={i.status} />}
                    {i.verdi !== undefined && (
                      <span className="text-sm text-muted tabular-nums">{formaterKr(i.verdi)}</span>
                    )}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted/60" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Link
        to={type ? `/ny?type=${type}` : '/ny'}
        className="knapp knapp-primær fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20 h-14 rounded-full pr-6 pl-5 shadow-lg shadow-black/20"
      >
        <Plus className="size-5" />
        Legg til
      </Link>
    </div>
  )
}

function Brikke({
  aktiv,
  onClick,
  children,
}: {
  aktiv: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={aktiv}
      onClick={onClick}
      className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition active:scale-95 ${
        aktiv ? 'border-ink bg-ink text-bg' : 'border-line bg-panel text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function Antall({ n }: { n: number }) {
  return <span className="tabular-nums opacity-60">{n}</span>
}

function Tom({
  harFilter,
  harTing,
  nullstill,
}: {
  harFilter: boolean
  harTing: boolean
  nullstill: () => void
}) {
  if (harTing && harFilter) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
        <p className="text-muted">Ingen treff.</p>
        <button type="button" className="knapp knapp-sekundær mt-4" onClick={nullstill}>
          Nullstill filter
        </button>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <p className="font-serif text-xl">Samlingen er tom</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
        Trykk «Legg til» for å registrere den første boka, plata, filmen eller gitaren.
      </p>
    </div>
  )
}
