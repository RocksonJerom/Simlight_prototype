import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import type { V2Simulation, RoundSimulationResult, V2Scorecard } from '../../../types/v2.js'
import { formatVariableValue, simulateWhatIf } from '../../../engine/v2Engine.js'
import { DecisionControlRenderer } from './DecisionControls.js'

interface FinalScorecardViewProps {
  simulation: V2Simulation
  history: RoundSimulationResult[]
  scorecard: V2Scorecard
  onRestart: () => void
  sessionId?: string
}

export const FinalScorecardView: React.FC<FinalScorecardViewProps> = ({
  simulation,
  history,
  scorecard,
  onRestart,
  sessionId,
}) => {
  const [activeTab, setActiveTab] = useState<'scorecard' | 'history' | 'whatif'>('scorecard')

  // What-If State
  const [whatIfRound, setWhatIfRound] = useState<number>(1)
  const [whatIfDecisions, setWhatIfDecisions] = useState<Record<string, any>>(() => {
    return history[0]?.decisions ? { ...history[0].decisions } : {}
  })
  const [whatIfResult, setWhatIfResult] = useState<{
    replayedHistory: RoundSimulationResult[]
    alternativeScorecard: V2Scorecard
  } | null>(null)

  const targetRoundObj = simulation.rounds.find((r) => r.roundNumber === whatIfRound)

  const handleSelectWhatIfRound = (rnd: number) => {
    setWhatIfRound(rnd)
    const existing = history.find((h) => h.roundNumber === rnd)
    setWhatIfDecisions(existing ? { ...existing.decisions } : {})
    setWhatIfResult(null)
  }

  const handleRunWhatIf = () => {
    const res = simulateWhatIf(simulation, history, whatIfRound, whatIfDecisions)
    setWhatIfResult(res)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
              Simulation Debrief & Performance Evaluation
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {simulation.title}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Executive Review for {simulation.companyName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {sessionId && (
              <Link
                to={`/report/${sessionId}`}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                📄 View Performance Report
              </Link>
            )}
            <span className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold text-sm">
              Strategic Posture: {scorecard.strategicArchetype}
            </span>
            <button
              type="button"
              onClick={onRestart}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Play Again
            </button>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed max-w-3xl bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          {scorecard.summary}
        </p>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('scorecard')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer ${
              activeTab === 'scorecard'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            📊 Corporate Scorecard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            📜 Decision Audit History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('whatif')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'whatif'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🔬</span>
            <span>What-If Laboratory & Replay</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SCORECARD */}
      {activeTab === 'scorecard' && (
        <div className="space-y-6">
          {/* Key Metric Performance Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md overflow-hidden">
            <h3 className="text-base font-bold text-white mb-4">
              Corporate Key Performance Indicators (KPIs)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Strategic Variable</th>
                    <th className="pb-3 font-semibold">Starting Baseline</th>
                    <th className="pb-3 font-semibold">Final Value</th>
                    <th className="pb-3 font-semibold">Net Movement</th>
                    <th className="pb-3 font-semibold">Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {scorecard.metrics.map((m) => {
                    const isPositive = m.status === 'positive'
                    const isNegative = m.status === 'negative'
                    return (
                      <tr key={m.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-3.5 font-sans font-medium text-slate-200">{m.label}</td>
                        <td className="py-3.5 text-slate-400">
                          {formatVariableValue(m.initialValue, m.unit)}
                        </td>
                        <td className="py-3.5 font-bold text-white">
                          {formatVariableValue(m.finalValue, m.unit)}
                        </td>
                        <td className="py-3.5 font-semibold">
                          <span
                            className={
                              isPositive
                                ? 'text-emerald-400'
                                : isNegative
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }
                          >
                            {m.change > 0 ? '+' : ''}
                            {formatVariableValue(m.change, m.unit)} ({m.percentChange > 0 ? '+' : ''}
                            {m.percentChange}%)
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-sans font-semibold ${
                              isPositive
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : isNegative
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isPositive ? 'Strengthened' : isNegative ? 'Compromised' : 'Preserved'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Qualitative Strengths & Trade-offs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <span>✅</span> Operational Strengths Unlocked
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {scorecard.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/90 border border-rose-900/40 rounded-2xl p-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-2">
                <span>⚠️</span> Trade-Offs Incurred
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {scorecard.tradeOffsNoted.map((to, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{to}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DECISION AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {history.map((h) => {
            const roundObj = simulation.rounds.find((r) => r.roundNumber === h.roundNumber)
            return (
              <div
                key={h.roundNumber}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-sm">
                      {h.roundNumber}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {roundObj?.title || `Round ${h.roundNumber}`}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {roundObj?.role || 'Executive Role'}
                  </span>
                </div>

                {/* Decisions Logged */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Decisions Executed:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(h.decisions).map(([k, v]) => {
                      const decDef = roundObj?.decisions.find((d) => d.id === k)
                      const displayVal =
                        typeof v === 'object'
                          ? JSON.stringify(v)
                          : String(v)
                      return (
                        <div key={k} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                          <span className="text-[11px] text-slate-400 block mb-0.5">
                            {decDef?.label || k}
                          </span>
                          <span className="font-semibold text-xs text-cyan-300 font-mono">
                            {displayVal}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Outcome Statement */}
                <div className="bg-cyan-950/30 p-3.5 rounded-xl border border-cyan-800/40 text-xs text-cyan-200">
                  <span className="font-bold text-cyan-400 mr-1">Result:</span> {h.summaryTradeOff}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB 3: WHAT-IF LABORATORY */}
      {activeTab === 'whatif' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔬</span> Counterfactual &quot;What-If&quot; Laboratory
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Management learning accelerates when you inspect alternative paths. Select any previous round, change your tactical choices, and simulate what would have happened to the company&apos;s KPIs.
              </p>
            </div>

            {/* Select round to test */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Round to Replay:
              </span>
              <div className="flex gap-2">
                {simulation.rounds.map((r) => (
                  <button
                    key={r.roundNumber}
                    type="button"
                    onClick={() => handleSelectWhatIfRound(r.roundNumber)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      whatIfRound === r.roundNumber
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Round {r.roundNumber}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive decision controls for the selected round */}
          {targetRoundObj && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="font-bold text-white text-sm">
                  Alternative Decisions for {targetRoundObj.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjust one or more choices below, then click &quot;Simulate Alternative Outcome&quot;.
                </p>
              </div>

              <div className="space-y-6">
                {targetRoundObj.decisions.map((dec) => (
                  <div key={dec.id} className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300">{dec.label}</span>
                    <DecisionControlRenderer
                      decision={dec}
                      value={whatIfDecisions[dec.id]}
                      onChange={(newVal) =>
                        setWhatIfDecisions((prev) => ({ ...prev, [dec.id]: newVal }))
                      }
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleRunWhatIf}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>⚡ Simulate Alternative Trajectory</span>
              </button>
            </div>
          )}

          {/* What-If Comparative Results */}
          {whatIfResult && (
            <div className="bg-gradient-to-br from-slate-900 to-cyan-950/60 border border-cyan-500/40 rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">
                    Comparative What-If Analysis
                  </span>
                  <h4 className="text-lg font-bold text-white mt-0.5">
                    Original Outcome vs Alternative Path
                  </h4>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-300">
                  Alternative Posture: {whatIfResult.alternativeScorecard.strategicArchetype}
                </span>
              </div>

              {/* Side by side comparison table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-sans text-[11px]">
                      <th className="pb-2">Metric</th>
                      <th className="pb-2">Original Run</th>
                      <th className="pb-2 text-cyan-400">Alternative Run</th>
                      <th className="pb-2">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {whatIfResult.alternativeScorecard.metrics.map((altM) => {
                      const origM = scorecard.metrics.find((m) => m.id === altM.id)
                      const origVal = origM?.finalValue ?? altM.initialValue
                      const diff = Math.round((altM.finalValue - origVal) * 100) / 100
                      const isBetter = altM.finalValue > origVal

                      return (
                        <tr key={altM.id}>
                          <td className="py-3 font-sans font-medium text-slate-300">{altM.label}</td>
                          <td className="py-3 text-slate-400">{formatVariableValue(origVal, altM.unit)}</td>
                          <td className="py-3 font-bold text-cyan-300">
                            {formatVariableValue(altM.finalValue, altM.unit)}
                          </td>
                          <td className="py-3 font-bold">
                            <span
                              className={
                                Math.abs(diff) < 0.01
                                  ? 'text-slate-500'
                                  : isBetter
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }
                            >
                              {diff > 0 ? '+' : ''}
                              {formatVariableValue(diff, altM.unit)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-cyan-400 block mb-1">Debrief Insight:</span>
                {whatIfResult.alternativeScorecard.summary}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
