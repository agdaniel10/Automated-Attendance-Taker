import type { ReviewQueueItem } from '../types/dashboard'

interface ReviewQueueCardProps {
  attempts: ReviewQueueItem[]
  selectedAttemptId: string
  isRefreshing: boolean
  onRefresh: () => void
  onSelectAttempt: (attemptId: string) => void
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString()
}

function formatConfidence(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return 'N/A'
  }

  return `${value.toFixed(1)}%`
}

export function ReviewQueueCard({
  attempts,
  selectedAttemptId,
  isRefreshing,
  onRefresh,
  onSelectAttempt,
}: ReviewQueueCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-rose-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
            No-Match Review Queue
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Review failed fingerprint scans
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Select a pending scanner failure here, then resolve it from the approval
            card below with the right member or guest name.
          </p>
        </div>
        <button
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Queue'}
        </button>
      </div>

      {attempts.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 px-5 py-10 text-center">
          <p className="text-lg font-semibold text-slate-900">No pending no-match cases</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            When ScannerBridge reports an unresolved fingerprint, it will appear here
            for admin review.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {attempts.map((attempt) => {
            const isSelected = attempt.id === selectedAttemptId

            return (
              <article
                key={attempt.id}
                className={`rounded-[1.5rem] border px-4 py-4 transition ${
                  isSelected
                    ? 'border-rose-300 bg-rose-50/70'
                    : 'border-slate-200 bg-slate-50/70'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-700">
                        Pending
                      </span>
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {formatDateTime(attempt.occurredAt)}
                      </span>
                    </div>

                    {attempt.matchedMember ? (
                      <div>
                        <p className="text-base font-semibold text-slate-950">
                          {attempt.matchedMember.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {attempt.matchedMember.aagcNumber ?? 'No AAGC number'} |{' '}
                          {attempt.matchedMember.department ?? 'No department'} |{' '}
                          {attempt.matchedMember.biometricStatus}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-base font-semibold text-slate-950">
                          Unknown fingerprint match
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          No member could be resolved from the fingerprint scan.
                        </p>
                      </div>
                    )}

                    <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <span className="font-medium text-slate-900">Device:</span>{' '}
                        {attempt.deviceId ?? 'Unknown scanner'}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Confidence:</span>{' '}
                        {formatConfidence(attempt.confidence)}
                      </p>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                      {attempt.notes || 'No notes were stored for this no-match case.'}
                    </p>
                  </div>

                  <button
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold tracking-[0.16em] transition ${
                      isSelected
                        ? 'bg-rose-600 text-white hover:bg-rose-500'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    type="button"
                    onClick={() => onSelectAttempt(attempt.id)}
                  >
                    {isSelected ? 'SELECTED' : 'REVIEW CASE'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
