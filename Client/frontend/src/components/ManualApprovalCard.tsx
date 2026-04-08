import type { FormEvent } from 'react'
import type { ReviewQueueItem } from '../types/dashboard'

interface ManualApprovalCardProps {
  hasActiveSession: boolean
  displayName: string
  notes: string
  isSubmitting: boolean
  selectedAttempt: ReviewQueueItem | null
  onDisplayNameChange: (value: string) => void
  onNotesChange: (value: string) => void
  onClearSelectedAttempt: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ManualApprovalCard({
  hasActiveSession,
  displayName,
  notes,
  isSubmitting,
  selectedAttempt,
  onDisplayNameChange,
  onNotesChange,
  onClearSelectedAttempt,
  onSubmit,
}: ManualApprovalCardProps) {
  const linkedMember = selectedAttempt?.matchedMember ?? null

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

      {selectedAttempt ? (
        <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Selected Queue Case
              </p>
              {linkedMember ? (
                <p className="text-sm leading-6 text-slate-700">
                  Approving this case will mark{' '}
                  <span className="font-semibold text-slate-950">
                    {linkedMember.name}
                  </span>
                  {linkedMember.aagcNumber ? ` (${linkedMember.aagcNumber})` : ''} as present
                  for the active session.
                </p>
              ) : (
                <p className="text-sm leading-6 text-slate-700">
                  This no-match attempt is not linked to any member record. Type the
                  attendee name below to resolve it as a guest or manual exception.
                </p>
              )}
            </div>

            <button
              className="rounded-2xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
              type="button"
              onClick={onClearSelectedAttempt}
            >
              Clear Selection
            </button>
          </div>
        </div>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Display Name</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            placeholder={
              linkedMember
                ? 'Linked member will be used automatically'
                : 'Enter attendee name'
            }
            disabled={!hasActiveSession || isSubmitting || Boolean(linkedMember)}
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
          disabled={
            !hasActiveSession ||
            isSubmitting ||
            (!displayName.trim() && !linkedMember)
          }
        >
          {!hasActiveSession
            ? 'OPEN A SESSION FIRST'
            : isSubmitting
              ? 'APPROVING...'
              : selectedAttempt
                ? 'APPROVE SELECTED CASE'
                : 'APPROVE ATTENDANCE'}
        </button>
      </form>
    </section>
  )
}
