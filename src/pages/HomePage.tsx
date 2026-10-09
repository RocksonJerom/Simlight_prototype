import { Link } from 'react-router-dom'
import { PublicLayout } from '../components/layout/PublicLayout'
import { useAuth } from '../context/AuthContext'

export function HomePage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Decision-Driven Business Simulations • Capsim Inspired
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Real Decisions. Real Outcomes.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent block mt-2">
              Playable Business Strategy.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A clean, minimal platform where students step into the executive cockpit, manage working capital, and navigate market consequences — not a static Q&A exam.
          </p>

          {/* Role Access Gateways */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-6 text-left">
            {/* Student Card */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🎓</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Student Workflow
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Student Access</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Sign in with your registered university email to view assigned simulations, make round decisions, and view your performance report.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Link
                  to={isAuthenticated && user?.role === 'learner' ? '/learn' : '/login'}
                  className="flex-1 text-center py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md shadow-cyan-500/20 transition cursor-pointer"
                >
                  {isAuthenticated && user?.role === 'learner' ? 'Enter Dashboard →' : 'Student Sign In →'}
                </Link>
                <Link
                  to="/register"
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  Register
                </Link>
              </div>
            </div>

            {/* Faculty Card */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🏛️</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                  Faculty Workflow
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Faculty Portal</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Create custom simulations (Manual or Genie AI), assign to student email cohorts, track participation, and customize report layouts.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Link
                  to={isAuthenticated && (user?.role === 'faculty' || user?.role === 'admin') ? '/teach' : '/login'}
                  className="flex-1 text-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  {isAuthenticated && (user?.role === 'faculty' || user?.role === 'admin') ? 'Faculty Dashboard →' : 'Faculty Sign In →'}
                </Link>
                <Link
                  to="/v2/creator"
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  Architect Sim
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Practice Flight Direct Link */}
          <div className="pt-2">
            <Link
              to="/v2/play/v2-supply-chain-crisis"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition"
            >
              <span>⚡ Try Sandbox Flight: Supply Chain Crisis Simulator</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Streamlined Core Flow: 4 Steps */}
      <section className="border-t border-slate-850 bg-slate-900/40 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 block">
              Clear & Distraction-Free Flow
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              From Scenario to Executive Performance
            </h2>
            <p className="text-xs text-slate-400">
              The entire simulation journey is structured around four focused stages:
            </p>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="w-8 h-8 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-sm">
                1
              </span>
              <h3 className="font-bold text-white text-sm">Situation Briefing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-world operating context with active financial and capacity variables.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="w-8 h-8 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-sm">
                2
              </span>
              <h3 className="font-bold text-white text-sm">Decision Cockpit</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adjust capacity sliders, allocate capital budgets, and choose strategic actions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="w-8 h-8 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-sm">
                3
              </span>
              <h3 className="font-bold text-white text-sm">Consequence Feedback</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Experience instant trade-offs; subsequent rounds adapt dynamically to choices made.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="w-8 h-8 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-sm">
                4
              </span>
              <h3 className="font-bold text-white text-sm">Automated Reports</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scores, KPI shifts, decision audit trail, and behavioral playing style insights.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
