import type { AttendanceSession } from '../types/dashboard'

interface SessionHistoryTableProps {
  sessions: AttendanceSession[]
  selectedSessionId: string
  onSelectSession: (sessionId: string) => void
  onExport: (sessionId: string) => void
  exportingSessionId: string | null
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString()
}

export function SessionHistoryTable({
  sessions,
  selectedSessionId,
  onSelectSession,
  onExport,
  exportingSessionId,
}: SessionHistoryTableProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Session Archive
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Recent attendance sessions
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Switch between active and closed services to inspect their event logs.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          {sessions.length} sessions
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
        <div className="space-y-4 p-4 md:hidden">
          {sessions.map((session) => {
            const isSelected = session.id === selectedSessionId
            const eventCount = session._count?.events ?? 0

            return (
              <article
                key={session.id}
                className={`rounded-[1.35rem] border p-4 ${
                  isSelected
                    ? 'border-amber-300 bg-amber-50/70'
                    : 'border-slate-200 bg-slate-50/80'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{session.programName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.notes?.trim() || 'No notes'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
                      session.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                        : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-slate-900">Started:</span>{' '}
                    {formatDateTime(session.startedAt)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Events:</span>{' '}
                    {eventCount}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    type="button"
                    onClick={() => onSelectSession(session.id)}
                  >
                    {isSelected ? 'Viewing Session' : 'View Session'}
                  </button>
                  <button
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                    type="button"
                    onClick={() => onExport(session.id)}
                    disabled={exportingSessionId === session.id}
                  >
                    {exportingSessionId === session.id ? 'Exporting...' : 'Export CSV'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Events</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sessions.map((session) => {
                const isSelected = session.id === selectedSessionId
                const eventCount = session._count?.events ?? 0

                return (
                  <tr
                    key={session.id}
                    className={isSelected ? 'bg-amber-50/70' : 'bg-white'}
                  >
                    <td className="px-4 py-4">
                      <button
                        className="text-left"
                        type="button"
                        onClick={() => onSelectSession(session.id)}
                      >
                        <div className="font-medium text-slate-900">{session.programName}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {session.notes?.trim() || 'No notes'}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
                          session.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDateTime(session.startedAt)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{eventCount}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                          type="button"
                          onClick={() => onSelectSession(session.id)}
                        >
                          View
                        </button>
                        <button
                          className="rounded-full border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                          type="button"
                          onClick={() => onExport(session.id)}
                          disabled={exportingSessionId === session.id}
                        >
                          {exportingSessionId === session.id ? 'Exporting...' : 'CSV'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
