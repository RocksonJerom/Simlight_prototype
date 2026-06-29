import { useSimulation } from '../../context/SimulationContext'

const BENEFITS = [
  'AI saves 80% content creation time',
  'Easy customization of scenarios & events',
  'Rich media support for immersive learning',
  'Flexible scoring with manual or AI-assisted modes',
  'Real-time preview before publishing',
  'Seamless assignment & tracking workflow',
]

const NEXT_STEPS = [
  { label: 'Assign to Supervisors', icon: '👤' },
  { label: 'Assigned to Participants', icon: '👥' },
  { label: 'Learners Play', icon: '🎮' },
  { label: 'AI Scores & Feedback', icon: '🤖' },
  { label: 'Reports for Faculty', icon: '📈' },
]

export function FooterPanels() {
  const { getOutputCounts } = useSimulation()
  const counts = getOutputCounts()

  const outputs = [
    { label: 'Scenario', count: counts.scenarios, icon: '📋' },
    { label: 'Phases', count: counts.phases, icon: '📑' },
    { label: 'Events', count: counts.events, icon: '⚡' },
    { label: 'Decisions', count: counts.decisions, icon: '🔀' },
    { label: 'Metrics', count: counts.metrics, icon: '📊' },
    { label: 'Assets', count: counts.assets, icon: '📎' },
    { label: 'Simulation', count: counts.simulations, icon: '✅' },
  ]

  return (
    <footer className="border-t border-slate-200 bg-white mt-8">
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
            Output — What is Created?
          </h3>
          <div className="flex flex-wrap gap-3">
            {outputs.map((o) => (
              <div
                key={o.label}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100"
              >
                <span>{o.icon}</span>
                <span className="text-lg font-bold text-slate-800">{o.count}</span>
                <span className="text-xs text-slate-500">{o.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Benefits</h3>
          <ul className="space-y-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-green-500 mt-0.5">✓</span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
            Next Step — Assign & Track
          </h3>
          <div className="flex flex-wrap items-center gap-1">
            {NEXT_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center px-2 py-1">
                  <span className="text-lg">{step.icon}</span>
                  <span className="text-[10px] text-slate-500 text-center max-w-[72px] leading-tight">
                    {step.label}
                  </span>
                </div>
                {i < NEXT_STEPS.length - 1 && (
                  <span className="text-slate-300 text-xs">›</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
