import React from 'react'
import type { RoundSimulationResult } from '../../../types/v2.js'
import { formatVariableValue } from '../../../engine/v2Engine.js'

interface ConsequenceModalProps {
  result: RoundSimulationResult
  isFinalRound: boolean
  onProceed: () => void
}

export const ConsequenceModal: React.FC<ConsequenceModalProps> = ({
  result,
  isFinalRound,
  onProceed,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xl">
              ⚡
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                Simulation Engine Output
              </span>
              <h3 className="text-xl font-bold text-white">Round {result.roundNumber} Consequences</h3>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            State Updated
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Trade-off Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/40 shadow-inner">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
              Core Decision Outcome
            </span>
            <p className="text-base text-cyan-100 font-medium leading-relaxed">
              {result.summaryTradeOff}
            </p>
          </div>

          {/* Triggered Unexpected Events (if any) */}
          {result.triggeredEvents.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>🚨</span> Dynamic Market Event Triggered
              </h4>
              {result.triggeredEvents.map((ev) => (
                <div
                  key={ev.eventId}
                  className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-amber-200">{ev.title}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-900 text-amber-300">
                      {ev.severity}
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed">{ev.narrative}</p>
                  {ev.variableDeltas.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ev.variableDeltas.map((d) => (
                        <span
                          key={d.variableId}
                          className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900/90 border border-amber-700 text-amber-300"
                        >
                          {d.variableLabel}: {d.delta > 0 ? '+' : ''}
                          {formatVariableValue(d.delta, d.unit)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Rule Consequences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Consequence Chain & Operational Trade-Offs
            </h4>
            <div className="space-y-3">
              {result.appliedConsequences.map((c) => (
                <div
                  key={c.ruleId}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-200">{c.ruleName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Rule Triggered</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{c.narrative}</p>

                  {/* Impact Pills */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {c.variableDeltas.map((d) => {
                      const isPositive = d.delta >= 0
                      return (
                        <div
                          key={d.variableId}
                          className={`text-xs font-mono font-semibold px-2 py-1 rounded flex items-center gap-1.5 border ${
                            isPositive
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                              : 'bg-rose-950/70 text-rose-300 border-rose-800'
                          }`}
                        >
                          <span className="text-slate-300 font-normal">{d.variableLabel}:</span>
                          <span>
                            {d.delta > 0 ? '+' : ''}
                            {formatVariableValue(d.delta, d.unit)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adaptive Scenario Transition Banner */}
          {!isFinalRound && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-start gap-3">
              <span className="text-xl">🔄</span>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-indigo-300 block uppercase tracking-wider">
                  Adaptive Market Transition to Phase {result.roundNumber + 1}
                </span>
                <p className="text-indigo-200/90 leading-relaxed">
                  Market conditions, operating bottlenecks, and supplier relations for Phase {result.roundNumber + 1} have dynamically adapted based on your Phase {result.roundNumber} strategic posture and resource commitments.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            {isFinalRound
              ? 'All rounds completed. Ready to examine performance analytics.'
              : `Next situation is prepared based on these outcomes.`}
          </p>
          <button
            type="button"
            onClick={onProceed}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center gap-2"
          >
            <span>{isFinalRound ? 'View Performance Scorecard' : 'Continue to Next Situation'}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
