import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { V2Simulation, RoundSimulationResult, V2Scorecard } from '../../../types/v2.js'
import { simulateRound, calculateScorecard, formatVariableValue } from '../../../engine/v2Engine.js'
import { LiveKpiGrid } from './LiveKpiGrid.js'
import { DecisionControlRenderer } from './DecisionControls.js'
import { ConsequenceModal } from './ConsequenceModal.js'
import { FinalScorecardView } from './FinalScorecardView.js'

interface V2PlayerCockpitProps {
  simulation: V2Simulation
  learnerName?: string
  sessionId?: string
  onExit?: () => void
  onComplete?: (scorecard: V2Scorecard, history: RoundSimulationResult[], currentVariables: Record<string, number>) => void
}

export const V2PlayerCockpit: React.FC<V2PlayerCockpitProps> = ({
  simulation,
  learnerName = 'Student Executive',
  sessionId,
  onExit,
  onComplete,
}) => {
  // Current Round Index (0-indexed)
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0)

  // Current Live Variable State
  const [currentVariables, setCurrentVariables] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    simulation.variables.forEach((v) => {
      init[v.id] = v.initialValue
    })
    return init
  })

  // Previous Variables for Delta Tracking
  const [previousVariables, setPreviousVariables] = useState<Record<string, number> | undefined>()

  // Decisions made in the current round
  const currentRound = simulation.rounds[currentRoundIndex]

  const [currentDecisions, setCurrentDecisions] = useState<Record<string, any>>(() => {
    const decs: Record<string, any> = {}
    currentRound?.decisions.forEach((d) => {
      if (d.type === 'select') decs[d.id] = d.options?.[0]?.id
      else if (d.type === 'slider' || d.type === 'quantity') decs[d.id] = d.defaultValue ?? d.min ?? 0
      else if (d.type === 'allocate') {
        const allocMap: Record<string, number> = {}
        d.allocateItems?.forEach((item) => {
          allocMap[item.id] = item.defaultVal ?? 0
        })
        decs[d.id] = allocMap
      } else if (d.type === 'negotiation') decs[d.id] = d.negotiationOptions?.[0]?.id
      else if (d.type === 'ranking') decs[d.id] = d.rankingItems?.map((i) => i.id) ?? []
    })
    return decs
  })

  // History of rounds completed
  const [history, setHistory] = useState<RoundSimulationResult[]>([])

  // Modal State
  const [activeConsequenceResult, setActiveConsequenceResult] = useState<RoundSimulationResult | null>(null)

  // Simulation completed
  const [completed, setCompleted] = useState<boolean>(false)
  const [scorecard, setScorecard] = useState<V2Scorecard | null>(null)

  // Initial variable baseline for final scorecard comparison
  const initialVariablesBaseline = useMemo(() => {
    const base: Record<string, number> = {}
    simulation.variables.forEach((v) => {
      base[v.id] = v.initialValue
    })
    return base
  }, [simulation])

  // Handle decision change
  const handleDecisionChange = (decisionId: string, value: any) => {
    setCurrentDecisions((prev) => ({
      ...prev,
      [decisionId]: value,
    }))
  }

  // Execute Simulate
  const handleSimulate = () => {
    if (!currentRound) return

    // 1. Run simulation engine
    const simResult = simulateRound(
      simulation,
      currentVariables,
      currentRound.roundNumber,
      currentDecisions
    )

    // 2. Set previous variables for delta comparison
    setPreviousVariables({ ...currentVariables })

    // 3. Update current live variables
    setCurrentVariables({ ...simResult.updatedVariables })

    // 4. Append to history
    const updatedHistory = [...history, simResult]
    setHistory(updatedHistory)

    // 5. Open consequence reveal modal
    setActiveConsequenceResult(simResult)
  }

  // Handle proceeding after consequence review
  const handleProceedAfterConsequence = () => {
    setActiveConsequenceResult(null)

    const isLastRound = currentRoundIndex >= simulation.rounds.length - 1

    if (isLastRound) {
      // Calculate final holistic scorecard
      const sc = calculateScorecard(
        simulation,
        initialVariablesBaseline,
        currentVariables,
        history
      )
      setScorecard(sc)
      setCompleted(true)
      onComplete?.(sc, history, currentVariables)
    } else {
      // Advance to next round
      const nextIdx = currentRoundIndex + 1
      setCurrentRoundIndex(nextIdx)

      // Initialize next round default decisions
      const nextRound = simulation.rounds[nextIdx]
      const nextDecs: Record<string, any> = {}
      nextRound?.decisions.forEach((d) => {
        if (d.type === 'select') nextDecs[d.id] = d.options?.[0]?.id
        else if (d.type === 'slider' || d.type === 'quantity') nextDecs[d.id] = d.defaultValue ?? d.min ?? 0
        else if (d.type === 'allocate') {
          const allocMap: Record<string, number> = {}
          d.allocateItems?.forEach((item) => {
            allocMap[item.id] = item.defaultVal ?? 0
          })
          nextDecs[d.id] = allocMap
        } else if (d.type === 'negotiation') nextDecs[d.id] = d.negotiationOptions?.[0]?.id
        else if (d.type === 'ranking') nextDecs[d.id] = d.rankingItems?.map((i) => i.id) ?? []
      })
      setCurrentDecisions(nextDecs)
    }
  }

  // Restart simulation
  const handleRestart = () => {
    setCurrentRoundIndex(0)
    const init: Record<string, number> = {}
    simulation.variables.forEach((v) => {
      init[v.id] = v.initialValue
    })
    setCurrentVariables(init)
    setPreviousVariables(undefined)
    setHistory([])
    setCompleted(false)
    setScorecard(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Executive Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/browse"
            className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm hover:bg-cyan-500/20 transition"
          >
            SL
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {simulation.companyName}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                SimLight V2
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Role: <span className="text-slate-200 font-medium">{currentRound?.role || simulation.initialRole}</span> · Learner: {learnerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Simulation Progress
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              Round {completed ? simulation.rounds.length : currentRoundIndex + 1} of {simulation.rounds.length}
            </span>
          </div>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Exit
            </button>
          )}
        </div>
      </header>

      {/* Multi-Phase Progression Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {simulation.rounds.map((rnd, idx) => {
            const isPast = idx < currentRoundIndex || completed
            const isCurrent = idx === currentRoundIndex && !completed
            return (
              <div key={rnd.roundNumber} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                    isCurrent
                      ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/40'
                      : isPast
                        ? 'bg-slate-900 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-950/50 border-slate-800 text-slate-500'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 animate-pulse'
                        : isPast
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast ? '✓' : rnd.roundNumber}
                  </span>
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    Phase {rnd.roundNumber}: {rnd.title}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-cyan-900/80 text-cyan-300 rounded">
                      Active
                    </span>
                  )}
                </div>
                {idx < simulation.rounds.length - 1 && (
                  <span className="text-slate-600 text-xs font-mono">→</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* If Completed -> Show Final Scorecard View */}
        {completed && scorecard ? (
          <FinalScorecardView
            simulation={simulation}
            history={history}
            scorecard={scorecard}
            onRestart={handleRestart}
            sessionId={sessionId}
          />
        ) : (
          <>
            {/* Live Corporate Variables / KPIs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Corporate Environment & State Variables
                </span>
                <span className="text-[11px] text-slate-500">
                  Variables update dynamically with each decision
                </span>
              </div>
              <LiveKpiGrid
                variables={simulation.variables}
                currentValues={currentVariables}
                previousValues={previousVariables}
              />
            </div>

            {/* Current Situation Dossier & Briefing */}
            {currentRound && (
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center text-xs font-bold font-mono">
                      Phase {currentRound.roundNumber}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {currentRound.title}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                    {simulation.industry}
                  </span>
                </div>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {currentRound.situationBrief}
                </p>

                {currentRound.bulletPoints && currentRound.bulletPoints.length > 0 && (
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
                      Critical Operating Intelligence:
                    </span>
                    <ul className="space-y-1 text-xs sm:text-sm text-slate-300">
                      {currentRound.bulletPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-cyan-500 font-bold">›</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Decision Cockpit */}
            {currentRound && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Executive Decision Cockpit · Strategy Execution
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      Phase {currentRound.roundNumber}: Operational & Financial Commitments
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {currentRound.decisions.length} Action Items Required
                    </span>
                  </div>
                </div>

                {/* Live Resource Management Tracker */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 grid sm:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center text-base">
                      💼
                    </span>
                    <div>
                      <span className="text-slate-400 text-[11px] block font-semibold">Available Working Capital</span>
                      <span className="font-bold text-white font-mono text-sm">
                        {(() => {
                          const cashVar = simulation.variables.find((v) => v.id.toLowerCase().includes('cash') || v.id.toLowerCase().includes('budget'))
                          return cashVar ? formatVariableValue(currentVariables[cashVar.id], cashVar.unit) : 'Healthy Liquidity'
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center text-base">
                      🏭
                    </span>
                    <div>
                      <span className="text-slate-400 text-[11px] block font-semibold">Operational Capacity</span>
                      <span className="font-bold text-white font-mono text-sm">
                        {(() => {
                          const capVar = simulation.variables.find((v) => v.id.toLowerCase().includes('capacity') || v.id.toLowerCase().includes('units'))
                          return capVar ? formatVariableValue(currentVariables[capVar.id], capVar.unit) : 'Active Production'
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-base">
                      ⚙️
                    </span>
                    <div>
                      <span className="text-slate-400 text-[11px] block font-semibold">Flight Status</span>
                      <span className="font-bold text-emerald-400 font-mono text-xs">
                        Ready to simulate phase consequences
                      </span>
                    </div>
                  </div>
                </div>

                {/* Render Decision Components */}
                <div className="space-y-6">
                  {currentRound.decisions.map((decision, dIdx) => (
                    <div
                      key={decision.id}
                      className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-5 space-y-3 hover:border-slate-700 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[11px] font-bold font-mono uppercase">
                            Decision Step {dIdx + 1} of {currentRound.decisions.length}
                          </span>
                          <span className="font-bold text-sm sm:text-base text-white">
                            {decision.label}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {decision.type === 'slider'
                            ? 'Quantitative Slider'
                            : decision.type === 'allocate'
                              ? 'Capital Allocation Pool'
                              : 'Strategic Choice'}
                        </span>
                      </div>

                      {decision.description && (
                        <p className="text-xs text-slate-400">{decision.description}</p>
                      )}

                      <DecisionControlRenderer
                        decision={decision}
                        value={currentDecisions[decision.id]}
                        onChange={(newVal) => handleDecisionChange(decision.id, newVal)}
                      />
                    </div>
                  ))}
                </div>

                {/* Action Button: SIMULATE */}
                <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-slate-400 max-w-md">
                    Clicking Simulate evaluates your operational trade-offs, computes mathematical rule impacts, and advances the corporate state.
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulate}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base uppercase tracking-wider rounded-xl shadow-xl shadow-cyan-500/20 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-3"
                  >
                    <span>⚡ SIMULATE PHASE DECISIONS</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Consequence Modal Reveal */}
      {activeConsequenceResult && (
        <ConsequenceModal
          result={activeConsequenceResult}
          isFinalRound={currentRoundIndex >= simulation.rounds.length - 1}
          onProceed={handleProceedAfterConsequence}
        />
      )}
    </div>
  )
}
