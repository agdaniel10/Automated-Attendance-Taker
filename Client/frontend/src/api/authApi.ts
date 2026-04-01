import { requestJson } from './http'
import type { AdminLoginInput, StoredAdminSession } from '../types/dashboard'

interface LoginResponse {
  token: string
  operatorName: string
  expiresIn: string
}

export async function loginAdmin(
  baseUrl: string,
  credentials: AdminLoginInput,
): Promise<StoredAdminSession> {
  const response = await requestJson<LoginResponse>(baseUrl, '/api/admin/auth/login', {
    method: 'POST',
    body: credentials,
  })

  return {
    token: response.token,
    operatorName: response.operatorName,
    expiresIn: response.expiresIn,
    baseUrl,
  }
}
