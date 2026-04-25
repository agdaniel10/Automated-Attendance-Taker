import type { FormEvent } from 'react'

import { ManualApprovalCard } from '../components/ManualApprovalCard'
import { MetricCard } from '../components/MetricCard'
import { ReviewQueueCard } from '../components/ReviewQueueCard'
import type { AttendanceSession, ReviewQueueItem } from '../types/dashboard'

interface ReviewQueuePageProps {
  activeSession: AttendanceSession | null
  reviewQueue: ReviewQueueItem[]
  selectedReviewAttempt: ReviewQueueItem | null
  selectedReviewAttemptId: string
  manualForm: {
    displayName: string
    notes: string
  }
  isRefreshingReviewQueue: boolean
  isApproving: boolean
  onRefreshReviewQueue: () => void
  onSelectReviewAttempt: (attemptId: string) => void
  onClearSelectedReviewAttempt: () => void
  onManualFormChange: (field: 'displayName' | 'notes', value: string) => void
  onSubmitApproval: (event: FormEvent<HTMLFormElement>) => void
}

export function ReviewQueuePage({
  activeSession,
  reviewQueue,
  selectedReviewAttempt,
  selectedReviewAttemptId,
  manualForm,
  isRefreshingReviewQueue,
  isApproving,
  onRefreshReviewQueue,
  onSelectReviewAttempt,
  onClearSelectedReviewAttempt,
  onManualFormChange,
  onSubmitApproval,
}: ReviewQueuePageProps) {
  const linkedCases = reviewQueue.filter((attempt) => attempt.matchedMember).length
  const unknownCases = reviewQueue.length - linkedCases

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Service"
          value={activeSession ? activeSession.programName : 'None'}
          hint={
            activeSession
              ? 'Review cases belong to the current session.'
              : 'Open a session before the scanner can add review cases.'
          }
        />
        <MetricCard
          label="Pending Cases"
          value={String(reviewQueue.length)}
          hint="Failed fingerprint scans waiting for admin action"
        />
        <MetricCard
          label="Linked Members"
          value={String(linkedCases)}
          hint="Cases that already suggest a real member"
        />
        <MetricCard
          label="Unknown Matches"
          value={String(unknownCases)}
          hint="Cases that still need a manual name entry"
        />
      </section>

      <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <ReviewQueueCard
            attempts={reviewQueue}
            selectedAttemptId={selectedReviewAttemptId}
            isRefreshing={isRefreshingReviewQueue}
            onRefresh={onRefreshReviewQueue}
            onSelectAttempt={onSelectReviewAttempt}
          />

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Review Notes
            </p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Check the suggested member carefully</p>
                <p className="mt-1">
                  A linked member helps, but it should still be confirmed before approval.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Use guest names only when needed</p>
                <p className="mt-1">
                  If there is no member match, resolve the case with the correct visitor or attendee name.
                </p>
              </div>
            </div>
          </section>
        </div>

        <ManualApprovalCard
          hasActiveSession={Boolean(activeSession)}
          displayName={manualForm.displayName}
          notes={manualForm.notes}
          isSubmitting={isApproving}
          selectedAttempt={selectedReviewAttempt}
          onDisplayNameChange={(value) => onManualFormChange('displayName', value)}
          onNotesChange={(value) => onManualFormChange('notes', value)}
          onClearSelectedAttempt={onClearSelectedReviewAttempt}
          onSubmit={onSubmitApproval}
        />
      </div>
    </div>
  )
}
