import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface QrCheckinPageProps {
  apiBaseUrl: string
  onOpenAdmin: () => void
}

export function QrCheckinPage({ apiBaseUrl, onOpenAdmin }: QrCheckinPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(null)
  const [aagc, setAagc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get('token')
    setToken(t)
  }, [location.search])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!token) return
    setIsSubmitting(true)
    setResultMessage(null)

    try {
      const resp = await fetch(`${apiBaseUrl}/api/attendance/qr-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, aagcNumber: aagc }),
      })

      const data = await resp.json()
      if (!resp.ok) {
        const msg = data?.message ?? 'Unable to check in right now.'
        setResultMessage(msg)
        toast.error('Check-in failed', { description: msg })
      } else {
        setResultMessage(data?.message ?? 'Check-in successful')
        toast.success('Check-in', { description: data?.message ?? 'Present' })
      }
    } catch (error) {
      setResultMessage('Network error')
      toast.error('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">QR Check-in</h1>
          <button
            onClick={() => onOpenAdmin()}
            className="rounded-lg border px-3 py-1 text-sm"
          >
            Open Admin
          </button>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          {!token ? (
            <p className="text-sm text-slate-600">No QR token found in the URL.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Your AAGC number</span>
                <input
                  className="mt-2 w-full rounded-lg border px-3 py-2"
                  value={aagc}
                  onChange={(e) => setAagc(e.target.value)}
                  placeholder="AAGC1 or 1"
                />
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  {isSubmitting ? 'Checking in...' : 'Check In'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="rounded-2xl border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>

              {resultMessage ? <p className="text-sm text-slate-700">{resultMessage}</p> : null}
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

export default QrCheckinPage
