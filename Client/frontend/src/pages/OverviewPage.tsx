import { MetricCard } from '../components/MetricCard'
import { AttendanceTrendChart } from '../components/AttendanceTrendChart'
import { MemberAttendanceChart } from '../components/MemberAttendanceChart'
import { DepartmentAttendancePieChart } from '../components/DepartmentAttendancePieChart'
import { OnboardingChecklist } from '../components/OnboardingChecklist'
import type { AttendanceEvent, AttendanceSession } from '../types/dashboard'

interface AttendanceTrendDatum {
  label: string
  attendance: number
  fullLabel: string
}

interface MemberAttendanceDatum {
  label: string
  attendanceCount: number
  fullName: string
  aagcNumber: string | null
}

interface DepartmentAttendanceDatum {
  name: string
  value: number
  fill: string
}

interface OverviewPageProps {
  activeSession: AttendanceSession | null
  activeEvents: AttendanceEvent[]
  totalEvents: number
  enrolledMembersCount: number
  pendingMembersCount: number
  pendingReviewCount: number
  trendData: AttendanceTrendDatum[]
  memberAttendanceData: MemberAttendanceDatum[]
  departmentAttendanceData: DepartmentAttendanceDatum[]
  onboardingVisible: boolean
  onboardingSteps: Array<{
    id: string
    title: string
    description: string
    completed: boolean
    actionLabel: string
    onAction: () => void
    helperText?: string
  }>
  onDismissOnboarding: () => void
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OverviewPage({
  activeSession,
  activeEvents,
  totalEvents,
  enrolledMembersCount,
  pendingMembersCount,
  pendingReviewCount,
  trendData,
  memberAttendanceData,
  departmentAttendanceData,
  onboardingVisible,
  onboardingSteps,
  onDismissOnboarding,
}: OverviewPageProps) {
  const recentArrivals = activeEvents.slice(0, 5)

  return (
    <div className="space-y-6">
      {onboardingVisible ? (
        <OnboardingChecklist
          steps={onboardingSteps}
          onDismiss={onDismissOnboarding}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Live Session"
          value={activeSession ? activeSession.programName : 'None'}
          hint={
            activeSession
              ? 'Attendance is currently being recorded.'
              : 'Open a new service session to begin check-ins.'
          }
        />
        <MetricCard
          label="Live Attendance"
          value={String(activeEvents.length)}
          hint="Recorded in the active session"
        />
        <MetricCard
          label="All Records"
          value={String(totalEvents)}
          hint="Attendance events across recent sessions"
        />
        <MetricCard
          label="Biometric Ready"
          value={String(enrolledMembersCount)}
          hint="Members fully enrolled for fingerprint use"
        />
        <MetricCard
          label="Pending Reviews"
          value={String(pendingReviewCount)}
          hint={`${pendingMembersCount} members still need enrollment work`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <AttendanceTrendChart data={trendData} />
        <DepartmentAttendancePieChart data={departmentAttendanceData} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MemberAttendanceChart data={memberAttendanceData} />

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Service Pulse
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Recent arrivals
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              The latest check-ins from the current active service session.
            </p>
          </div>

          {recentArrivals.length === 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 px-5 py-12 text-center">
              <p className="text-lg font-semibold text-slate-900">No one has checked in yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                As members arrive, their names will show here immediately after the next dashboard refresh.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {recentArrivals.map((event) => (
                <article
                  key={event.id}
                  className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{event.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {event.aagcNumber
                          ? `${event.aagcNumber} - ${event.department || 'No department'}`
                          : event.department || 'No department'}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                      {formatDateTime(event.occurredAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {event.message || 'Attendance recorded successfully.'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  )
}
