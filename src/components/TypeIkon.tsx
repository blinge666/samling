import { Book, Disc3, Film, Guitar, Package, type LucideIcon } from 'lucide-react'
import type { ItemType } from '../model/typeConfig'

const IKONER: Record<ItemType, LucideIcon> = {
  bok: Book,
  plate: Disc3,
  film: Film,
  instrument: Guitar,
  annet: Package,
}

export function TypeIkon({ type, className }: { type: ItemType; className?: string }) {
  const Ikon = IKONER[type] ?? Package
  return <Ikon className={className} aria-hidden strokeWidth={1.6} />
}
