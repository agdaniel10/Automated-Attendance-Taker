import type { FormEvent } from 'react'

interface ManualApprovalCardProps {
  hasActiveSession: boolean
  displayName: string
  notes: string
  isSubmitting: boolean
  onDisplayNameChange: (value: string) => void
  onNotesChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ManualApprovalCard({
  hasActiveSession,
  displayName,
  notes,
  isSubmitting,
  onDisplayNameChange,
  onNotesChange,
  onSubmit,
}: ManualApprovalCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Manual Approval
        </p>
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
          Guest or no-match check-in
        </h3>
        <p className="text-sm leading-6 text-slate-500">
          Use this when someone should be admitted even if the scanner did not resolve
          a fingerprint match.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Display Name</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            placeholder="Enter attendee name"
            disabled={!hasActiveSession || isSubmitting}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Optional explanation for the manual approval"
            disabled={!hasActiveSession || isSubmitting}
          />
        </label>

        <button
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold tracking-[0.2em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          type="submit"
          disabled={!hasActiveSession || isSubmitting || !displayName.trim()}
        >
          {!hasActiveSession
            ? 'OPEN A SESSION FIRST'
            : isSubmitting
              ? 'APPROVING...'
              : 'APPROVE ATTENDANCE'}
        </button>
      </form>
    </section>
  )
}
