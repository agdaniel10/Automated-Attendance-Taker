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

export interface ManualApprovalInput {
  displayName: string
  notes: string
}

export interface ManualApprovalResult {
  status: string
  attendanceEventId: string
  message: string
  occurredAt: string
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
  email: string
  biometricStatus: 'PENDING' | 'ENROLLED' | string
  enrolledFingerCount: number
  department: DepartmentSummary | null
}

export interface CreateMemberInput {
  name: string
  departmentId: string
  phone: string
  email: string
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
