interface JsonRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  token?: string
  body?: unknown
}

export class ApiError extends Error {
  readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function buildUrl(baseUrl: string, path: string): string {
  return `${baseUrl.trim().replace(/\/+$/, '')}${path}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (isRecord(payload) && typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  return fallback
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: JsonRequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(baseUrl, path), {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError(
      readErrorMessage(payload, `Request failed with status ${response.status}.`),
      response.status,
    )
  }

  return payload as T
}

export async function requestBlob(
  baseUrl: string,
  path: string,
  token: string,
): Promise<{ blob: Blob; fileName: string }> {
  const response = await fetch(buildUrl(baseUrl, path), {
    method: 'GET',
    headers: {
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const payload = await parseResponse(response)
    throw new ApiError(
      readErrorMessage(payload, `Request failed with status ${response.status}.`),
      response.status,
    )
  }

  const disposition = response.headers.get('content-disposition') ?? ''
  const match = disposition.match(/filename="?([^"]+)"?/i)

  return {
    blob: await response.blob(),
    fileName: match?.[1] ?? 'attendance-export.csv',
  }
}
