import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StatusMerke } from '../../components/StatusMerke'
import { Topp } from '../../components/Topp'
import { TypeIkon } from '../../components/TypeIkon'
import { db, slettItem } from '../../db/db'
import { formaterDato, formaterKr, undertittel } from '../../lib/format'
import { typeDef } from '../../model/typeConfig'

export function DetailPage() {
  const { id = '' } = useParams()
  const naviger = useNavigate()
  // null = finnes ikke, undefined = laster
  const item = useLiveQuery(async () => (await db.items.get(id)) ?? null, [id])
  const [bekreftSlett, setBekreftSlett] = useState(false)
  const [feil, setFeil] = useState('')

  if (item === undefined) return null
  if (item === null) {
    return (
      <>
        <Topp tilbake="/" />
        <p className="py-16 text-center text-muted">Fant ikke dette objektet.</p>
      </>
    )
  }

  const def = typeDef(item.type)
  const rader: [string, string][] = []
  for (const f of def.felt) {
    const v = item.felt[f.nøkkel]
    if (v === undefined || v === '' || v === false) continue
    rader.push([f.navn, v === true ? 'Ja' : String(v)])
  }
  for (const f of item.egneFelt) rader.push([f.navn, f.verdi])

  const generelt: [string, string][] = []
  if (item.plassering) generelt.push(['Plassering', item.plassering])
  if (item.utlån?.til)
    generelt.push([
      'Utlånt til',
      item.utlån.dato ? `${item.utlån.til} (${formaterDato(item.utlån.dato)})` : item.utlån.til,
    ])
  if (item.verdi !== undefined) generelt.push(['Estimert verdi', formaterKr(item.verdi)])
  if (item.kjøpspris !== undefined) generelt.push(['Kjøpspris', formaterKr(item.kjøpspris)])
  if (item.kjøpsdato) generelt.push(['Kjøpt', formaterDato(item.kjøpsdato)])

  const slett = async () => {
    try {
      await slettItem(item.id)
      naviger('/', { replace: true })
    } catch (e) {
      setFeil(`Klarte ikke å slette: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div className="pb-16">
      <Topp tilbake="/">
        <Link to={`/ting/${item.id}/rediger`} className="ikonknapp" aria-label="Rediger">
          <Pencil className="size-5" />
        </Link>
        <button
          type="button"
          className="ikonknapp"
          aria-label="Slett"
          onClick={() => setBekreftSlett(true)}
        >
          <Trash2 className="size-5" />
        </button>
      </Topp>

      <div className="mt-2 flex gap-4">
        <span className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-line/60 text-muted">
          <TypeIkon type={item.type} className="size-8" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wider text-muted uppercase">{def.navn}</p>
          <h2 className="mt-1 font-serif text-2xl leading-tight break-words">{item.tittel}</h2>
          {undertittel(item) && <p className="mt-1 text-muted">{undertittel(item)}</p>}
          <div className="mt-2">
            <StatusMerke status={item.status} />
          </div>
        </div>
      </div>

      {item.tagger.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {item.tagger.map((t) => (
            <li key={t}>
              <Link
                to={`/?q=${encodeURIComponent(t)}`}
                className="inline-block rounded-full border border-line bg-panel px-3 py-1 text-sm"
              >
                {t}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Tabell tittel="Generelt" rader={generelt} />
      <Tabell tittel="Detaljer" rader={rader} />

      {item.notater && (
        <section className="mt-6">
          <h3 className="mb-2 text-xs font-medium tracking-wider text-muted uppercase">Notater</h3>
          <p className="rounded-2xl border border-line bg-panel p-4 leading-relaxed whitespace-pre-wrap">
            {item.notater}
          </p>
        </section>
      )}

      <p className="mt-8 text-xs text-muted">
        Lagt til {formaterDato(item.opprettet)}
        {item.endret !== item.opprettet && ` · endret ${formaterDato(item.endret)}`}
      </p>

      {bekreftSlett && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="slett-tittel"
          onClick={() => setBekreftSlett(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-panel p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="slett-tittel" className="font-serif text-xl">
              Slette «{item.tittel}»?
            </h3>
            <p className="mt-2 text-sm text-muted">Dette kan ikke angres.</p>
            {feil && <p className="mt-3 text-sm text-red-600">{feil}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="knapp knapp-sekundær"
                onClick={() => setBekreftSlett(false)}
              >
                Avbryt
              </button>
              <button type="button" className="knapp knapp-fare" onClick={slett}>
                Slett
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Tabell({ tittel, rader }: { tittel: string; rader: [string, string][] }) {
  if (rader.length === 0) return null
  return (
    <section className="mt-6">
      <h3 className="mb-2 text-xs font-medium tracking-wider text-muted uppercase">{tittel}</h3>
      <dl className="overflow-hidden rounded-2xl border border-line bg-panel">
        {rader.map(([navn, verdi], i) => (
          <div key={i} className="flex gap-4 border-b border-line px-4 py-3 last:border-b-0">
            <dt className="w-2/5 shrink-0 text-muted">{navn}</dt>
            <dd className="min-w-0 flex-1 break-words">{verdi}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
