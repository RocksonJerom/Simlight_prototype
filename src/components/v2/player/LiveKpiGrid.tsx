import React from 'react'
import type { LiveVariable } from '../../../types/v2.js'
import { formatVariableValue } from '../../../engine/v2Engine.js'

interface LiveKpiGridProps {
  variables: LiveVariable[]
  currentValues: Record<string, number>
  previousValues?: Record<string, number>
  compact?: boolean
}

export const LiveKpiGrid: React.FC<LiveKpiGridProps> = ({
  variables,
  currentValues,
  previousValues,
  compact = false,
}) => {
  return (
    <div
      className={`grid gap-3 ${
        compact
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
          : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
      }`}
    >
      {variables.map((variable) => {
        const val = currentValues[variable.id] ?? variable.currentValue ?? variable.initialValue
        const prev = previousValues ? previousValues[variable.id] ?? val : val
        const delta = Math.round((val - prev) * 100) / 100
        const hasDelta = Math.abs(delta) > 0.01

        const higherIsBetter = variable.targetDirection !== 'lower_is_better'
        const isPositive = higherIsBetter ? delta > 0 : delta < 0

        return (
          <div
            key={variable.id}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between transition-all hover:border-slate-700 shadow-sm"
          >
            {/* Category accent bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                variable.category === 'financial'
                  ? 'bg-amber-500'
                  : variable.category === 'operational'
                  ? 'bg-blue-500'
                  : variable.category === 'risk'
                  ? 'bg-rose-500'
                  : variable.category === 'market'
                  ? 'bg-emerald-500'
                  : 'bg-purple-500'
              }`}
            />

            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                  {variable.label}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/80">
                  {variable.category}
                </span>
              </div>

              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                {formatVariableValue(val, variable.unit)}
              </div>
            </div>

            {/* Delta pill if available */}
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
              {hasDelta ? (
                <div
                  className={`inline-flex items-center gap-1 font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                    isPositive
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  <span>{delta > 0 ? '▲ +' : '▼ '}</span>
                  <span>{formatVariableValue(Math.abs(delta), variable.unit)}</span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500">Stable</span>
              )}

              {variable.benchmark && (
                <span className="text-[10px] text-slate-500 font-mono">
                  Goal: {formatVariableValue(variable.benchmark, variable.unit)}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
