interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
  actionLabel: string
  onAction: () => void
  helperText?: string
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[]
  onDismiss: () => void
}

export function OnboardingChecklist({
  steps,
  onDismiss,
}: OnboardingChecklistProps) {
  const completedCount = steps.filter((step) => step.completed).length
  const isComplete = completedCount === steps.length

  return (
    <section className="overflow-hidden rounded-[1.9rem] border border-amber-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="border-b border-amber-100 bg-[linear-gradient(135deg,rgba(255,250,235,0.98),rgba(255,255,255,0.98))] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
              Quick Start
            </p>
            <h3 className="mt-2 font-['Baskerville','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl tracking-tight text-slate-950 sm:text-3xl">
              {isComplete
                ? 'Your dashboard is ready for real use'
                : 'Set up the attendance system in five simple steps'}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isComplete
                ? 'You have completed the main setup flow. You can hide this guide and continue using the dashboard normally.'
                : 'This onboarding watches your live dashboard data, so each step marks itself complete as you work.'}
            </p>
          </div>

          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            type="button"
            onClick={onDismiss}
          >
            {isComplete ? 'Hide Guide' : 'Dismiss Guide'}
          </button>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{completedCount} of {steps.length} steps completed</span>
            <span className="font-semibold text-slate-900">
              {Math.round((completedCount / steps.length) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-500 transition-[width] duration-500"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:px-6 xl:grid-cols-2">
        {steps.map((step, index) => (
          <article
            key={step.id}
            className={`rounded-[1.45rem] border px-4 py-4 transition ${
              step.completed
                ? 'border-emerald-200 bg-emerald-50/70'
                : 'border-slate-200 bg-slate-50/80'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${
                  step.completed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white'
                }`}
              >
                {step.completed ? 'OK' : index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold text-slate-950">{step.title}</h4>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      step.completed
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {step.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                {step.helperText ? (
                  <p className="mt-2 text-xs leading-5 text-slate-500">{step.helperText}</p>
                ) : null}
                <button
                  className={`mt-4 rounded-2xl px-4 py-2.5 text-sm font-semibold tracking-[0.08em] transition ${
                    step.completed
                      ? 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-950 text-white hover:bg-slate-800'
                  }`}
                  type="button"
                  onClick={step.onAction}
                >
                  {step.actionLabel}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
