import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QrCodeCardProps {
  qrToken: string | null
}

export function QrCodeCard({ qrToken }: QrCodeCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!qrToken) {
      setDataUrl(null)
      return
    }

    const checkinUrl = `${window.location.origin}/#/qr?token=${encodeURIComponent(qrToken)}`
    QRCode.toDataURL(checkinUrl, { margin: 2, width: 300 })
      .then((url: any) => setDataUrl(url))
      .catch(() => setDataUrl(null))
  }, [qrToken])

  if (!qrToken) {
    return null
  }

  const checkinUrl = `${window.location.origin}/#/qr?token=${encodeURIComponent(qrToken)}`

  function handleDownload() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'attendance-qr.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(checkinUrl)
      alert('Check-in link copied to clipboard')
    } catch {
      alert('Copy not supported')
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">QR Check-in</p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">Session QR Code</h3>
      <p className="mt-2 text-sm text-slate-600">Show this QR at the welcome desk for attendees to scan and check in.</p>

      <div className="mt-4 flex items-center justify-center">
        {dataUrl ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img src={dataUrl} alt="QR code" className="h-48 w-48" />
        ) : (
          <div className="h-48 w-48 bg-slate-100" />
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Download PNG
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Copy Link
        </button>
      </div>
    </section>
  )
}

export default QrCodeCard
