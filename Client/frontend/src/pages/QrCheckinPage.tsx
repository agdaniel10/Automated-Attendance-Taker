import { useState } from 'react'
import { useLocation } from 'react-router-dom'

interface QrCheckinPageProps {
  apiBaseUrl: string
}

function ThumbsUpAnimation() {
  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.15) rotate(5deg); opacity: 1; }
          70% { transform: scale(0.95) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes ringPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .thumb-wrap {
          animation: bounceIn 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards,
                     float 2.5s ease-in-out 0.6s infinite;
        }
        .spark1 { animation: sparkle 1.2s ease-in-out 0.8s infinite; }
        .spark2 { animation: sparkle 1.2s ease-in-out 1.1s infinite; }
        .spark3 { animation: sparkle 1.2s ease-in-out 0.5s infinite; }
        .ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3px solid #f59e0b;
          animation: ringPulse 1.6s ease-out 0.4s infinite;
        }
      `}</style>

      <div className="ring" />

      <div className="thumb-wrap" style={{
        width: 140, height: 140,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 64,
        boxShadow: '0 8px 32px rgba(245,158,11,0.25)',
        position: 'relative',
      }}>
        👍
      </div>

      <span className="spark1" style={{ position: 'absolute', top: 8, right: 12, fontSize: 18 }}>✨</span>
      <span className="spark2" style={{ position: 'absolute', top: 20, left: 8, fontSize: 14 }}>⭐</span>
      <span className="spark3" style={{ position: 'absolute', bottom: 14, right: 8, fontSize: 16 }}>✨</span>
    </div>
  )
}

function SuccessScreen({ name }: { name: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .success-text { animation: fadeSlideUp 0.5s ease forwards; }
        .success-text-1 { animation-delay: 0.6s; opacity: 0; }
        .success-text-2 { animation-delay: 0.85s; opacity: 0; }
        .success-text-3 { animation-delay: 1.1s; opacity: 0; }
        @keyframes confettiDrop {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
        }
        .confetti span {
          position: absolute;
          font-size: 18px;
          animation: confettiDrop 1.8s ease-in forwards;
        }
      `}</style>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div className="confetti" style={{ position: 'absolute', top: 0, left: '50%', width: 0 }}>
          <span style={{ left: -60, animationDelay: '0.7s' }}>🎉</span>
          <span style={{ left: 40, animationDelay: '0.9s' }}>🎊</span>
          <span style={{ left: -30, animationDelay: '1.1s' }}>✨</span>
          <span style={{ left: 10, animationDelay: '0.8s' }}>🌟</span>
        </div>
        <ThumbsUpAnimation />
      </div>

      <div className="success-text success-text-1" style={{ marginTop: '1.5rem' }}>
        <p style={{
          fontSize: 22,
          fontWeight: 600,
          color: '#0f172a',
          margin: 0,
          lineHeight: 1.3,
        }}>
          {name ? `${name}, welcome to church! 🙌` : 'Welcome to church! 🙌'}
        </p>
      </div>

      <div className="success-text success-text-2" style={{ marginTop: '0.75rem' }}>
        <p style={{
          fontSize: 15,
          color: '#64748b',
          margin: 0,
          lineHeight: 1.6,
          maxWidth: 280,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Enjoy your time in the presence of the Lord ✝️
        </p>
      </div>

      <div className="success-text success-text-3" style={{ marginTop: '1.25rem' }}>
        <span style={{
          display: 'inline-block',
          background: '#f0fdf4',
          color: '#16a34a',
          border: '1px solid #bbf7d0',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 500,
          padding: '6px 16px',
        }}>
          ✓ Attendance recorded
        </span>
      </div>
    </div>
  )
}

export function QrCheckinPage({ apiBaseUrl }: QrCheckinPageProps) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const token = params.get('token') ?? ''

  const [aagc, setAagc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successName, setSuccessName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!token || !aagc.trim()) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const resp = await fetch(`${apiBaseUrl}/api/public/qr-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, aagcNumber: aagc.trim() }),
      })

      const data = await resp.json()

      if (!resp.ok) {
        setErrorMessage(data?.message ?? 'Unable to check in right now. Please try again.')
      } else {
        const name = data?.member?.name ?? data?.name ?? ''
        setSuccessName(name)
      }
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{
      minHeight: '100dvh',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#ffffff',
        borderRadius: 24,
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 60px -20px rgba(15,23,42,0.15)',
        overflow: 'hidden',
      }}>
        <div style={{
          background: '#0f172a',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>⛪</div>
            <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>
              Church Attendance
            </span>
          </div>
        </div>

        <div style={{ padding: '2rem 1.5rem' }}>
          {successName !== null ? (
            <SuccessScreen name={successName} />
          ) : !token ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: 48, marginBottom: '1rem' }}>🔗</div>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                No QR token found. Please scan the QR code again.
              </p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: 40, marginBottom: '0.75rem' }}>🙏</div>
                <h1 style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#0f172a',
                  margin: '0 0 6px',
                }}>
                  Check in to service
                </h1>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                  Enter your AAGC number to mark your attendance
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#475569',
                    marginBottom: 6,
                  }}>
                    AAGC number
                  </label>
                  <input
                    type="text"
                    value={aagc}
                    onChange={(e) => { setAagc(e.target.value); setErrorMessage(null) }}
                    placeholder="e.g. AAGC1 or 1"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: errorMessage ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#f8fafc',
                      color: '#0f172a',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#f59e0b' }}
                    onBlur={(e) => { e.target.style.borderColor = errorMessage ? '#fca5a5' : '#e2e8f0' }}
                  />
                  {errorMessage && (
                    <p style={{
                      fontSize: 13,
                      color: '#dc2626',
                      marginTop: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      ⚠️ {errorMessage}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !aagc.trim()}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: 12,
                    border: 'none',
                    background: isSubmitting || !aagc.trim() ? '#e2e8f0' : '#f59e0b',
                    color: isSubmitting || !aagc.trim() ? '#94a3b8' : '#0f172a',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: isSubmitting || !aagc.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span style={{
                        width: 16, height: 16,
                        border: '2px solid #94a3b8',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      Checking in...
                    </>
                  ) : 'Check in →'}
                </button>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default QrCheckinPage