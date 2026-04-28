import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ApiError } from '../api/http'
import { listPublicDepartments, registerPublicMember } from '../api/publicApi'
import { ChurchLogo } from '../components/ChurchLogo'
import type { DepartmentRecord, MemberSummary } from '../types/dashboard'

interface PublicRegistrationPageProps {
  apiBaseUrl: string
  onOpenAdmin: () => void
}

function readableError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function PublicRegistrationPage({
  apiBaseUrl
}: PublicRegistrationPageProps) {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true)
  const [departmentLoadError, setDepartmentLoadError] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [registeredMember, setRegisteredMember] = useState<MemberSummary | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    departmentId: '',
  })

  async function loadDepartments(): Promise<void> {
    setIsLoadingDepartments(true)
    setDepartmentLoadError('')

    try {
      const records = await listPublicDepartments(apiBaseUrl)
      setDepartments(records)
      setForm((currentForm) => ({
        ...currentForm,
        departmentId: currentForm.departmentId || records[0]?.id || '',
      }))
    } catch (error) {
      setDepartmentLoadError(
        readableError(error, 'Unable to load departments right now.'),
      )
    } finally {
      setIsLoadingDepartments(false)
    }
  }

  useEffect(() => {
    void loadDepartments()
  }, [apiBaseUrl])

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setSubmitError('')
    setRegisteredMember(null)

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      departmentId: form.departmentId.trim(),
    }

    if (!payload.name || !payload.phone || !payload.email || !payload.departmentId) {
      setSubmitError('Please complete all fields before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      const member = await registerPublicMember(apiBaseUrl, payload)
      setRegisteredMember(member)
      setForm((currentForm) => ({
        ...currentForm,
        name: '',
        phone: '',
        email: '',
      }))
      toast.success('Registration successful', {
        description: `${member.name} is now registered as ${member.aagcNumber}.`,
      })
    } catch (error) {
      setSubmitError(
        readableError(error, 'Unable to complete registration right now.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCopyAagcNumber(): Promise<void> {
    if (!registeredMember?.aagcNumber) {
      return
    }

    try {
      await navigator.clipboard.writeText(registeredMember.aagcNumber)
      toast.success('AAGC number copied', {
        description: `${registeredMember.aagcNumber} has been copied to clipboard.`,
      })
    } catch {
      toast.error('Unable to copy automatically', {
        description: 'Please copy the number manually from the screen.',
      })
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,248,232,0.9),_rgba(255,255,255,1)_42%),linear-gradient(180deg,_#fffdf8_0%,_#ffffff_100%)] px-4 py-6 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_30px_80px_-45px_rgba(148,163,184,0.85)] sm:rounded-[2rem] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_68%)]" />
          <div className="relative flex items-start justify-between gap-3">
            <ChurchLogo />
          </div>

          <div className="relative mt-8 max-w-2xl space-y-5 sm:mt-10 sm:space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
                Member Self Registration
              </p>
              <h2 className="font-['Baskerville','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-3xl leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Register once and receive your AAGC number instantly.
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-600">
                Complete the form with your contact details and department. Once
                submitted, your AAGC number appears immediately for use during
                service attendance check-ins.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Fast Process
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  A simple form with instant registration response.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">
                  Unique Number
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Every member receives a unique AAGC identity number.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">
                  Attendance Ready
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your number is ready to use for check-in immediately.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] sm:rounded-[2rem] sm:p-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Registration Form
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Join the AAGC member register
            </h3>
            <p className="text-sm leading-6 text-slate-500">
              Fill in your details exactly as you want them saved for attendance and
              future communication.
            </p>
          </div>

          {registeredMember ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Registration Successful
              </p>
              <p className="mt-2 text-sm text-emerald-900">
                {registeredMember.name}, your AAGC number is:
              </p>
              <p className="mt-2 rounded-xl bg-white px-3 py-2 font-mono text-xl font-bold tracking-wider text-slate-900">
                {registeredMember.aagcNumber}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopyAagcNumber()}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold tracking-[0.18em] text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-800"
                >
                  COPY NUMBER
                </button>
                <button
                  type="button"
                  onClick={() => setRegisteredMember(null)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold tracking-[0.18em] text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                >
                  REGISTER ANOTHER
                </button>
              </div>
            </div>
          ) : null}

          {departmentLoadError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{departmentLoadError}</p>
              <button
                type="button"
                onClick={() => void loadDepartments()}
                className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-semibold tracking-[0.16em] text-red-700 transition hover:border-red-400"
              >
                RETRY
              </button>
            </div>
          ) : null}

          <form className="mt-8 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Full Name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                value={form.name}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, name: event.target.value }))
                }
                placeholder="Enter full name"
                autoComplete="name"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Phone Number</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                value={form.phone}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, phone: event.target.value }))
                }
                placeholder="Enter phone number"
                autoComplete="tel"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Email Address</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, email: event.target.value }))
                }
                placeholder="Enter email address"
                autoComplete="email"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Department</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                value={form.departmentId}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    departmentId: event.target.value,
                  }))
                }
                disabled={isLoadingDepartments || departments.length === 0}
              >
                {isLoadingDepartments ? (
                  <option value="">Loading departments...</option>
                ) : (
                  <>
                    <option value="">Select your department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </label>

            {submitError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            <button
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold tracking-[0.2em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingDepartments ||
                departments.length === 0 ||
                !form.name.trim() ||
                !form.phone.trim() ||
                !form.email.trim() ||
                !form.departmentId.trim()
              }
            >
              {isSubmitting ? 'REGISTERING...' : 'COMPLETE REGISTRATION'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
