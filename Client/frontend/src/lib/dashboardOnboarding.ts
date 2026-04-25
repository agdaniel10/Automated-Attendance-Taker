interface DashboardOnboardingState {
  dismissed: boolean
}

const STORAGE_KEY = 'aagc-dashboard-onboarding'

export function loadDashboardOnboardingState(): DashboardOnboardingState {
  if (typeof window === 'undefined') {
    return { dismissed: false }
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return { dismissed: false }
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<DashboardOnboardingState>
    return {
      dismissed: Boolean(parsed.dismissed),
    }
  } catch {
    return { dismissed: false }
  }
}

export function saveDashboardOnboardingState(
  state: DashboardOnboardingState,
): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
