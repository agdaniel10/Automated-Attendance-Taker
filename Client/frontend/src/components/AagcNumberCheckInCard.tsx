import type { FormEvent } from 'react'

interface AagcNumberCheckInCardProps {
  hasActiveSession: boolean
  aagcNumber: string
  isSubmitting: boolean
  onAagcNumberChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AagcNumberCheckInCard({
  hasActiveSession,
  aagcNumber,
  isSubmitting,
  onAagcNumberChange,
  onSubmit,
}: AagcNumberCheckInCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-sky-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-500">
          AAGC Number Check-In
        </p>
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
          Mark attendance by member number
        </h3>
        <p className="text-sm leading-6 text-slate-500">
          Use this as the simple fallback when someone knows their AAGC number and
          fingerprint capture is not the best option.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">AAGC Number</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            value={aagcNumber}
            onChange={(event) => onAagcNumberChange(event.target.value)}
            placeholder="Type AAGC1 or just 1"
            disabled={!hasActiveSession || isSubmitting}
          />
        </label>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
          The system accepts <span className="font-semibold text-slate-900">AAGC1</span>,{' '}
          <span className="font-semibold text-slate-900">AAGC-1</span>, or just{' '}
          <span className="font-semibold text-slate-900">1</span>.
        </div>

        <button
          className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          type="submit"
          disabled={!hasActiveSession || isSubmitting || !aagcNumber.trim()}
        >
          {!hasActiveSession
            ? 'OPEN A SESSION FIRST'
            : isSubmitting
              ? 'MARKING ATTENDANCE...'
              : 'MARK ATTENDANCE'}
        </button>
      </form>
    </section>
  )
}
