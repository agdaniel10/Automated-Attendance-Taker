import { requestBlob, requestJson } from './http'
import type {
  AttendanceEvent,
  AttendanceMarkByNumberInput,
  AttendanceMarkResult,
  AttendanceSession,
  ManualApprovalInput,
  ManualApprovalResult,
  ReviewQueueResponse,
  ReviewQueueStatus,
  StartSessionInput,
  StartSessionResult,
} from '../types/dashboard'

export async function listSessions(
  baseUrl: string,
  token: string,
  status?: 'ACTIVE' | 'CLOSED',
): Promise<AttendanceSession[]> {
  const query = status ? `?status=${status}` : ''
  return requestJson<AttendanceSession[]>(baseUrl, `/api/attendance/sessions${query}`, {
    token,
  })
}

export async function startSession(
  baseUrl: string,
  token: string,
  payload: StartSessionInput,
): Promise<StartSessionResult> {
  return requestJson<StartSessionResult>(baseUrl, '/api/attendance/sessions', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function closeSession(
  baseUrl: string,
  token: string,
  sessionId: string,
): Promise<AttendanceSession> {
  return requestJson<AttendanceSession>(
    baseUrl,
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/close`,
    {
      method: 'POST',
      token,
      body: {},
    },
  )
}

export async function listSessionEvents(
  baseUrl: string,
  token: string,
  sessionId: string,
): Promise<AttendanceEvent[]> {
  const raw = await requestJson<any[]>(
    baseUrl,
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/events`,
    { token },
  )

  return raw.map((event) => ({
    id: event.id,
    occurredAt: event.occurredAt,
    source: event.source,
    status: event.eventStatus ?? event.status ?? '',
    message: event.message ?? null,
    memberId: event.memberId ?? null,
    aagcNumber: event.member?.aagcNumber ?? null,
    name: event.member?.name ?? event.guestName ?? 'Guest',
    department: event.member?.department?.name ?? null,
    phone: event.member?.phone ?? null,
    email: event.member?.email ?? null,
  }))
}

export async function listReviewQueue(
  baseUrl: string,
  token: string,
  sessionId: string,
  status: ReviewQueueStatus = 'PENDING',
): Promise<ReviewQueueResponse> {
  return requestJson<ReviewQueueResponse>(
    baseUrl,
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/review-queue?status=${encodeURIComponent(status)}`,
    {
      token,
    },
  )
}

export async function manualApproveAttendance(
  baseUrl: string,
  token: string,
  sessionId: string,
  payload: ManualApprovalInput,
): Promise<ManualApprovalResult> {
  return requestJson<ManualApprovalResult>(
    baseUrl,
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/admin-approve`,
    {
      method: 'POST',
      token,
      body: payload,
    },
  )
}

export async function markAttendanceByNumber(
  baseUrl: string,
  token: string,
  sessionId: string,
  payload: AttendanceMarkByNumberInput,
): Promise<AttendanceMarkResult> {
  return requestJson<AttendanceMarkResult>(
    baseUrl,
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/mark-by-number`,
    {
      method: 'POST',
      token,
      body: payload,
    },
  )
}

export async function exportSessionCsv(
  baseUrl: string,
  token: string,
  sessionId: string,
): Promise<{ blob: Blob; fileName: string }> {
  return requestBlob(
    baseUrl,
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/export.csv`,
    token,
  )
}
