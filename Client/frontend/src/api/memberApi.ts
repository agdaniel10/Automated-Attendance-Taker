import { requestJson } from './http'
import type {
  CreateDepartmentInput,
  CreateMemberInput,
  DepartmentRecord,
  MemberBiometrics,
  MemberSummary,
} from '../types/dashboard'

export async function listDepartments(
  baseUrl: string,
  token: string,
): Promise<DepartmentRecord[]> {
  return requestJson<DepartmentRecord[]>(baseUrl, '/api/departments', {
    token,
  })
}

export async function createDepartment(
  baseUrl: string,
  token: string,
  payload: CreateDepartmentInput,
): Promise<DepartmentRecord> {
  return requestJson<DepartmentRecord>(baseUrl, '/api/departments', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function listMembers(
  baseUrl: string,
  token: string,
  options: {
    search?: string
    departmentId?: string
  } = {},
): Promise<MemberSummary[]> {
  const params = new URLSearchParams()

  if (options.search?.trim()) {
    params.set('search', options.search.trim())
  }

  if (options.departmentId?.trim()) {
    params.set('departmentId', options.departmentId.trim())
  }

  const query = params.toString()

  return requestJson<MemberSummary[]>(
    baseUrl,
    `/api/members${query ? `?${query}` : ''}`,
    {
      token,
    },
  )
}

export async function createMember(
  baseUrl: string,
  token: string,
  payload: CreateMemberInput,
): Promise<MemberSummary> {
  return requestJson<MemberSummary>(baseUrl, '/api/members', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function getMemberBiometrics(
  baseUrl: string,
  token: string,
  memberId: string,
): Promise<MemberBiometrics> {
  return requestJson<MemberBiometrics>(
    baseUrl,
    `/api/members/${encodeURIComponent(memberId)}/biometrics`,
    {
      token,
    },
  )
}
