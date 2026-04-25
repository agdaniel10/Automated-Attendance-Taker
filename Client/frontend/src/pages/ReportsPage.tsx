import { AttendanceEventsTable } from '../components/AttendanceEventsTable'
import { MetricCard } from '../components/MetricCard'
import { SessionHistoryTable } from '../components/SessionHistoryTable'
import type { AttendanceEvent, AttendanceSession } from '../types/dashboard'

interface ReportsPageProps {
  sessions: AttendanceSession[]
  selectedSession: AttendanceSession | null
  selectedSessionEvents: AttendanceEvent[]
  exportingSessionId: string | null
  totalEvents: number
  onSelectSession: (sessionId: string) => void
  onExport: (sessionId: string) => void
}

export function ReportsPage({
  sessions,
  selectedSession,
  selectedSessionEvents,
  exportingSessionId,
  totalEvents,
  onSelectSession,
  onExport,
}: ReportsPageProps) {
  const closedSessions = sessions.filter((session) => session.status === 'CLOSED').length

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Sessions"
          value={String(sessions.length)}
          hint="Active and archived attendance sessions"
        />
        <MetricCard
          label="Closed Sessions"
          value={String(closedSessions)}
          hint="Completed sessions available for reporting"
        />
        <MetricCard
          label="All Records"
          value={String(totalEvents)}
          hint="Total attendance events in the loaded archive"
        />
        <MetricCard
          label="Selected Session"
          value={selectedSession ? selectedSession.programName : 'None'}
          hint="Choose any session below to inspect details"
        />
      </section>

      <div className="space-y-6">
        <SessionHistoryTable
          sessions={sessions}
          selectedSessionId={selectedSession?.id ?? ''}
          onSelectSession={onSelectSession}
          onExport={onExport}
          exportingSessionId={exportingSessionId}
        />

        <AttendanceEventsTable
          title={
            selectedSession
              ? `${selectedSession.programName} session details`
              : 'Session details'
          }
          subtitle={
            selectedSession
              ? 'A closer look at the attendance events inside the selected service.'
              : 'Choose a session from the archive to inspect its full event list.'
          }
          events={selectedSessionEvents}
          emptyTitle="No attendance records for this session"
          emptyDescription="When this session receives scanner or manual attendance, the detailed records will appear here."
        />
      </div>
    </div>
  )
}
