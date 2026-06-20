import type { FormEvent } from 'react'
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  closeSession,
  exportSessionCsv,
  listReviewQueue,
  listSessionEvents,
  listSessions,
  manualApproveAttendance,
  markAttendanceByNumber,
  startSession,
} from './api/attendanceApi'
import { loginAdmin } from './api/authApi'
import { ApiError } from './api/http'
import {
  createDepartment,
  createMember,
  getMemberBiometrics,
  listDepartments,
  listMembers,
} from './api/memberApi'
import { DashboardShell } from './components/DashboardShell'
import type { SidebarNavigationItem } from './components/SidebarNavigation'
import { LoginScreen } from './components/LoginScreen'
import {
  clearStoredAdminSession,
  getDefaultBaseUrl,
  loadStoredAdminSession,
  saveStoredAdminSession,
} from './lib/adminSession'
import {
  loadDashboardOnboardingState,
  saveDashboardOnboardingState,
} from './lib/dashboardOnboarding'
import { AttendancePage } from './pages/AttendancePage'
import { MembersPage } from './pages/MembersPage'
import { OverviewPage } from './pages/OverviewPage'
import { PublicRegistrationPage } from './pages/PublicRegistrationPage'
import QrCheckinPage from './pages/QrCheckinPage'
import { ReportsPage } from './pages/ReportsPage'
import { ReviewQueuePage } from './pages/ReviewQueuePage'
import type {
  AttendanceEvent,
  AttendanceSession,
  DepartmentRecord,
  MemberBiometrics,
  MemberSummary,
  ReviewQueueItem,
  StoredAdminSession,
} from './types/dashboard'

type DashboardTone = 'success' | 'error' | 'info'

type TrendChartDatum = {
  label: string
  attendance: number
  fullLabel: string
}

type MemberAttendanceDatum = {
  label: string
  attendanceCount: number
  fullName: string
  aagcNumber: string | null
}

type DepartmentAttendanceDatum = {
  name: string
  value: number
  fill: string
}

type MemberFilters = {
  search: string
  departmentId: string
}

function pushToast(
  tone: DashboardTone,
  title: string,
  description?: string,
): void {
  const options = {
    description,
    duration: 4200,
  }

  if (tone === 'success') {
    toast.success(title, options)
    return
  }

  if (tone === 'error') {
    toast.error(title, options)
    return
  }

  toast(title, options)
}

function sourceLabel(source: string): string {
  if (source === 'SCANNER') {
    return 'Fingerprint scanner'
  }

  if (source === 'MEMBER_NUMBER') {
    return 'AAGC number'
  }

  if (source === 'ADMIN_APPROVAL') {
    return 'Manual approval'
  }

  return source
}

function trimProgramLabel(value: string): string {
  return value.length > 16 ? `${value.slice(0, 15)}...` : value
}

function buildTrendData(sessions: AttendanceSession[]): TrendChartDatum[] {
  return sessions
    .slice(0, 6)
    .reverse()
    .map((session) => ({
      label: trimProgramLabel(session.programName),
      attendance: session._count?.events ?? 0,
      fullLabel: `${session.programName} - ${new Date(session.startedAt).toLocaleDateString()}`,
    }))
}

function shortMemberLabel(name: string, aagcNumber: string | null): string {
  if (aagcNumber) {
    return aagcNumber
  }

  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return 'Member'
  }

  return words.slice(0, 2).join(' ')
}

function buildMemberAttendanceData(events: AttendanceEvent[]): MemberAttendanceDatum[] {
  const counts = new Map<string, MemberAttendanceDatum>()

  for (const event of events) {
    const name = event.name ?? null  // handle both field names

    // skip events with no identifiable person
    if (!event.memberId && !event.aagcNumber && !name) {
      continue
    }

    const key = event.memberId ?? event.aagcNumber ?? name!.toLowerCase()
    const existing = counts.get(key)

    if (existing) {
      existing.attendanceCount += 1
      continue
    }

    counts.set(key, {
      label: shortMemberLabel(name ?? 'Guest', event.aagcNumber ?? null),
      attendanceCount: 1,
      fullName: name ?? 'Guest',
      aagcNumber: event.aagcNumber ?? null,
    })
  }

  return [...counts.values()]
    .sort((left, right) => right.attendanceCount - left.attendanceCount)
    .slice(0, 7)
}

// function buildMemberAttendanceData(
//   events: AttendanceEvent[],
// ): MemberAttendanceDatum[] {
//   const counts = new Map<string, MemberAttendanceDatum>()

//   for (const event of events) {
//     if (!event.memberId && !event.aagcNumber) {
//       continue
//     }

//     const key = event.memberId ?? event.aagcNumber ?? event.name.toLowerCase()
//     const existing = counts.get(key)

//     if (existing) {
//       existing.attendanceCount += 1
//       continue
//     }

//     counts.set(key, {
//       label: shortMemberLabel(event.name, event.aagcNumber),
//       attendanceCount: 1,
//       fullName: event.name,
//       aagcNumber: event.aagcNumber,
//     })
//   }

//   return [...counts.values()]
//     .sort((left, right) => right.attendanceCount - left.attendanceCount)
//     .slice(0, 7)
// }

const PIE_COLORS = ['#0f172a', '#f59e0b', '#38bdf8', '#10b981', '#f97316', '#7c3aed']

function buildDepartmentAttendanceData(
  events: AttendanceEvent[],
): DepartmentAttendanceDatum[] {
  const counts = new Map<string, number>()

  for (const event of events) {
    const key = event.department?.trim() || 'No department'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const sorted = [...counts.entries()].sort((left, right) => right[1] - left[1])
  const visibleEntries = sorted.slice(0, 5)

  if (sorted.length > 5) {
    const otherTotal = sorted.slice(5).reduce((sum, [, value]) => sum + value, 0)
    visibleEntries.push(['Other departments', otherTotal])
  }

  return visibleEntries.map(([name, value], index) => ({
    name,
    value,
    fill: PIE_COLORS[index % PIE_COLORS.length],
  }))
}

function overviewIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 13.5L10.5 7L14.5 11L20 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 19H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function attendanceIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3V7M16 3V7M8 11H16M8 15H12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function membersIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.5 19C16.5 16.7909 14.4853 15 12 15C9.51472 15 7.5 16.7909 7.5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.5 18.5C19.3616 17.2506 18.5681 16.1691 17.4 15.6M4.5 18.5C4.63842 17.2506 5.43188 16.1691 6.6 15.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function reviewIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 8V12L14.5 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function reportsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 17L10.5 13.5L13 16L17 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/overview': {
    title: 'Overview',
    description:
      'See the health of church attendance at a glance with session trends, member attendance graphs, and live arrival summaries.',
  },
  '/attendance': {
    title: 'Attendance Desk',
    description:
      'Control live service sessions, accept AAGC number check-ins, monitor the live feed, and keep service-day operations moving smoothly.',
  },
  '/members': {
    title: 'Members',
    description:
      'Create new departments and members, review biometric readiness, and prepare each member for ScannerBridge fingerprint enrollment.',
  },
  '/review-queue': {
    title: 'Review Queue',
    description:
      'Resolve failed fingerprint matches carefully so no-match cases are handled with confidence instead of guesswork.',
  },
  '/reports': {
    title: 'Reports',
    description:
      'Browse recent sessions, inspect attendance event history, and export records for follow-up, reporting, or archiving.',
  },
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [authSession, setAuthSession] = useState<StoredAdminSession | null>(() =>
    loadStoredAdminSession(),
  )
  const [onboardingDismissed, setOnboardingDismissed] = useState(() =>
    loadDashboardOnboardingState().dismissed,
  )
  const [loginForm, setLoginForm] = useState(() => ({
    apiBaseUrl: loadStoredAdminSession()?.baseUrl ?? getDefaultBaseUrl(),
    operatorName: loadStoredAdminSession()?.operatorName ?? 'Admin Operator',
    password: '',
  }))
    const [qrToken, setQrToken] = useState<string | null>(null)
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [activeEvents, setActiveEvents] = useState<AttendanceEvent[]>([])
  const [selectedSessionEvents, setSelectedSessionEvents] = useState<AttendanceEvent[]>([])
  const [overviewEvents, setOverviewEvents] = useState<AttendanceEvent[]>([])
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([])
  const [selectedReviewAttemptId, setSelectedReviewAttemptId] = useState('')
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedMemberBiometrics, setSelectedMemberBiometrics] =
    useState<MemberBiometrics | null>(null)
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
  const [memberFilters, setMemberFilters] = useState<MemberFilters>({
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

  const liveSessionIdRef = useRef('')
  const seenActiveEventIdsRef = useRef(new Set<string>())
  const hasPrimedLiveFeedRef = useRef(false)
  const hasCelebratedOnboardingRef = useRef(false)

  const activeSession = sessions.find((session) => session.status === 'ACTIVE') ?? null
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ??
    activeSession ??
    sessions[0] ??
    null
  const selectedReviewAttempt =
    reviewQueue.find((attempt) => attempt.id === selectedReviewAttemptId) ?? null

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

  const onboardingSteps = [
    {
      id: 'department',
      title: 'Create at least one department',
      description:
        'Departments must exist before members can be registered properly in the church system.',
      completed: departments.length > 0,
      actionLabel: 'Go to Members',
      onAction: () => startTransition(() => navigate('/members')),
      helperText: 'Example departments: Choir, Ushering, Children, Media.',
    },
    {
      id: 'member',
      title: 'Register your first member',
      description:
        'Create the first member record so the dashboard can begin managing real people instead of an empty list.',
      completed: members.length > 0,
      actionLabel: 'Register Member',
      onAction: () => startTransition(() => navigate('/members')),
      helperText: 'Each new member receives a simple AAGC number like AAGC1.',
    },
    {
      id: 'biometric',
      title: 'Enroll fingerprints in ScannerBridge',
      description:
        'Complete fingerprint enrollment for at least one member so scanner attendance is ready to work end to end.',
      completed: enrolledMembersCount > 0,
      actionLabel: 'Open Enrollment Page',
      onAction: () => startTransition(() => navigate('/members')),
      helperText:
        'Select the member in the Members page, then continue the enrollment step in ScannerBridge.',
    },
    {
      id: 'session',
      title: 'Start your first attendance session',
      description:
        'An active service session is what allows attendance to start flowing in from the scanner or AAGC number entry.',
      completed: sessions.length > 0,
      actionLabel: 'Open Attendance Desk',
      onAction: () => startTransition(() => navigate('/attendance')),
      helperText:
        'Use program names like Sunday Service, Midweek Service, or Youth Meeting.',
    },
    {
      id: 'attendance',
      title: 'Record the first attendance event',
      description:
        'Finish the setup by marking at least one person present using the scanner, AAGC number, or manual approval.',
      completed: totalEvents > 0,
      actionLabel: 'Record Attendance',
      onAction: () => startTransition(() => navigate('/attendance')),
      helperText:
        'Once this step completes, your reports and graphs become much more useful.',
    },
  ]
  const onboardingComplete = onboardingSteps.every((step) => step.completed)
  const onboardingVisible = location.pathname === '/overview' && !onboardingDismissed

  const trendData = buildTrendData(sessions)
  const memberAttendanceData = buildMemberAttendanceData(overviewEvents)
  const departmentAttendanceData = buildDepartmentAttendanceData(overviewEvents)

  const pageMeta = PAGE_META[location.pathname] ?? PAGE_META['/overview']
  const isPublicRegistrationRoute = location.pathname === '/register'
  const isQrCheckinRoute = location.pathname.startsWith('/qr')
  console.log('pathname:', location.pathname, 'isQrCheckinRoute:', isQrCheckinRoute)
  const onboardingActionLabel =
    onboardingVisible || (!onboardingDismissed && location.pathname === '/overview')
      ? 'Hide Quick Start'
      : 'Open Quick Start'

  const navigationItems: SidebarNavigationItem[] = [
    {
      to: '/overview',
      label: 'Overview',
      description: 'Graphs, pie chart, and service highlights',
      icon: overviewIcon(),
    },
    {
      to: '/attendance',
      label: 'Attendance',
      description: 'Run live service operations',
      icon: attendanceIcon(),
    },
    {
      to: '/members',
      label: 'Members',
      description: 'Registration and biometric readiness',
      icon: membersIcon(),
    },
    {
      to: '/review-queue',
      label: 'Review Queue',
      description: 'Approve no-match fingerprint cases',
      icon: reviewIcon(),
      badge: pendingReviewCount > 0 ? pendingReviewCount : null,
    },
    {
      to: '/reports',
      label: 'Reports',
      description: 'Session archive and exports',
      icon: reportsIcon(),
    },
  ]

  function announceActiveEvents(sessionId: string | null, events: AttendanceEvent[]): void {
    if (!sessionId) {
      liveSessionIdRef.current = ''
      seenActiveEventIdsRef.current = new Set()
      hasPrimedLiveFeedRef.current = false
      return
    }

    if (liveSessionIdRef.current !== sessionId) {
      liveSessionIdRef.current = sessionId
      seenActiveEventIdsRef.current = new Set()
      hasPrimedLiveFeedRef.current = false
    }

    const currentIds = new Set(events.map((event) => event.id))

    if (!hasPrimedLiveFeedRef.current) {
      seenActiveEventIdsRef.current = currentIds
      hasPrimedLiveFeedRef.current = true
      return
    }

    const freshEvents = events.filter(
      (event) => !seenActiveEventIdsRef.current.has(event.id),
    )

    seenActiveEventIdsRef.current = currentIds

    if (freshEvents.length === 0) {
      return
    }

    if (freshEvents.length === 1) {
      const event = freshEvents[0]
      pushToast(
        'success',
        `${event.name} marked present`,
        event.aagcNumber
          ? `${event.aagcNumber} checked in by ${sourceLabel(event.source).toLowerCase()}.`
          : `${sourceLabel(event.source)} check-in recorded successfully.`,
      )
      return
    }

    pushToast(
      'success',
      `${freshEvents.length} new members marked present`,
      `${freshEvents[0].name} and others have just been added to the active attendance session.`,
    )
  }

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

      const overviewSessionIds = nextSessions.slice(0, 6).map((session) => session.id)
      const sessionIdsToLoad = Array.from(
        new Set(
          [nextActiveSession?.id, nextSelectedSessionId, ...overviewSessionIds].filter(
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
                  console.log('queue response:', queue)
                  nextReviewQueue = queue.items ?? []
                })(),
              ]
            : []),
        ],
      )

      const nextActiveEvents = nextActiveSession
        ? eventsBySession.get(nextActiveSession.id) ?? []
        : []
      const nextSelectedSessionEvents = nextSelectedSessionId
        ? eventsBySession.get(nextSelectedSessionId) ?? []
        : []
      const nextOverviewEvents = overviewSessionIds.flatMap(
        (sessionId) => eventsBySession.get(sessionId) ?? [],
      )

      setSessions(nextSessions)
      setSelectedSessionId(nextSelectedSessionId)
      setReviewQueue(nextReviewQueue)
      setSelectedReviewAttemptId((currentSelectedId) =>
        nextReviewQueue.some((attempt) => attempt.id === currentSelectedId)
          ? currentSelectedId
          : '',
      )
      setActiveEvents(nextActiveEvents)
      setSelectedSessionEvents(nextSelectedSessionEvents)
      setOverviewEvents(nextOverviewEvents)
      setLastUpdatedAt(new Date().toISOString())

      announceActiveEvents(nextActiveSession?.id ?? null, nextActiveEvents)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearStoredAdminSession()
        setAuthSession(null)
        pushToast(
          'info',
          'Session expired',
          'Please sign in again to continue managing attendance.',
        )
        return
      }

      pushToast(
        'error',
        'Dashboard refresh failed',
        error instanceof Error ? error.message : 'Unable to load attendance data.',
      )
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
      pushToast(
        'error',
        'Review queue refresh failed',
        error instanceof Error
          ? error.message
          : 'Unable to load no-match review cases right now.',
      )
    } finally {
      setIsRefreshingReviewQueue(false)
    }
  }

  async function refreshMembers(
    preferredMemberId?: string,
    filtersOverride?: MemberFilters,
  ): Promise<void> {
    if (!authSession) {
      return
    }

    setIsRefreshingMembers(true)

    try {
      const filters = filtersOverride ?? memberFilters
      const nextMembers = await listMembers(authSession.baseUrl, authSession.token, {
        search: filters.search,
        departmentId: filters.departmentId,
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
      pushToast(
        'error',
        'Member refresh failed',
        error instanceof Error ? error.message : 'Unable to load members right now.',
      )
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
      pushToast(
        'error',
        'Biometric status refresh failed',
        error instanceof Error
          ? error.message
          : 'Unable to load biometric status right now.',
      )
    } finally {
      setIsRefreshingBiometrics(false)
    }
  }

  async function handleGlobalRefresh(): Promise<void> {
    if (!authSession) {
      return
    }

    await Promise.all([
      refreshDashboard(selectedSessionId || undefined),
      refreshDepartments(),
      refreshMembers(selectedMemberId || undefined),
    ])
  }

  const runRefresh = useEffectEvent((preferredSessionId?: string) => {
    void refreshDashboard(preferredSessionId)
  })

  const runDepartmentRefresh = useEffectEvent(() => {
    void refreshDepartments()
  })

  const runMemberRefresh = useEffectEvent(
    (preferredMemberId?: string, filtersOverride?: MemberFilters) => {
      void refreshMembers(preferredMemberId, filtersOverride)
    },
  )

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
    }, 8000)

    return () => window.clearInterval(intervalId)
  }, [authSession])

  useEffect(() => {
    if (!authSession) {
      hasCelebratedOnboardingRef.current = false
      return
    }

    if (onboardingComplete && !hasCelebratedOnboardingRef.current) {
      hasCelebratedOnboardingRef.current = true
      pushToast(
        'success',
        'Dashboard onboarding completed',
        'Your departments, members, attendance flow, and first records are now in place.',
      )
      return
    }

    if (!onboardingComplete) {
      hasCelebratedOnboardingRef.current = false
    }
  }, [authSession, onboardingComplete])

  function handleDismissOnboarding(): void {
    setOnboardingDismissed(true)
    saveDashboardOnboardingState({ dismissed: true })
  }

  function handleToggleOnboarding(): void {
    if (location.pathname !== '/overview' || onboardingDismissed) {
      setOnboardingDismissed(false)
      saveDashboardOnboardingState({ dismissed: false })
      startTransition(() => navigate('/overview'))
      return
    }

    handleDismissOnboarding()
  }

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
      liveSessionIdRef.current = ''
      seenActiveEventIdsRef.current = new Set()
      hasPrimedLiveFeedRef.current = false
      pushToast(
        'success',
        'Welcome back',
        `${session.operatorName} is ready to manage attendance.`,
      )
      startTransition(() => navigate('/overview'))
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
    setOverviewEvents([])
    setReviewQueue([])
    setSelectedReviewAttemptId('')
    setDepartments([])
    setMembers([])
    setSelectedMemberId('')
    setSelectedMemberBiometrics(null)
    setLastUpdatedAt(null)
    setOnboardingDismissed(loadDashboardOnboardingState().dismissed)
    liveSessionIdRef.current = ''
    seenActiveEventIdsRef.current = new Set()
    hasPrimedLiveFeedRef.current = false
    hasCelebratedOnboardingRef.current = false
    pushToast('info', 'Signed out', 'The admin session has been cleared from this browser.')
    startTransition(() => navigate('/overview'))
  }

  async function handleStartSession(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!authSession) {
      return
    }

    setIsStartingSession(true)

    try {
        const result = await startSession(authSession.baseUrl, authSession.token, startForm)
        const session = result.session
        setQrToken(result.qrToken)
      pushToast(
        'success',
        'Session started',
        `${session.programName} is now live and ready for scanner check-ins.`,
      )
      await refreshDashboard(session.id)
      startTransition(() => navigate('/attendance'))
    } catch (error) {
      pushToast(
        'error',
        'Unable to start session',
        error instanceof Error ? error.message : 'Please try again in a moment.',
      )
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
      pushToast(
        'info',
        'Session closed',
        `${session.programName} has been closed successfully.`,
      )
      await refreshDashboard()
    } catch (error) {
      pushToast(
        'error',
        'Unable to close session',
        error instanceof Error ? error.message : 'Please try again in a moment.',
      )
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

      if (result.attendanceEventId) {
        seenActiveEventIdsRef.current.add(result.attendanceEventId)
      }

      pushToast(
        result.status === 'already_marked' ? 'info' : 'success',
        result.status === 'already_marked'
          ? 'Attendance already recorded'
          : 'Attendance approved',
        result.member?.aagcNumber && result.member?.name
          ? `${result.member.name} (${result.member.aagcNumber})`
          : result.message,
      )
      await refreshDashboard(activeSession.id)
    } catch (error) {
      pushToast(
        'error',
        'Approval failed',
        error instanceof Error ? error.message : 'Please try again in a moment.',
      )
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

      if (result.attendanceEventId) {
        seenActiveEventIdsRef.current.add(result.attendanceEventId)
      }

      pushToast(
        result.status === 'already_marked' ? 'info' : 'success',
        result.status === 'already_marked'
          ? 'Already marked'
          : 'Attendance recorded by AAGC number',
        result.member?.aagcNumber && result.member?.name
          ? `${result.member.name} (${result.member.aagcNumber})`
          : result.message,
      )
      await refreshDashboard(activeSession.id)
    } catch (error) {
      pushToast(
        'error',
        'AAGC number check-in failed',
        error instanceof Error ? error.message : 'Please try again in a moment.',
      )
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

      pushToast('success', 'CSV export ready', `${fileName} has been downloaded.`)
    } catch (error) {
      pushToast(
        'error',
        'Export failed',
        error instanceof Error ? error.message : 'Please try again in a moment.',
      )
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
      pushToast(
        'success',
        'Department added',
        `${department.name} is now available for member registration.`,
      )
    } catch (error) {
      pushToast(
        'error',
        'Unable to add department',
        error instanceof Error ? error.message : 'Please try again in a moment.',
      )
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
      const resetFilters = {
        search: '',
        departmentId: '',
      }

      setMemberForm((currentForm) => ({
        ...currentForm,
        name: '',
        phone: '',
        email: '',
      }))
      setMemberFilters(resetFilters)

      pushToast(
        'success',
        'Member created',
        `${member.name} now appears in the registry as ${member.aagcNumber}.`,
      )

      await Promise.all([
        refreshMembers(member.id, resetFilters),
        refreshDepartments(),
      ])
      startTransition(() => navigate('/members'))
    } catch (error) {
      pushToast(
        'error',
        'Unable to create member',
        error instanceof Error ? error.message : 'Please try again in a moment.',
      )
    } finally {
      setIsCreatingMember(false)
    }
  }

  function handleMemberSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    void refreshMembers(undefined, memberFilters)
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
      pushToast(
        'success',
        'Member ID copied',
        'You can now paste it into ScannerBridge if needed.',
      )
    } catch {
      pushToast(
        'info',
        'Copy not supported',
        'Please copy the member ID manually from the enrollment panel.',
      )
    }
  }

  function handleSelectSession(sessionId: string): void {
    setSelectedSessionId(sessionId)
    void refreshDashboard(sessionId)
  }

  if (isPublicRegistrationRoute) {
    return (
      <PublicRegistrationPage
        apiBaseUrl={authSession?.baseUrl ?? loginForm.apiBaseUrl}
        onOpenAdmin={() => startTransition(() => navigate('/'))}
      />
    )
  }

  // if (isQrCheckinRoute) {
  //   return (
  //     <QrCheckinPage
  //       apiBaseUrl={authSession?.baseUrl ?? loginForm.apiBaseUrl}
  //       onOpenAdmin={() => startTransition(() => navigate('/'))}
  //     />
  //   )
  // }

  if (isQrCheckinRoute) {
    return (
      <QrCheckinPage
        apiBaseUrl={import.meta.env.VITE_API_BASE_URL ?? authSession?.baseUrl ?? loginForm.apiBaseUrl}
      />
    )
  }

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
    <DashboardShell
      navigationItems={navigationItems}
      operatorName={authSession.operatorName}
      activeSessionLabel={activeSession?.programName ?? 'No active service'}
      pendingReviewCount={pendingReviewCount}
      pageTitle={pageMeta.title}
      pageDescription={pageMeta.description}
      lastUpdatedAt={lastUpdatedAt}
      isRefreshing={isRefreshing}
      onRefresh={() => void handleGlobalRefresh()}
      onboardingActionLabel={onboardingActionLabel}
      onOnboardingAction={handleToggleOnboarding}
      onLogout={handleLogout}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route
          path="/overview"
          element={
            <OverviewPage
              activeSession={activeSession}
              activeEvents={activeEvents}
              totalEvents={totalEvents}
              enrolledMembersCount={enrolledMembersCount}
              pendingMembersCount={pendingMembersCount}
              pendingReviewCount={pendingReviewCount}
              trendData={trendData}
              memberAttendanceData={memberAttendanceData}
              departmentAttendanceData={departmentAttendanceData}
              onboardingVisible={onboardingVisible}
              onboardingSteps={onboardingSteps}
              onDismissOnboarding={handleDismissOnboarding}
            />
          }
        />
        <Route
          path="/attendance"
          element={
            <AttendancePage
              activeSession={activeSession}
              activeEvents={activeEvents}
              liveScannerCount={liveScannerCount}
              liveNumberCount={liveNumberCount}
              liveManualCount={liveManualCount}
              pendingReviewCount={pendingReviewCount}
              isRefreshing={isRefreshing}
              isClosingSession={isClosingSession}
              isStartingSession={isStartingSession}
              isMarkingByNumber={isMarkingByNumber}
              exportingSessionId={exportingSessionId}
              startForm={startForm}
              aagcForm={aagcForm}
              onStartFormChange={(field, value) =>
                setStartForm((currentForm) => ({ ...currentForm, [field]: value }))
              }
              onAagcNumberChange={(value) => setAagcForm({ aagcNumber: value })}
              onStartSession={handleStartSession}
              onMarkAttendanceByNumber={handleMarkAttendanceByNumber}
              onRefresh={() => void refreshDashboard()}
              onCloseSession={(sessionId) => void handleCloseSession(sessionId)}
              onExport={(sessionId) => void handleExport(sessionId)}
                qrToken={qrToken}
            />
          }
        />
        <Route
          path="/members"
          element={
            <MembersPage
              departments={departments}
              members={members}
              selectedMemberId={selectedMemberId}
              selectedMemberBiometrics={selectedMemberBiometrics}
              isRefreshingMembers={isRefreshingMembers}
              isRefreshingBiometrics={isRefreshingBiometrics}
              isCreatingDepartment={isCreatingDepartment}
              isCreatingMember={isCreatingMember}
              departmentForm={departmentForm}
              memberForm={memberForm}
              memberFilters={memberFilters}
              enrolledMembersCount={enrolledMembersCount}
              pendingMembersCount={pendingMembersCount}
              onDepartmentNameChange={(value) => setDepartmentForm({ name: value })}
              onMemberFormChange={(field, value) =>
                setMemberForm((currentForm) => ({ ...currentForm, [field]: value }))
              }
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
              onCreateDepartment={handleCreateDepartment}
              onCreateMember={handleCreateMember}
              onSubmitSearch={handleMemberSearch}
              onRefreshMembers={() => void refreshMembers(undefined, memberFilters)}
              onSelectMember={(memberId) => void handleSelectMember(memberId)}
              onRefreshBiometrics={() => void refreshSelectedMemberBiometrics()}
              onCopyMemberId={() => void handleCopyMemberId()}
            />
          }
        />
        <Route
          path="/review-queue"
          element={
            <ReviewQueuePage
              activeSession={activeSession}
              reviewQueue={reviewQueue}
              selectedReviewAttempt={selectedReviewAttempt}
              selectedReviewAttemptId={selectedReviewAttemptId}
              manualForm={manualForm}
              isRefreshingReviewQueue={isRefreshingReviewQueue}
              isApproving={isApproving}
              onRefreshReviewQueue={() => void refreshReviewQueue()}
              onSelectReviewAttempt={handleSelectReviewAttempt}
              onClearSelectedReviewAttempt={handleClearSelectedReviewAttempt}
              onManualFormChange={(field, value) =>
                setManualForm((currentForm) => ({ ...currentForm, [field]: value }))
              }
              onSubmitApproval={handleManualApproval}
            />
          }
        />
        <Route
          path="/reports"
          element={
            <ReportsPage
              sessions={sessions}
              selectedSession={selectedSession}
              selectedSessionEvents={selectedSessionEvents}
              exportingSessionId={exportingSessionId}
              totalEvents={totalEvents}
              onSelectSession={handleSelectSession}
              onExport={(sessionId) => void handleExport(sessionId)}
            />
          }
        />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </DashboardShell>
  )
}

export default App
