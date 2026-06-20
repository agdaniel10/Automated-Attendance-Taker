export type SessionStatus = 'ACTIVE' | 'CLOSED'

export interface StoredAdminSession {
  token: string
  operatorName: string
  expiresIn: string
  baseUrl: string
}

export interface AdminLoginInput {
  operatorName: string
  password: string
}

export interface AttendanceSession {
  id: string
  programName: string
  notes: string | null
  status: SessionStatus
  startedAt: string
  endedAt?: string | null
  startedBy: string
  _count?: {
    events: number
  }
}

export interface AttendanceEvent {
  id: string
  occurredAt: string
  source: 'SCANNER' | 'MEMBER_NUMBER' | 'ADMIN_APPROVAL' | string
  status: string
  message: string | null
  memberId: string | null
  aagcNumber: string | null
  name: string
  department: string | null
  phone: string | null
  email: string | null
}

export interface StartSessionInput {
  programName: string
  notes: string
}

export interface StartSessionResult {
  session: AttendanceSession
  qrToken: string
}

export interface ManualApprovalInput {
  displayName: string
  notes: string
  attemptId?: string
}

export interface ManualApprovalResult {
  status: string
  attendanceEventId?: string
  message: string
  occurredAt?: string
  reviewedAttemptId?: string | null
  member?: {
    id: string
    aagcNumber: string | null
    name: string
    department: string
  } | null
}

export interface AttendanceMarkByNumberInput {
  aagcNumber: string
}

export interface AttendanceMarkResult {
  status: string
  message: string
  attendanceEventId?: string
  markedAt?: string
  member?: {
    id: string
    aagcNumber: string | null
    name: string
    department: string
  }
}

export type ReviewQueueStatus = 'PENDING' | 'APPROVED' | 'ALL'

export interface ReviewQueueItem {
  id: string
  occurredAt: string
  outcome: 'NO_MATCH' | 'ADMIN_APPROVED' | string
  reviewStatus: 'PENDING' | 'APPROVED'
  deviceId: string | null
  confidence: number | null
  notes: string | null
  approvedBy: string | null
  approvedAt: string | null
  matchedMember: {
    id: string
    aagcNumber: string | null
    name: string
    department: string | null
    phone: string | null
    email: string | null
    biometricStatus: string
  } | null
}

export interface ReviewQueueResponse {
  session: {
    id: string
    status: SessionStatus
    programName: string
  }
  status: ReviewQueueStatus
  itemCount: number
  items: ReviewQueueItem[]
}

export interface DashboardNotice {
  tone: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
}

export interface DepartmentSummary {
  id: string
  name: string
}

export interface DepartmentRecord extends DepartmentSummary {
  _count?: {
    members: number
  }
}

export interface MemberSummary {
  id: string
  aagcNumber: string
  name: string
  phone: string
  email: string | null
  biometricStatus: 'PENDING' | 'ENROLLED' | string
  enrolledFingerCount: number
  department: DepartmentSummary | null
}

export interface CreateMemberInput {
  name: string
  departmentId: string
  phone: string
  email?: string
}

export interface CreateDepartmentInput {
  name: string
}

export interface MemberBiometricTemplate {
  id: string
  fingerPosition: string
  qualityScore: number | null
  createdAt: string
  updatedAt: string
}

export interface MemberBiometrics {
  memberId: string
  biometricStatus: 'PENDING' | 'ENROLLED' | string
  enrolledFingerCount: number
  templates: MemberBiometricTemplate[]
}
