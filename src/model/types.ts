import type { ItemType } from './typeConfig'

export type { ItemType }

export const STATUSER = ['eid', 'ønsket', 'utlånt', 'solgt'] as const
export type Status = (typeof STATUSER)[number]

export const STATUS_NAVN: Record<Status, string> = {
  eid: 'Eid',
  ønsket: 'Ønsket',
  utlånt: 'Utlånt',
  solgt: 'Solgt / borte',
}

export type FeltVerdi = string | number | boolean

export interface EgetFelt {
  navn: string
  verdi: string
}

export interface Item {
  id: string
  type: ItemType
  tittel: string
  status: Status
  utlån?: { til: string; dato: string }
  plassering?: string
  /** ISO-dato, ÅÅÅÅ-MM-DD */
  kjøpsdato?: string
  /** NOK */
  kjøpspris?: number
  /** Estimert verdi i NOK */
  verdi?: number
  tagger: string[]
  notater?: string
  /** Typespesifikke felt, se typeConfig.ts */
  felt: Record<string, FeltVerdi>
  egneFelt: EgetFelt[]
  /** Bildene ligger i egen tabell (fase 2) */
  bildeIder: string[]
  opprettet: string
  endret: string
}

export interface Bilde {
  id: string
  itemId: string
  blob: Blob
}

export interface Vedlikehold {
  id: string
  itemId: string
  dato: string
  hva: string
  hvem?: string
  kostnad?: number
}

/** Det skjemaet leverer – resten (id, tidsstempler) fylles ut ved lagring. */
export type ItemData = Omit<Item, 'id' | 'opprettet' | 'endret' | 'bildeIder'>
