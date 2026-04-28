import { requestJson } from './http'
import type {
  CreateMemberInput,
  DepartmentRecord,
  MemberSummary,
} from '../types/dashboard'

export async function listPublicDepartments(
  baseUrl: string,
): Promise<DepartmentRecord[]> {
  return requestJson<DepartmentRecord[]>(baseUrl, '/api/public/departments')
}

export async function registerPublicMember(
  baseUrl: string,
  payload: CreateMemberInput,
): Promise<MemberSummary> {
  return requestJson<MemberSummary>(baseUrl, '/api/public/register', {
    method: 'POST',
    body: payload,
  })
}
