import type { FormEvent } from 'react'

interface SessionStartFormProps {
  programName: string
  notes: string
  isSubmitting: boolean
  hasActiveSession: boolean
  onProgramNameChange: (value: string) => void
  onNotesChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function SessionStartForm({
  programName,
  notes,
  isSubmitting,
  hasActiveSession,
  onProgramNameChange,
  onNotesChange,
  onSubmit,
}: SessionStartFormProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Session Control
        </p>
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
          Start a new attendance session
        </h3>
        <p className="text-sm leading-6 text-slate-500">
          Create the live service window that the fingerprint terminal will attach to.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Program Name</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
            value={programName}
            onChange={(event) => onProgramNameChange(event.target.value)}
            placeholder="Sunday Service"
            disabled={isSubmitting || hasActiveSession}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Morning worship service"
            disabled={isSubmitting || hasActiveSession}
          />
        </label>

        <button
          className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold tracking-[0.2em] text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          type="submit"
          disabled={isSubmitting || hasActiveSession || !programName.trim()}
        >
          {hasActiveSession
            ? 'ACTIVE SESSION ALREADY OPEN'
            : isSubmitting
              ? 'STARTING SESSION...'
              : 'START SESSION'}
        </button>
      </form>
    </section>
  )
}
