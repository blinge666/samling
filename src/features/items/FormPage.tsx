import { Plus, X } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Topp } from '../../components/Topp'
import { TypeIkon } from '../../components/TypeIkon'
import { db, oppdaterItem, opprettItem } from '../../db/db'
import { tolkTall } from '../../lib/format'
import { erItemType, TYPE_IDER, TYPER, typeDef, type ItemType } from '../../model/typeConfig'
import {
  STATUS_NAVN,
  STATUSER,
  type EgetFelt,
  type FeltVerdi,
  type Item,
  type ItemData,
  type Status,
} from '../../model/types'

/** Skjemaets arbeidskopi: alt er tekst (eller avkryss) til det lagres. */
interface Utkast {
  type: ItemType
  tittel: string
  status: Status
  utlånTil: string
  utlånDato: string
  plassering: string
  kjøpsdato: string
  kjøpspris: string
  verdi: string
  tagger: string
  notater: string
  felt: Record<string, string | boolean>
  egneFelt: EgetFelt[]
}

function tomtUtkast(type: ItemType): Utkast {
  return {
    type,
    tittel: '',
    status: 'eid',
    utlånTil: '',
    utlånDato: '',
    plassering: '',
    kjøpsdato: '',
    kjøpspris: '',
    verdi: '',
    tagger: '',
    notater: '',
    felt: {},
    egneFelt: [],
  }
}

function fraItem(item: Item): Utkast {
  const felt: Record<string, string | boolean> = {}
  for (const [k, v] of Object.entries(item.felt)) felt[k] = typeof v === 'boolean' ? v : String(v)
  return {
    type: item.type,
    tittel: item.tittel,
    status: item.status,
    utlånTil: item.utlån?.til ?? '',
    utlånDato: item.utlån?.dato ?? '',
    plassering: item.plassering ?? '',
    kjøpsdato: item.kjøpsdato ?? '',
    kjøpspris: item.kjøpspris?.toString() ?? '',
    verdi: item.verdi?.toString() ?? '',
    tagger: item.tagger.join(', '),
    notater: item.notater ?? '',
    felt,
    egneFelt: item.egneFelt.map((f) => ({ ...f })),
  }
}

/** Gjør utkastet om til lagringsformat. Returnerer feilmelding hvis noe er ugyldig. */
function tilData(u: Utkast): ItemData | string {
  const tittel = u.tittel.trim()
  if (!tittel) return `${typeDef(u.type).tittelNavn} må fylles ut.`

  const tall = (s: string, navn: string): number | undefined | string => {
    if (s.trim() === '') return undefined
    const n = tolkTall(s)
    return n === undefined ? `«${s}» er ikke et gyldig tall (${navn}).` : n
  }

  const kjøpspris = tall(u.kjøpspris, 'Kjøpspris')
  if (typeof kjøpspris === 'string') return kjøpspris
  const verdi = tall(u.verdi, 'Estimert verdi')
  if (typeof verdi === 'string') return verdi

  // Bare felt som hører til valgt type lagres
  const felt: Record<string, FeltVerdi> = {}
  for (const f of typeDef(u.type).felt) {
    const v = u.felt[f.nøkkel]
    if (f.type === 'avkryss') {
      if (v === true) felt[f.nøkkel] = true
    } else if (typeof v === 'string' && v.trim() !== '') {
      if (f.type === 'tall') {
        const n = tall(v, f.navn)
        if (typeof n === 'string') return n
        if (n !== undefined) felt[f.nøkkel] = n
      } else {
        felt[f.nøkkel] = v.trim()
      }
    }
  }

  // Fjern duplikater uavhengig av store/små bokstaver ("Historie" = "historie")
  const sett = new Set<string>()
  const tagger = u.tagger
    .split(',')
    .map((t) => t.trim())
    .filter((t) => {
      const k = t.toLowerCase()
      if (!t || sett.has(k)) return false
      sett.add(k)
      return true
    })
  const egneFelt = u.egneFelt
    .map((f) => ({ navn: f.navn.trim(), verdi: f.verdi.trim() }))
    .filter((f) => f.navn && f.verdi)

  return {
    type: u.type,
    tittel,
    status: u.status,
    utlån:
      u.status === 'utlånt' && u.utlånTil.trim()
        ? { til: u.utlånTil.trim(), dato: u.utlånDato }
        : undefined,
    plassering: u.plassering.trim() || undefined,
    kjøpsdato: u.kjøpsdato || undefined,
    kjøpspris,
    verdi,
    tagger,
    notater: u.notater.trim() || undefined,
    felt,
    egneFelt,
  }
}

export function FormPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const [start, setStart] = useState<Utkast | null | undefined>(() => {
    if (id) return undefined // lastes under
    const t = params.get('type')
    return tomtUtkast(erItemType(t) ? t : 'bok')
  })

  useEffect(() => {
    if (!id) return
    let avbrutt = false
    db.items.get(id).then((item) => {
      if (!avbrutt) setStart(item ? fraItem(item) : null)
    })
    return () => {
      avbrutt = true
    }
  }, [id])

  if (start === undefined) return null
  if (start === null) {
    return (
      <>
        <Topp tilbake="/" />
        <p className="py-16 text-center text-muted">Fant ikke dette objektet.</p>
      </>
    )
  }
  return <Skjema id={id} start={start} />
}

function Skjema({ id, start }: { id?: string; start: Utkast }) {
  const naviger = useNavigate()
  const [u, setU] = useState(start)
  const [feil, setFeil] = useState('')
  const [lagrer, setLagrer] = useState(false)
  const def = typeDef(u.type)

  const sett = <K extends keyof Utkast>(k: K, v: Utkast[K]) => setU((p) => ({ ...p, [k]: v }))
  const settFelt = (k: string, v: string | boolean) =>
    setU((p) => ({ ...p, felt: { ...p.felt, [k]: v } }))
  const settEget = (i: number, del: Partial<EgetFelt>) =>
    setU((p) => ({
      ...p,
      egneFelt: p.egneFelt.map((f, j) => (j === i ? { ...f, ...del } : f)),
    }))

  const lagre = async (e: FormEvent) => {
    e.preventDefault()
    const data = tilData(u)
    if (typeof data === 'string') {
      setFeil(data)
      return
    }
    setFeil('')
    setLagrer(true)
    try {
      if (id) {
        await oppdaterItem(id, data)
        // Gå tilbake til detaljsiden vi kom fra, så den ikke havner to ganger i historikken
        if (window.history.state?.idx > 0) naviger(-1)
        else naviger(`/ting/${id}`, { replace: true })
      } else {
        const nyId = await opprettItem(data)
        naviger(`/ting/${nyId}`, { replace: true })
      }
    } catch (err) {
      setFeil(`Klarte ikke å lagre: ${err instanceof Error ? err.message : String(err)}`)
      setLagrer(false)
    }
  }

  return (
    <form onSubmit={lagre} className="pb-32" noValidate>
      <Topp tittel={id ? 'Rediger' : 'Legg til'} tilbake={id ? `/ting/${id}` : '/'} />

      <div className="mt-2 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Type">
        {TYPE_IDER.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={u.type === t}
            onClick={() => sett('type', t)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-1 text-xs font-medium transition active:scale-95 ${
              u.type === t ? 'border-ink bg-ink text-bg' : 'border-line bg-panel text-ink'
            }`}
          >
            <TypeIkon type={t} className="size-5" />
            <span className="max-w-full truncate">{TYPER[t].navn}</span>
          </button>
        ))}
      </div>

      <Gruppe>
        <Felt navn={def.tittelNavn}>
          {(fid) => (
            <input
              id={fid}
              className="inndata"
              value={u.tittel}
              onChange={(e) => sett('tittel', e.target.value)}
              autoFocus={!id}
              autoComplete="off"
            />
          )}
        </Felt>

        {def.felt.map((f) =>
          f.type === 'avkryss' ? (
            <label
              key={f.nøkkel}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-panel px-3.5"
            >
              <input
                type="checkbox"
                className="size-5 accent-(--accent)"
                checked={u.felt[f.nøkkel] === true}
                onChange={(e) => settFelt(f.nøkkel, e.target.checked)}
              />
              {f.navn}
            </label>
          ) : (
            <Felt key={f.nøkkel} navn={f.navn}>
              {(fid) =>
                f.type === 'valg' ? (
                  <select
                    id={fid}
                    className="inndata"
                    value={(u.felt[f.nøkkel] as string) ?? ''}
                    onChange={(e) => settFelt(f.nøkkel, e.target.value)}
                  >
                    <option value="">–</option>
                    {/* Behold en lagret verdi selv om den ikke lenger er i lista */}
                    {[...new Set([...(f.valg ?? []), (u.felt[f.nøkkel] as string) || ''])]
                      .filter(Boolean)
                      .map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    id={fid}
                    className="inndata"
                    inputMode={f.type === 'tall' ? 'decimal' : undefined}
                    placeholder={f.hint}
                    value={(u.felt[f.nøkkel] as string) ?? ''}
                    onChange={(e) => settFelt(f.nøkkel, e.target.value)}
                    autoComplete="off"
                  />
                )
              }
            </Felt>
          ),
        )}
      </Gruppe>

      <Gruppe tittel="Status og plassering">
        <Felt navn="Status">
          {(fid) => (
            <select
              id={fid}
              className="inndata"
              value={u.status}
              onChange={(e) => sett('status', e.target.value as Status)}
            >
              {STATUSER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_NAVN[s]}
                </option>
              ))}
            </select>
          )}
        </Felt>
        {u.status === 'utlånt' && (
          <div className="grid grid-cols-2 gap-3">
            <Felt navn="Utlånt til">
              {(fid) => (
                <input
                  id={fid}
                  className="inndata"
                  value={u.utlånTil}
                  onChange={(e) => sett('utlånTil', e.target.value)}
                />
              )}
            </Felt>
            <Felt navn="Dato">
              {(fid) => (
                <input
                  id={fid}
                  type="date"
                  className="inndata"
                  value={u.utlånDato}
                  onChange={(e) => sett('utlånDato', e.target.value)}
                />
              )}
            </Felt>
          </div>
        )}
        <Felt navn="Plassering">
          {(fid) => (
            <input
              id={fid}
              className="inndata"
              placeholder="f.eks. Stue, hylle 3"
              value={u.plassering}
              onChange={(e) => sett('plassering', e.target.value)}
            />
          )}
        </Felt>
      </Gruppe>

      <Gruppe tittel="Kjøp og verdi">
        <div className="grid grid-cols-2 gap-3">
          <Felt navn="Estimert verdi (kr)">
            {(fid) => (
              <input
                id={fid}
                className="inndata"
                inputMode="decimal"
                value={u.verdi}
                onChange={(e) => sett('verdi', e.target.value)}
              />
            )}
          </Felt>
          <Felt navn="Kjøpspris (kr)">
            {(fid) => (
              <input
                id={fid}
                className="inndata"
                inputMode="decimal"
                value={u.kjøpspris}
                onChange={(e) => sett('kjøpspris', e.target.value)}
              />
            )}
          </Felt>
        </div>
        <Felt navn="Kjøpsdato">
          {(fid) => (
            <input
              id={fid}
              type="date"
              className="inndata"
              value={u.kjøpsdato}
              onChange={(e) => sett('kjøpsdato', e.target.value)}
            />
          )}
        </Felt>
      </Gruppe>

      <Gruppe tittel="Tagger og notater">
        <Felt navn="Tagger" hint="Skill med komma">
          {(fid) => (
            <input
              id={fid}
              className="inndata"
              placeholder="f.eks. førsteutgave, gave"
              value={u.tagger}
              onChange={(e) => sett('tagger', e.target.value)}
              autoCapitalize="none"
            />
          )}
        </Felt>
        <Felt navn="Notater">
          {(fid) => (
            <textarea
              id={fid}
              className="inndata min-h-28"
              value={u.notater}
              onChange={(e) => sett('notater', e.target.value)}
            />
          )}
        </Felt>
      </Gruppe>

      <Gruppe tittel="Egne felt">
        {u.egneFelt.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="inndata w-2/5"
              placeholder="Navn"
              aria-label={`Eget felt ${i + 1}, navn`}
              value={f.navn}
              onChange={(e) => settEget(i, { navn: e.target.value })}
            />
            <input
              className="inndata flex-1"
              placeholder="Verdi"
              aria-label={`Eget felt ${i + 1}, verdi`}
              value={f.verdi}
              onChange={(e) => settEget(i, { verdi: e.target.value })}
            />
            <button
              type="button"
              className="ikonknapp shrink-0"
              aria-label="Fjern felt"
              onClick={() => sett('egneFelt', u.egneFelt.filter((_, j) => j !== i))}
            >
              <X className="size-5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="knapp knapp-sekundær w-full"
          onClick={() => sett('egneFelt', [...u.egneFelt, { navn: '', verdi: '' }])}
        >
          <Plus className="size-5" />
          Legg til felt
        </button>
      </Gruppe>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {feil && (
            <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">
              {feil}
            </p>
          )}
          <button type="submit" className="knapp knapp-primær w-full" disabled={lagrer}>
            {lagrer ? 'Lagrer …' : 'Lagre'}
          </button>
        </div>
      </div>
    </form>
  )
}

function Gruppe({ tittel, children }: { tittel?: string; children: ReactNode }) {
  return (
    <fieldset className="mt-6 space-y-3">
      {tittel && (
        <legend className="mb-2 text-xs font-medium tracking-wider text-muted uppercase">
          {tittel}
        </legend>
      )}
      {children}
    </fieldset>
  )
}

let teller = 0

function Felt({
  navn,
  hint,
  children,
}: {
  navn: string
  hint?: string
  children: (id: string) => ReactNode
}) {
  const [id] = useState(() => `felt-${++teller}`)
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 flex items-baseline justify-between text-sm font-medium">
        {navn}
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </label>
      {children(id)}
    </div>
  )
}
