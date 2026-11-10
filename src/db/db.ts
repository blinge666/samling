import Dexie, { type EntityTable } from 'dexie'
import type { Bilde, Item, ItemData, Vedlikehold } from '../model/types'

export const db = new Dexie('samling') as Dexie & {
  items: EntityTable<Item, 'id'>
  bilder: EntityTable<Bilde, 'id'>
  vedlikehold: EntityTable<Vedlikehold, 'id'>
}

db.version(1).stores({
  items: 'id, type, status, tittel, endret, *tagger',
  bilder: 'id, itemId',
  vedlikehold: 'id, itemId, dato',
})

const nå = () => new Date().toISOString()

export async function opprettItem(data: ItemData): Promise<string> {
  const id = crypto.randomUUID()
  const t = nå()
  await db.items.add({ ...data, id, bildeIder: [], opprettet: t, endret: t })
  return id
}

export async function oppdaterItem(id: string, data: ItemData): Promise<void> {
  const gammel = await db.items.get(id)
  if (!gammel) throw new Error('Fant ikke objektet')
  // put (ikke update) slik at felt som er tømt i skjemaet faktisk forsvinner
  await db.items.put({
    ...data,
    id,
    bildeIder: gammel.bildeIder,
    opprettet: gammel.opprettet,
    endret: nå(),
  })
}

export async function slettItem(id: string): Promise<void> {
  await db.transaction('rw', db.items, db.bilder, db.vedlikehold, async () => {
    await db.bilder.where('itemId').equals(id).delete()
    await db.vedlikehold.where('itemId').equals(id).delete()
    await db.items.delete(id)
  })
}
