import type { FormEvent } from 'react'

import { ChurchLogo } from './ChurchLogo'

interface LoginScreenProps {
  operatorName: string
  password: string
  isSubmitting: boolean
  errorMessage: string
  onOperatorNameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function LoginScreen({
  operatorName,
  password,
  isSubmitting,
  errorMessage,
  onOperatorNameChange,
  onPasswordChange,
  onSubmit,
}: LoginScreenProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,248,232,0.9),_rgba(255,255,255,1)_42%),linear-gradient(180deg,_#fffdf8_0%,_#ffffff_100%)] px-4 py-6 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_30px_80px_-45px_rgba(148,163,184,0.85)] sm:rounded-[2rem] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_68%)]" />
          <ChurchLogo />
          <div className="relative mt-8 max-w-2xl space-y-5 sm:mt-10 sm:space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
                White, calm, and operator-ready
              </p>
              <h2 className="font-['Baskerville','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-3xl leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Run attendance from one clean command desk.
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-600">
                Sign in to start or close services, monitor live check-ins from the
                fingerprint terminal, export records, and manually approve guests or
                no-match cases when needed.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Live Control
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Start sessions and see who is arriving in real time.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">
                  Smart Records
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Review history, download CSV reports, and track attendance sources.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">
                  Exception Desk
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Manually approve guests while the scanner terminal stays dedicated.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] sm:rounded-[2rem] sm:p-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Admin Sign In
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Open the attendance dashboard
            </h3>
            <p className="text-sm leading-6 text-slate-500">
              Use the existing backend admin password. The session token stays in
              <code className="mx-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                sessionStorage
              </code>
              so it clears when the browser session ends.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Operator Name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                value={operatorName}
                onChange={(event) => onOperatorNameChange(event.target.value)}
                placeholder="Admin Operator"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Admin Password</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="Enter admin password"
              />
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold tracking-[0.2em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
              disabled={isSubmitting || !password.trim()}
            >
              {isSubmitting ? 'SIGNING IN...' : 'ENTER DASHBOARD'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
