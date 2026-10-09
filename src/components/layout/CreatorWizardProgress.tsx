import { STEPS } from '../../data/steps'
import { useSimulation } from '../../context/SimulationContext'

export function CreatorWizardProgress() {
  const { currentStep, setCurrentStep, state, generating } = useSimulation()

  const isStepEnabled = (step: number) => {
    const contentReady = state.aiGenerationComplete && state.generated !== null
    const isManual = state.meta.contentMode === 'manual'

    if (step === 1) return true
    if (step === 2) return !isManual && (generating || contentReady)
    if (step <= 3) return contentReady
    if (step <= 7) return state.generated !== null
    return false
  }

  return (
    <nav className="bg-white border-b border-slate-200 px-4 py-3 overflow-x-auto">
      <div className="w-full max-w-[min(100%,90rem)] mx-auto px-4 sm:px-6 lg:px-10 flex items-center gap-1 min-w-max">
        {STEPS.map((s, i) => {
          const enabled = isStepEnabled(s.step)
          const active = currentStep === s.step
          const completed = currentStep > s.step

          return (
            <div key={s.step} className="flex items-center">
              <button
                type="button"
                disabled={!enabled}
                onClick={() => enabled && setCurrentStep(s.step)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                  active
                    ? 'bg-slate-100 ring-2 ring-offset-1'
                    : enabled
                      ? 'hover:bg-slate-50 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'
                }`}
                style={active ? { boxShadow: `0 0 0 2px ${s.color}` } : undefined}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                    completed
                      ? 'bg-green-500 text-white'
                      : active
                        ? 'text-white'
                        : 'bg-slate-200 text-slate-600'
                  }`}
                  style={active && !completed ? { backgroundColor: s.color } : undefined}
                >
                  {completed ? '✓' : s.step}
                </span>
                <div className="hidden lg:block">
                  <p className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-600'}`}>
                    {s.label}
                  </p>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mx-1 ${completed ? 'bg-green-400' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
