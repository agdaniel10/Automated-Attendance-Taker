import type { MemberBiometrics, MemberSummary } from '../types/dashboard'

interface EnrollmentGuideCardProps {
  member: MemberSummary | null
  biometrics: MemberBiometrics | null
  isRefreshing: boolean
  onRefresh: () => void
  onCopyMemberId: () => void
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString()
}

export function EnrollmentGuideCard({
  member,
  biometrics,
  isRefreshing,
  onRefresh,
  onCopyMemberId,
}: EnrollmentGuideCardProps) {
  if (!member) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/80 p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          ScannerBridge Enrollment
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          Select a member to continue enrollment
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Once you select a member, this panel will show the member ID, biometric
          status, AAGC number, enrolled fingers, and the exact next steps for
          ScannerBridge.
        </p>
      </section>
    )
  }

  const templates = biometrics?.templates ?? []

  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            ScannerBridge Enrollment
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {member.name}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {member.department?.name ?? 'No department'} | {member.email} | {member.phone}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Biometric Status'}
          </button>
          <button
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold tracking-[0.16em] text-white transition hover:bg-slate-800"
            type="button"
            onClick={onCopyMemberId}
          >
            COPY MEMBER ID
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            AAGC Number
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">{member.aagcNumber}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Member ID
          </p>
          <p className="mt-2 break-all text-sm font-medium text-slate-900">{member.id}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Biometric Status
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {biometrics?.biometricStatus ?? member.biometricStatus}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Enrolled Fingers
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {biometrics?.enrolledFingerCount ?? member.enrolledFingerCount}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-700">
            Next Steps
          </p>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li>1. Open ScannerBridge on the enrollment computer.</li>
            <li>2. Log in with the backend admin credentials.</li>
            <li>
              3. Search for this member by AAGC number, name, email, phone, or paste
              the member ID.
            </li>
            <li>4. Capture one finger, then capture a second finger.</li>
            <li>5. Return here and refresh this card to confirm the member is now enrolled.</li>
          </ol>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
            Current Templates
          </p>
          {templates.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-slate-500">
              No fingerprints have been enrolled for this member yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {template.fingerPosition}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Added {formatDateTime(template.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
