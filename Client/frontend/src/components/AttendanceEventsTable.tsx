import type { AttendanceEvent } from '../types/dashboard'

interface AttendanceEventsTableProps {
  title: string
  subtitle: string
  events: AttendanceEvent[]
  emptyTitle: string
  emptyDescription: string
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString()
}

function statusTone(source: string): string {
  if (source === 'SCANNER') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
  }

  if (source === 'MEMBER_NUMBER') {
    return 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
  }

  return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
}

function sourceLabel(source: string): string {
  if (source === 'SCANNER') {
    return 'Scanner'
  }

  if (source === 'MEMBER_NUMBER') {
    return 'AAGC Number'
  }

  if (source === 'ADMIN_APPROVAL') {
    return 'Manual'
  }

  return source
}

export function AttendanceEventsTable({
  title,
  subtitle,
  events,
  emptyTitle,
  emptyDescription,
}: AttendanceEventsTableProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Attendance Feed
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {title}
          </h3>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          {events.length} records
        </div>
      </div>

      {events.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 px-5 py-12 text-center">
          <p className="text-lg font-semibold text-slate-900">{emptyTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{emptyDescription}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-4 md:hidden">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{event.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.aagcNumber
                        ? `${event.aagcNumber} | ${event.email || event.phone || 'No contact details'}`
                        : event.email || event.phone || 'No contact details'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${statusTone(event.source)}`}
                  >
                    {sourceLabel(event.source)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-slate-900">Department:</span>{' '}
                    {event.department || 'Not assigned'}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Time:</span>{' '}
                    {formatDateTime(event.occurredAt)}
                  </p>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {event.message || 'No message'}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 hidden overflow-hidden rounded-[1.5rem] border border-slate-200 md:block">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {events.map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">{event.name}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {event.aagcNumber
                          ? `${event.aagcNumber} | ${event.email || event.phone || 'No contact details'}`
                          : event.email || event.phone || 'No contact details'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {event.department || 'Not assigned'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${statusTone(event.source)}`}>
                        {sourceLabel(event.source)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDateTime(event.occurredAt)}
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {event.message || 'No message'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
