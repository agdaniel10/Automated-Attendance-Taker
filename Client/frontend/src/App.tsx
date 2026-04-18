import type { FormEvent } from 'react'
import { useEffect, useEffectEvent, useState } from 'react'

import {
  closeSession,
  exportSessionCsv,
  listSessionEvents,
  listReviewQueue,
  listSessions,
  manualApproveAttendance,
  markAttendanceByNumber,
  startSession,
} from './api/attendanceApi'
import { AagcNumberCheckInCard } from './components/AagcNumberCheckInCard'
import { loginAdmin } from './api/authApi'
import { ApiError } from './api/http'
import { AttendanceEventsTable } from './components/AttendanceEventsTable'
import { ChurchLogo } from './components/ChurchLogo'
import { DashboardTabs } from './components/DashboardTabs'
import { DepartmentManagerCard } from './components/DepartmentManagerCard'
import { EnrollmentGuideCard } from './components/EnrollmentGuideCard'
import { LoginScreen } from './components/LoginScreen'
import { ManualApprovalCard } from './components/ManualApprovalCard'
import { MemberCreateForm } from './components/MemberCreateForm'
import { MemberListTable } from './components/MemberListTable'
import { MetricCard } from './components/MetricCard'
import { ReviewQueueCard } from './components/ReviewQueueCard'
import { SessionHistoryTable } from './components/SessionHistoryTable'
import { SessionStartForm } from './components/SessionStartForm'
import { SessionSummaryCard } from './components/SessionSummaryCard'
import {
  createDepartment,
  createMember,
  getMemberBiometrics,
  listDepartments,
  listMembers,
} from './api/memberApi'
import {
  clearStoredAdminSession,
  getDefaultBaseUrl,
  loadStoredAdminSession,
  saveStoredAdminSession,
} from './lib/adminSession'
import type {
  AttendanceEvent,
  DepartmentRecord,
  AttendanceSession,
  DashboardNotice,
  MemberBiometrics,
  MemberSummary,
  ReviewQueueItem,
  StoredAdminSession,
} from './types/dashboard'

function formatTimestamp(value: string | null): string {
  if (!value) {
    return 'Not yet synced'
  }

  return new Date(value).toLocaleString()
}

function getNoticeClasses(tone: DashboardNotice['tone']): string {
  switch (tone) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'error':
      return 'border-red-200 bg-red-50 text-red-800'
    default:
      return 'border-sky-200 bg-sky-50 text-sky-800'
  }
}

function App() {
  const storedSession = loadStoredAdminSession()

  const [activeView, setActiveView] = useState<'attendance' | 'members'>('attendance')
  const [authSession, setAuthSession] = useState<StoredAdminSession | null>(storedSession)
  const [loginForm, setLoginForm] = useState({
    apiBaseUrl: storedSession?.baseUrl ?? getDefaultBaseUrl(),
    operatorName: storedSession?.operatorName ?? 'Admin Operator',
    password: '',
  })
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [activeEvents, setActiveEvents] = useState<AttendanceEvent[]>([])
  const [selectedSessionEvents, setSelectedSessionEvents] = useState<AttendanceEvent[]>([])
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([])
  const [selectedReviewAttemptId, setSelectedReviewAttemptId] = useState('')
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedMemberBiometrics, setSelectedMemberBiometrics] =
    useState<MemberBiometrics | null>(null)
  const [notice, setNotice] = useState<DashboardNotice | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

  const [startForm, setStartForm] = useState({
    programName: 'Sunday Service',
    notes: 'Main worship service',
  })
  const [manualForm, setManualForm] = useState({
    displayName: '',
    notes: '',
  })
  const [aagcForm, setAagcForm] = useState({
    aagcNumber: '',
  })
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
  })
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    email: '',
    departmentId: '',
  })
  const [memberFilters, setMemberFilters] = useState({
    search: '',
    departmentId: '',
  })

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRefreshingMembers, setIsRefreshingMembers] = useState(false)
  const [isRefreshingBiometrics, setIsRefreshingBiometrics] = useState(false)
  const [isRefreshingReviewQueue, setIsRefreshingReviewQueue] = useState(false)
  const [isStartingSession, setIsStartingSession] = useState(false)
  const [isClosingSession, setIsClosingSession] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isMarkingByNumber, setIsMarkingByNumber] = useState(false)
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false)
  const [isCreatingMember, setIsCreatingMember] = useState(false)
  const [exportingSessionId, setExportingSessionId] = useState<string | null>(null)

  const activeSession = sessions.find((session) => session.status === 'ACTIVE') ?? null
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ??
    activeSession ??
    sessions[0] ??
    null

  const totalEvents = sessions.reduce(
    (sum, session) => sum + (session._count?.events ?? 0),
    0,
  )
  const liveScannerCount = activeEvents.filter((event) => event.source === 'SCANNER').length
  const liveNumberCount = activeEvents.filter(
    (event) => event.source === 'MEMBER_NUMBER',
  ).length
  const liveManualCount = activeEvents.filter(
    (event) => event.source === 'ADMIN_APPROVAL',
  ).length
  const pendingReviewCount = reviewQueue.length
  const enrolledMembersCount = members.filter(
    (member) => member.biometricStatus === 'ENROLLED',
  ).length
  const pendingMembersCount = members.filter(
    (member) => member.biometricStatus !== 'ENROLLED',
  ).length

  async function refreshDashboard(preferredSessionId?: string): Promise<void> {
    if (!authSession) {
      return
    }

    setIsRefreshing(true)
    setIsRefreshingReviewQueue(true)

    try {
      const nextSessions = await listSessions(authSession.baseUrl, authSession.token)
      const nextActiveSession =
        nextSessions.find((session) => session.status === 'ACTIVE') ?? null

      let nextSelectedSessionId = preferredSessionId ?? selectedSessionId
      if (
        !nextSelectedSessionId ||
        !nextSessions.some((session) => session.id === nextSelectedSessionId)
      ) {
        nextSelectedSessionId = nextActiveSession?.id ?? nextSessions[0]?.id ?? ''
      }

      const sessionIdsToLoad = Array.from(
        new Set(
          [nextActiveSession?.id, nextSelectedSessionId].filter(
            (value): value is string => Boolean(value),
          ),
        ),
      )

      const eventsBySession = new Map<string, AttendanceEvent[]>()
      let nextReviewQueue: ReviewQueueItem[] = []

      await Promise.all(
        [
          ...sessionIdsToLoad.map(async (sessionId) => {
            const events = await listSessionEvents(
              authSession.baseUrl,
              authSession.token,
              sessionId,
            )
            eventsBySession.set(sessionId, events)
          }),
          ...(nextActiveSession
            ? [
                (async () => {
                  const queue = await listReviewQueue(
                    authSession.baseUrl,
                    authSession.token,
                    nextActiveSession.id,
                  )
                  nextReviewQueue = queue.items
                })(),
              ]
            : []),
        ],
      )

      setSessions(nextSessions)
      setSelectedSessionId(nextSelectedSessionId)
      setReviewQueue(nextReviewQueue)
      setSelectedReviewAttemptId((currentSelectedId) =>
        nextReviewQueue.some((attempt) => attempt.id === currentSelectedId)
          ? currentSelectedId
          : '',
      )
      setActiveEvents(
        nextActiveSession ? eventsBySession.get(nextActiveSession.id) ?? [] : [],
      )
      setSelectedSessionEvents(
        nextSelectedSessionId ? eventsBySession.get(nextSelectedSessionId) ?? [] : [],
      )
      setLastUpdatedAt(new Date().toISOString())
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearStoredAdminSession()
        setAuthSession(null)
        setNotice({
          tone: 'warning',
          title: 'Session expired',
          description: 'Please sign in again to continue managing attendance.',
        })
        return
      }

      setNotice({
        tone: 'error',
        title: 'Dashboard refresh failed',
        description:
          error instanceof Error ? error.message : 'Unable to load attendance data.',
      })
    } finally {
      setIsRefreshing(false)
      setIsRefreshingReviewQueue(false)
    }
  }

  async function refreshDepartments(): Promise<DepartmentRecord[]> {
    if (!authSession) {
      return []
    }

    const nextDepartments = await listDepartments(authSession.baseUrl, authSession.token)
    setDepartments(nextDepartments)

    setMemberForm((currentForm) => {
      if (
        currentForm.departmentId &&
        nextDepartments.some((department) => department.id === currentForm.departmentId)
      ) {
        return currentForm
      }

      return {
        ...currentForm,
        departmentId: nextDepartments[0]?.id ?? '',
      }
    })

    return nextDepartments
  }

  async function refreshReviewQueue(sessionId?: string): Promise<void> {
    if (!authSession) {
      return
    }

    const targetSessionId = sessionId ?? activeSession?.id ?? ''
    if (!targetSessionId) {
      setReviewQueue([])
      setSelectedReviewAttemptId('')
      return
    }

    setIsRefreshingReviewQueue(true)

    try {
      const queue = await listReviewQueue(
        authSession.baseUrl,
        authSession.token,
        targetSessionId,
      )

      setReviewQueue(queue.items)
      setSelectedReviewAttemptId((currentSelectedId) =>
        queue.items.some((attempt) => attempt.id === currentSelectedId)
          ? currentSelectedId
          : '',
      )
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Review queue refresh failed',
        description:
          error instanceof Error
            ? error.message
            : 'Unable to load no-match review cases right now.',
      })
    } finally {
      setIsRefreshingReviewQueue(false)
    }
  }

  async function refreshMembers(preferredMemberId?: string): Promise<void> {
    if (!authSession) {
      return
    }

    setIsRefreshingMembers(true)

    try {
      const nextMembers = await listMembers(authSession.baseUrl, authSession.token, {
        search: memberFilters.search,
        departmentId: memberFilters.departmentId,
      })

      setMembers(nextMembers)

      let nextSelectedMemberId = preferredMemberId ?? selectedMemberId

      if (
        !nextSelectedMemberId ||
        !nextMembers.some((member) => member.id === nextSelectedMemberId)
      ) {
        nextSelectedMemberId = nextMembers[0]?.id ?? ''
      }

      setSelectedMemberId(nextSelectedMemberId)

      if (nextSelectedMemberId) {
        const biometrics = await getMemberBiometrics(
          authSession.baseUrl,
          authSession.token,
          nextSelectedMemberId,
        )
        setSelectedMemberBiometrics(biometrics)
      } else {
        setSelectedMemberBiometrics(null)
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Member refresh failed',
        description:
          error instanceof Error ? error.message : 'Unable to load members right now.',
      })
    } finally {
      setIsRefreshingMembers(false)
    }
  }

  async function refreshSelectedMemberBiometrics(memberId?: string): Promise<void> {
    if (!authSession) {
      return
    }

    const targetMemberId = memberId ?? selectedMemberId
    if (!targetMemberId) {
      setSelectedMemberBiometrics(null)
      return
    }

    setIsRefreshingBiometrics(true)

    try {
      const biometrics = await getMemberBiometrics(
        authSession.baseUrl,
        authSession.token,
        targetMemberId,
      )
      setSelectedMemberBiometrics(biometrics)
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Biometric status refresh failed',
        description:
          error instanceof Error
            ? error.message
            : 'Unable to load biometric status right now.',
      })
    } finally {
      setIsRefreshingBiometrics(false)
    }
  }

  const runRefresh = useEffectEvent((preferredSessionId?: string) => {
    void refreshDashboard(preferredSessionId)
  })

  const runDepartmentRefresh = useEffectEvent(() => {
    void refreshDepartments()
  })

  const runMemberRefresh = useEffectEvent((preferredMemberId?: string) => {
    void refreshMembers(preferredMemberId)
  })

  useEffect(() => {
    if (!authSession) {
      return
    }

    runRefresh()
    runDepartmentRefresh()
    runMemberRefresh()
  }, [authSession])

  useEffect(() => {
    if (!authSession) {
      return
    }

    const intervalId = window.setInterval(() => {
      runRefresh()
    }, 15000)

    return () => window.clearInterval(intervalId)
  }, [authSession])

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    try {
      const session = await loginAdmin(loginForm.apiBaseUrl, {
        operatorName: loginForm.operatorName,
        password: loginForm.password,
      })

      saveStoredAdminSession(session)
      setAuthSession(session)
      setLoginForm((currentForm) => ({
        ...currentForm,
        apiBaseUrl: session.baseUrl,
        operatorName: session.operatorName,
        password: '',
      }))
      setNotice({
        tone: 'success',
        title: 'Welcome back',
        description: `${session.operatorName} is now signed in and ready to manage attendance.`,
      })
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : 'Unable to sign in right now.',
      )
    } finally {
      setIsLoggingIn(false)
    }
  }

  function handleLogout(): void {
    clearStoredAdminSession()
    setAuthSession(null)
    setSessions([])
    setSelectedSessionId('')
    setActiveEvents([])
    setSelectedSessionEvents([])
    setReviewQueue([])
    setSelectedReviewAttemptId('')
    setDepartments([])
    setMembers([])
    setSelectedMemberId('')
    setSelectedMemberBiometrics(null)
    setNotice({
      tone: 'info',
      title: 'Signed out',
      description: 'The admin session has been cleared from this browser.',
    })
  }

  async function handleStartSession(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!authSession) {
      return
    }

    setIsStartingSession(true)

    try {
      const session = await startSession(authSession.baseUrl, authSession.token, startForm)
      setNotice({
        tone: 'success',
        title: 'Session started',
        description: `${session.programName} is now live and ready for scanner check-ins.`,
      })
      await refreshDashboard(session.id)
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Unable to start session',
        description:
          error instanceof Error ? error.message : 'Please try again in a moment.',
      })
    } finally {
      setIsStartingSession(false)
    }
  }

  async function handleCloseSession(sessionId: string): Promise<void> {
    if (!authSession) {
      return
    }

    const confirmed = window.confirm(
      'Close this attendance session now? The scanner will stop accepting fresh check-ins until a new session is started.',
    )

    if (!confirmed) {
      return
    }

    setIsClosingSession(true)

    try {
      const session = await closeSession(authSession.baseUrl, authSession.token, sessionId)
      setNotice({
        tone: 'warning',
        title: 'Session closed',
        description: `${session.programName} has been closed successfully.`,
      })
      await refreshDashboard()
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Unable to close session',
        description:
          error instanceof Error ? error.message : 'Please try again in a moment.',
      })
    } finally {
      setIsClosingSession(false)
    }
  }

  async function handleManualApproval(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!authSession || !activeSession) {
      return
    }

    setIsApproving(true)

    try {
      const result = await manualApproveAttendance(
        authSession.baseUrl,
        authSession.token,
        activeSession.id,
        {
          ...manualForm,
          attemptId: selectedReviewAttemptId || undefined,
        },
      )

      setManualForm({
        displayName: '',
        notes: '',
      })
      setSelectedReviewAttemptId('')
      setNotice({
        tone: result.status === 'already_marked' ? 'warning' : 'success',
        title:
          result.status === 'already_marked'
            ? 'Attendance already recorded'
            : 'Attendance approved',
        description:
          result.member?.aagcNumber && result.member?.name
            ? `${result.member.name} (${result.member.aagcNumber})`
            : result.message,
      })
      await refreshDashboard(activeSession.id)
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Approval failed',
        description:
          error instanceof Error ? error.message : 'Please try again in a moment.',
      })
    } finally {
      setIsApproving(false)
    }
  }

  function handleSelectReviewAttempt(attemptId: string): void {
    const attempt = reviewQueue.find((item) => item.id === attemptId)
    if (!attempt) {
      return
    }

    setSelectedReviewAttemptId(attempt.id)
    setManualForm({
      displayName: attempt.matchedMember?.name ?? '',
      notes: attempt.notes ?? '',
    })
  }

  function handleClearSelectedReviewAttempt(): void {
    setSelectedReviewAttemptId('')
    setManualForm({
      displayName: '',
      notes: '',
    })
  }

  async function handleMarkAttendanceByNumber(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    if (!authSession || !activeSession) {
      return
    }

    setIsMarkingByNumber(true)

    try {
      const result = await markAttendanceByNumber(
        authSession.baseUrl,
        authSession.token,
        activeSession.id,
        aagcForm,
      )

      setAagcForm({ aagcNumber: '' })
      setNotice({
        tone: result.status === 'already_marked' ? 'warning' : 'success',
        title:
          result.status === 'already_marked'
            ? 'Already marked'
            : 'Attendance recorded by AAGC number',
        description:
          result.member?.aagcNumber && result.member?.name
            ? `${result.member.name} (${result.member.aagcNumber})`
            : result.message,
      })
      await refreshDashboard(activeSession.id)
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'AAGC number check-in failed',
        description:
          error instanceof Error ? error.message : 'Please try again in a moment.',
      })
    } finally {
      setIsMarkingByNumber(false)
    }
  }

  async function handleExport(sessionId: string): Promise<void> {
    if (!authSession) {
      return
    }

    setExportingSessionId(sessionId)

    try {
      const { blob, fileName } = await exportSessionCsv(
        authSession.baseUrl,
        authSession.token,
        sessionId,
      )

      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)

      setNotice({
        tone: 'success',
        title: 'CSV export ready',
        description: `${fileName} has been downloaded to this device.`,
      })
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Export failed',
        description:
          error instanceof Error ? error.message : 'Please try again in a moment.',
      })
    } finally {
      setExportingSessionId(null)
    }
  }

  async function handleCreateDepartment(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!authSession) {
      return
    }

    setIsCreatingDepartment(true)

    try {
      const department = await createDepartment(authSession.baseUrl, authSession.token, {
        name: departmentForm.name,
      })

      setDepartmentForm({ name: '' })
      const nextDepartments = await refreshDepartments()
      setMemberForm((currentForm) => ({
        ...currentForm,
        departmentId: department.id || nextDepartments[0]?.id || '',
      }))
      setNotice({
        tone: 'success',
        title: 'Department added',
        description: `${department.name} is now available for member registration.`,
      })
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Unable to add department',
        description:
          error instanceof Error ? error.message : 'Please try again in a moment.',
      })
    } finally {
      setIsCreatingDepartment(false)
    }
  }

  async function handleCreateMember(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!authSession) {
      return
    }

    setIsCreatingMember(true)

    try {
      const member = await createMember(authSession.baseUrl, authSession.token, memberForm)
      setMemberForm((currentForm) => ({
        ...currentForm,
        name: '',
        phone: '',
        email: '',
      }))
      setMemberFilters({
        search: '',
        departmentId: '',
      })
      setActiveView('members')
      setNotice({
        tone: 'success',
        title: 'Member created',
        description: `${member.name} now appears in the registry as ${member.aagcNumber} and is ready for fingerprint enrollment.`,
      })
      await refreshMembers(member.id)
      await refreshDepartments()
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Unable to create member',
        description:
          error instanceof Error ? error.message : 'Please try again in a moment.',
      })
    } finally {
      setIsCreatingMember(false)
    }
  }

  function handleMemberSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    void refreshMembers()
  }

  async function handleSelectMember(memberId: string): Promise<void> {
    setSelectedMemberId(memberId)
    await refreshSelectedMemberBiometrics(memberId)
  }

  async function handleCopyMemberId(): Promise<void> {
    const memberId = selectedMemberId
    if (!memberId) {
      return
    }

    try {
      await navigator.clipboard.writeText(memberId)
      setNotice({
        tone: 'success',
        title: 'Member ID copied',
        description: 'You can now paste it into ScannerBridge if needed.',
      })
    } catch {
      setNotice({
        tone: 'warning',
        title: 'Copy not supported',
        description: 'Please copy the member ID manually from the enrollment panel.',
      })
    }
  }

  const selectedMember =
    members.find((member) => member.id === selectedMemberId) ?? null
  const selectedReviewAttempt =
    reviewQueue.find((attempt) => attempt.id === selectedReviewAttemptId) ?? null

  if (!authSession) {
    return (
      <LoginScreen
        operatorName={loginForm.operatorName}
        password={loginForm.password}
        isSubmitting={isLoggingIn}
        errorMessage={loginError}
        onOperatorNameChange={(value) =>
          setLoginForm((currentForm) => ({ ...currentForm, operatorName: value }))
        }
        onPasswordChange={(value) =>
          setLoginForm((currentForm) => ({ ...currentForm, password: value }))
        }
        onSubmit={handleLogin}
      />
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,248,232,0.85),_rgba(255,255,255,0.96)_42%),linear-gradient(180deg,_#fffdf8_0%,_#ffffff_100%)] px-3 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <header className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white px-4 py-5 shadow-[0_32px_80px_-46px_rgba(15,23,42,0.48)] sm:rounded-[2.2rem] sm:px-6 sm:py-6 lg:px-8">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_70%)]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-5">
              <ChurchLogo />
              <div className="space-y-3">
                <p className="max-w-3xl text-sm leading-7 text-slate-600">
                  A beautiful white operations dashboard for service attendance,
                  built around your current backend, scanner terminal, and export flow.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400 sm:gap-3 sm:text-xs sm:tracking-[0.25em]">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">
                    Operator {authSession.operatorName}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">
                    Last refresh {formatTimestamp(lastUpdatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                type="button"
                onClick={() => void refreshDashboard()}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh Dashboard'}
              </button>
              <button
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-white transition hover:bg-slate-800"
                type="button"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>

          {notice ? (
            <div
              className={`relative mt-6 rounded-[1.4rem] border px-5 py-4 ${getNoticeClasses(
                notice.tone,
              )}`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em]">
                {notice.title}
              </p>
              <p className="mt-1 text-sm leading-6">{notice.description}</p>
            </div>
          ) : null}
        </header>

        <div className="flex justify-start">
          <DashboardTabs activeView={activeView} onChange={setActiveView} />
        </div>

        {activeView === 'attendance' ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <MetricCard
                label="Active Service"
                value={activeSession ? activeSession.programName : 'None'}
                hint={
                  activeSession
                    ? `Started by ${activeSession.startedBy}`
                    : 'Open a service window to begin scanner attendance.'
                }
              />
              <MetricCard
                label="Live Attendance"
                value={String(activeEvents.length)}
                hint="Real-time count in the active session"
              />
              <MetricCard
                label="AAGC Number"
                value={String(liveNumberCount)}
                hint="Check-ins recorded by typed member number"
              />
              <MetricCard
                label="Manual Approvals"
                value={String(liveManualCount)}
                hint="Approvals handled from the admin dashboard"
              />
              <MetricCard
                label="Review Queue"
                value={String(pendingReviewCount)}
                hint="Pending failed fingerprint scans awaiting review"
              />
              <MetricCard
                label="All Records"
                value={String(totalEvents)}
                hint="Events across recent attendance sessions"
              />
            </section>

            <div className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <SessionSummaryCard
                  session={activeSession}
                  liveCount={activeEvents.length}
                  scannerCount={liveScannerCount}
                  numberCount={liveNumberCount}
                  adminCount={liveManualCount}
                  onRefresh={() => void refreshDashboard()}
                  onCloseSession={(sessionId) => void handleCloseSession(sessionId)}
                  onExport={(sessionId) => void handleExport(sessionId)}
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
                      ? 'This panel updates automatically while the session is active.'
                      : 'Start a session to see incoming scanner and manual attendance entries.'
                  }
                  events={activeEvents}
                  emptyTitle="No attendance has been recorded yet"
                  emptyDescription="Once the scanner terminal starts marking attendance, the live feed will appear here."
                />

                <SessionHistoryTable
                  sessions={sessions}
                  selectedSessionId={selectedSession?.id ?? ''}
                  onSelectSession={(sessionId) => {
                    setSelectedSessionId(sessionId)
                    void refreshDashboard(sessionId)
                  }}
                  onExport={(sessionId) => void handleExport(sessionId)}
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
                      ? 'Use the archive above to inspect another attendance session.'
                      : 'Select a session from the archive to inspect its full event list.'
                  }
                  events={selectedSessionEvents}
                  emptyTitle="No attendance records for this session"
                  emptyDescription="When this session receives scanner or manual attendance, the detailed records will appear here."
                />
              </div>

              <aside className="space-y-6">
                <SessionStartForm
                  programName={startForm.programName}
                  notes={startForm.notes}
                  isSubmitting={isStartingSession}
                  hasActiveSession={Boolean(activeSession)}
                  onProgramNameChange={(value) =>
                    setStartForm((currentForm) => ({ ...currentForm, programName: value }))
                  }
                  onNotesChange={(value) =>
                    setStartForm((currentForm) => ({ ...currentForm, notes: value }))
                  }
                  onSubmit={handleStartSession}
                />

                <AagcNumberCheckInCard
                  hasActiveSession={Boolean(activeSession)}
                  aagcNumber={aagcForm.aagcNumber}
                  isSubmitting={isMarkingByNumber}
                  onAagcNumberChange={(value) => setAagcForm({ aagcNumber: value })}
                  onSubmit={handleMarkAttendanceByNumber}
                />

                <ReviewQueueCard
                  attempts={reviewQueue}
                  selectedAttemptId={selectedReviewAttemptId}
                  isRefreshing={isRefreshingReviewQueue}
                  onRefresh={() => void refreshReviewQueue()}
                  onSelectAttempt={handleSelectReviewAttempt}
                />

                <ManualApprovalCard
                  hasActiveSession={Boolean(activeSession)}
                  displayName={manualForm.displayName}
                  notes={manualForm.notes}
                  isSubmitting={isApproving}
                  selectedAttempt={selectedReviewAttempt}
                  onDisplayNameChange={(value) =>
                    setManualForm((currentForm) => ({ ...currentForm, displayName: value }))
                  }
                  onNotesChange={(value) =>
                    setManualForm((currentForm) => ({ ...currentForm, notes: value }))
                  }
                  onClearSelectedAttempt={handleClearSelectedReviewAttempt}
                  onSubmit={handleManualApproval}
                />

                <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Scanner Coordination
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                    Operational guidance
                  </h3>
                  <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">1. Open the session here</p>
                      <p className="mt-1">
                        The scanner terminal only loads candidates when an active session exists.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">2. Keep ScannerBridge separate</p>
                      <p className="mt-1">
                        Let the Windows terminal handle fingerprint capture while this web app
                        stays focused on operations and reporting.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">3. Use manual approval sparingly</p>
                      <p className="mt-1">
                        Reserve manual approval for guests or true exceptions. Use the
                        AAGC number card when a member knows their church number.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">4. Clear the review queue</p>
                      <p className="mt-1">
                        When a fingerprint scan fails, select it from the no-match queue
                        and approve it intentionally so unresolved cases do not pile up.
                      </p>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Departments"
                value={String(departments.length)}
                hint="Available groups for member registration"
              />
              <MetricCard
                label="Visible Members"
                value={String(members.length)}
                hint="Current list after applying search and filters"
              />
              <MetricCard
                label="Fully Enrolled"
                value={String(enrolledMembersCount)}
                hint="Members with two enrolled fingerprint templates"
              />
              <MetricCard
                label="Pending Enrollment"
                value={String(pendingMembersCount)}
                hint="Members who still need one or more fingerprints"
              />
            </section>

            <div className="grid gap-6 2xl:grid-cols-[0.92fr_1.08fr]">
              <aside className="space-y-6">
                <DepartmentManagerCard
                  departments={departments}
                  departmentName={departmentForm.name}
                  isSubmitting={isCreatingDepartment}
                  onDepartmentNameChange={(value) =>
                    setDepartmentForm({ name: value })
                  }
                  onSubmit={handleCreateDepartment}
                />

                <MemberCreateForm
                  departments={departments}
                  form={memberForm}
                  isSubmitting={isCreatingMember}
                  onChange={(field, value) =>
                    setMemberForm((currentForm) => ({ ...currentForm, [field]: value }))
                  }
                  onSubmit={handleCreateMember}
                />
              </aside>

              <div className="space-y-6">
                <MemberListTable
                  members={members}
                  departments={departments}
                  selectedMemberId={selectedMemberId}
                  search={memberFilters.search}
                  departmentFilter={memberFilters.departmentId}
                  isRefreshing={isRefreshingMembers}
                  onSearchChange={(value) =>
                    setMemberFilters((currentFilters) => ({
                      ...currentFilters,
                      search: value,
                    }))
                  }
                  onDepartmentFilterChange={(value) =>
                    setMemberFilters((currentFilters) => ({
                      ...currentFilters,
                      departmentId: value,
                    }))
                  }
                  onSubmitSearch={handleMemberSearch}
                  onRefresh={() => void refreshMembers()}
                  onSelectMember={(memberId) => void handleSelectMember(memberId)}
                />

                <EnrollmentGuideCard
                  member={selectedMember}
                  biometrics={selectedMemberBiometrics}
                  isRefreshing={isRefreshingBiometrics}
                  onRefresh={() => void refreshSelectedMemberBiometrics()}
                  onCopyMemberId={() => void handleCopyMemberId()}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default App
