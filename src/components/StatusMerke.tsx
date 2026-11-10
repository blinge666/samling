import { STATUS_NAVN, type Status } from '../model/types'

const FARGER: Record<Status, string> = {
  eid: 'bg-emerald-600/12 text-emerald-800 dark:text-emerald-300',
  ønsket: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  utlånt: 'bg-sky-600/12 text-sky-800 dark:text-sky-300',
  solgt: 'bg-line text-muted',
}

export function StatusMerke({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${FARGER[status]}`}
    >
      {STATUS_NAVN[status]}
    </span>
  )
}
