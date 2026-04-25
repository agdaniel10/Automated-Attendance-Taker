import { Link } from 'react-router-dom'
import type { FormEvent } from 'react'

import { AagcNumberCheckInCard } from '../components/AagcNumberCheckInCard'
import { AttendanceEventsTable } from '../components/AttendanceEventsTable'
import { MetricCard } from '../components/MetricCard'
import { SessionStartForm } from '../components/SessionStartForm'
import { SessionSummaryCard } from '../components/SessionSummaryCard'
import type { AttendanceEvent, AttendanceSession } from '../types/dashboard'

interface AttendancePageProps {
  activeSession: AttendanceSession | null
  activeEvents: AttendanceEvent[]
  liveScannerCount: number
  liveNumberCount: number
  liveManualCount: number
  pendingReviewCount: number
  isRefreshing: boolean
  isClosingSession: boolean
  isStartingSession: boolean
  isMarkingByNumber: boolean
  exportingSessionId: string | null
  startForm: {
    programName: string
    notes: string
  }
  aagcForm: {
    aagcNumber: string
  }
  onStartFormChange: (field: 'programName' | 'notes', value: string) => void
  onAagcNumberChange: (value: string) => void
  onStartSession: (event: FormEvent<HTMLFormElement>) => void
  onMarkAttendanceByNumber: (event: FormEvent<HTMLFormElement>) => void
  onRefresh: () => void
  onCloseSession: (sessionId: string) => void
  onExport: (sessionId: string) => void
}

export function AttendancePage({
  activeSession,
  activeEvents,
  liveScannerCount,
  liveNumberCount,
  liveManualCount,
  pendingReviewCount,
  isRefreshing,
  isClosingSession,
  isStartingSession,
  isMarkingByNumber,
  exportingSessionId,
  startForm,
  aagcForm,
  onStartFormChange,
  onAagcNumberChange,
  onStartSession,
  onMarkAttendanceByNumber,
  onRefresh,
  onCloseSession,
  onExport,
}: AttendancePageProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Active Service"
          value={activeSession ? activeSession.programName : 'None'}
          hint={
            activeSession
              ? `Started by ${activeSession.startedBy}`
              : 'Open a session to begin attendance.'
          }
        />
        <MetricCard
          label="Live Attendance"
          value={String(activeEvents.length)}
          hint="Total check-ins for the active session"
        />
        <MetricCard
          label="Fingerprint"
          value={String(liveScannerCount)}
          hint="Check-ins from ScannerBridge"
        />
        <MetricCard
          label="AAGC Number"
          value={String(liveNumberCount)}
          hint="Attendance recorded by typed member number"
        />
        <MetricCard
          label="Review Queue"
          value={String(pendingReviewCount)}
          hint={`${liveManualCount} manual approvals recorded`}
        />
      </section>

      <div className="grid gap-6 2xl:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-6">
          <SessionSummaryCard
            session={activeSession}
            liveCount={activeEvents.length}
            scannerCount={liveScannerCount}
            numberCount={liveNumberCount}
            adminCount={liveManualCount}
            onRefresh={onRefresh}
            onCloseSession={onCloseSession}
            onExport={onExport}
            isRefreshing={isRefreshing}
            isClosing={isClosingSession}
            exportingSessionId={exportingSessionId}
          />

          <AttendanceEventsTable
            title={
              activeSession
                ? `${activeSession.programName} live check-ins`
                : 'Live attendance feed'
            }
            subtitle={
              activeSession
                ? 'This updates on the dashboard refresh cycle while the service remains open.'
                : 'Start a session to see scanner, AAGC number, and manual attendance entries.'
            }
            events={activeEvents}
            emptyTitle="No attendance has been recorded yet"
            emptyDescription="Once ScannerBridge or the admin desk records attendance, the live feed will appear here."
          />
        </div>

        <aside className="space-y-6">
          <SessionStartForm
            programName={startForm.programName}
            notes={startForm.notes}
            isSubmitting={isStartingSession}
            hasActiveSession={Boolean(activeSession)}
            onProgramNameChange={(value) => onStartFormChange('programName', value)}
            onNotesChange={(value) => onStartFormChange('notes', value)}
            onSubmit={onStartSession}
          />

          <AagcNumberCheckInCard
            hasActiveSession={Boolean(activeSession)}
            aagcNumber={aagcForm.aagcNumber}
            isSubmitting={isMarkingByNumber}
            onAagcNumberChange={onAagcNumberChange}
            onSubmit={onMarkAttendanceByNumber}
          />

          <section className="rounded-[1.75rem] border border-rose-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
              Review Desk
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Handle failed scanner matches
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Pending no-match cases now live in their own page so the main attendance desk stays calmer during service.
            </p>
            <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
              <p className="text-sm text-slate-500">Pending review cases</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {pendingReviewCount}
              </p>
            </div>
            <Link
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-white transition hover:bg-slate-800"
              to="/review-queue"
            >
              OPEN REVIEW QUEUE
            </Link>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Operational Guidance
            </p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">1. Open the session here</p>
                <p className="mt-1">
                  ScannerBridge can only match and mark people when an active session exists.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">2. Use AAGC numbers as a fallback</p>
                <p className="mt-1">
                  When fingerprint capture is not convenient, typed member numbers keep attendance moving.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">3. Review no-match cases intentionally</p>
                <p className="mt-1">
                  Keep false approvals low by resolving fingerprint failures from the review page, not by guesswork.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
