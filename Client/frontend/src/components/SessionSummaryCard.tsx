import type { AttendanceSession } from '../types/dashboard'

interface SessionSummaryCardProps {
  session: AttendanceSession | null
  liveCount: number
  scannerCount: number
  numberCount: number
  adminCount: number
  onRefresh: () => void
  onCloseSession: (sessionId: string) => void
  onExport: (sessionId: string) => void
  isRefreshing: boolean
  isClosing: boolean
  exportingSessionId: string | null
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return 'Not available'
  }

  return new Date(value).toLocaleString()
}

export function SessionSummaryCard({
  session,
  liveCount,
  scannerCount,
  numberCount,
  adminCount,
  onRefresh,
  onCloseSession,
  onExport,
  isRefreshing,
  isClosing,
  exportingSessionId,
}: SessionSummaryCardProps) {
  if (!session) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/80 p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Active Service Window
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          No session is active right now
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Start a session from the control card and the fingerprint scanner will be
          able to load candidates immediately.
        </p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-[1.85rem] border border-amber-100 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="border-b border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,255,255,0.96))] px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
              Active Session
            </p>
            <h3 className="mt-2 font-['Baskerville','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-3xl tracking-tight text-slate-950">
              {session.programName}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {session.notes?.trim() || 'No notes were added for this session.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
              type="button"
              onClick={() => onExport(session.id)}
              disabled={exportingSessionId === session.id}
            >
              {exportingSessionId === session.id ? 'Preparing CSV...' : 'Export CSV'}
            </button>
            <button
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="button"
              onClick={() => onCloseSession(session.id)}
              disabled={isClosing}
            >
              {isClosing ? 'Closing...' : 'Close Session'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Started
          </p>
          <p className="mt-2 text-sm font-medium text-slate-800">
            {formatDateTime(session.startedAt)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Started By
          </p>
          <p className="mt-2 text-sm font-medium text-slate-800">{session.startedBy}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Scanner Check-ins
          </p>
          <p className="mt-2 text-sm font-medium text-slate-800">{scannerCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            AAGC Number
          </p>
          <p className="mt-2 text-sm font-medium text-slate-800">{numberCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Manual Approvals
          </p>
          <p className="mt-2 text-sm font-medium text-slate-800">{adminCount}</p>
        </div>
      </div>

      <div className="border-t border-slate-100 px-6 py-4">
        <p className="text-sm text-slate-500">
          Total recorded attendance so far:
          <span className="ml-2 font-semibold text-slate-950">{liveCount}</span>
        </p>
      </div>
    </section>
  )
}
