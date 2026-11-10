import { typeDef } from '../model/typeConfig'
import type { Item } from '../model/types'

const kr = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  maximumFractionDigits: 0,
})

export function formaterKr(n: number | undefined): string {
  return n === undefined ? '' : kr.format(n)
}

export function formaterDato(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Tolker "12 500", "12500,50" osv. Tom streng eller ugyldig tall gir undefined. */
export function tolkTall(s: string): number | undefined {
  const renset = s.replace(/\s/g, '').replace(',', '.')
  if (renset === '') return undefined
  const n = Number(renset)
  return Number.isFinite(n) ? n : undefined
}

export function undertittel(item: Item): string {
  return typeDef(item.type)
    .undertittel.map((k) => item.felt[k])
    .filter((v) => v !== undefined && v !== '')
    .join(' · ')
}

/** Verdien teller med i totalsummen bare for ting som faktisk er i samlingen. */
export function tellerIVerdi(item: Item): boolean {
  return item.status === 'eid' || item.status === 'utlånt'
}

export function søketekst(item: Item): string {
  return [
    item.tittel,
    item.plassering,
    item.notater,
    item.utlån?.til,
    ...item.tagger,
    ...Object.values(item.felt).filter((v) => typeof v !== 'boolean'),
    ...item.egneFelt.flatMap((f) => [f.navn, f.verdi]),
  ]
    .filter((v) => v !== undefined)
    .join(' ')
    .toLowerCase()
}
