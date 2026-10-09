import React from 'react'
import type { DecisionComponent } from '../../../types/v2.js'
import { formatVariableValue } from '../../../engine/v2Engine.js'

interface DecisionControlsProps {
  decision: DecisionComponent
  value: any
  onChange: (value: any) => void
  disabled?: boolean
}

export const DecisionControlRenderer: React.FC<DecisionControlsProps> = ({
  decision,
  value,
  onChange,
  disabled = false,
}) => {
  switch (decision.type) {
    case 'select':
      return (
        <SelectControl
          decision={decision}
          value={value ?? decision.options?.[0]?.id}
          onChange={onChange}
          disabled={disabled}
        />
      )

    case 'allocate':
      return (
        <AllocateControl
          decision={decision}
          value={value ?? {}}
          onChange={onChange}
          disabled={disabled}
        />
      )

    case 'slider':
      return (
        <SliderControl
          decision={decision}
          value={value ?? decision.defaultValue ?? decision.min ?? 0}
          onChange={onChange}
          disabled={disabled}
        />
      )

    case 'quantity':
      return (
        <QuantityControl
          decision={decision}
          value={value ?? decision.defaultValue ?? decision.min ?? 1000}
          onChange={onChange}
          disabled={disabled}
        />
      )

    case 'ranking':
      return (
        <RankingControl
          decision={decision}
          value={value ?? decision.rankingItems?.map((i) => i.id) ?? []}
          onChange={onChange}
          disabled={disabled}
        />
      )

    case 'negotiation':
      return (
        <NegotiationControl
          decision={decision}
          value={value ?? decision.negotiationOptions?.[0]?.id}
          onChange={onChange}
          disabled={disabled}
        />
      )

    case 'portfolio':
      return (
        <PortfolioControl
          decision={decision}
          value={value ?? []}
          onChange={onChange}
          disabled={disabled}
        />
      )

    default:
      return (
        <div className="text-sm text-slate-500 italic">
          Unsupported component type: {decision.type}
        </div>
      )
  }
}

/* =========================================================================
   1. SELECT CONTROL (Cards / Strategies)
   ========================================================================= */
const SelectControl: React.FC<DecisionControlsProps> = ({ decision, value, onChange, disabled }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {decision.options?.map((opt) => {
        const isSelected = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-cyan-500 bg-cyan-950/40 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className={`font-semibold text-sm ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                {opt.label}
              </span>
              {opt.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {opt.badge}
                </span>
              )}
            </div>
            {opt.description && (
              <p className="text-xs text-slate-400 leading-relaxed">{opt.description}</p>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* =========================================================================
   2. ALLOCATE CONTROL (Budget Pool with Bars & Sliders)
   ========================================================================= */
const AllocateControl: React.FC<DecisionControlsProps> = ({ decision, value, onChange, disabled }) => {
  const totalBudget = decision.totalBudget ?? 100
  const budgetUnit = decision.budgetUnit ?? '₹'
  const items = decision.allocateItems

  // Ensure current allocation map is populated
  const currentAlloc: Record<string, number> = React.useMemo(() => {
    const map: Record<string, number> = { ...value }
    for (const item of items ?? []) {
      if (map[item.id] === undefined) {
        map[item.id] = item.defaultVal ?? 0
      }
    }
    return map
  }, [value, items])

  const totalAllocated = Object.values(currentAlloc).reduce((sum, v) => sum + (Number(v) || 0), 0)
  const remainingBudget = totalBudget - totalAllocated
  const isOverBudget = remainingBudget < -0.01

  const handleItemChange = (itemId: string, newAmount: number) => {
    const updated = { ...currentAlloc, [itemId]: Math.max(0, newAmount) }
    onChange(updated)
  }

  return (
    <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
      {/* Pool Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Available</span>
          <p className="text-lg font-bold text-white">
            {budgetUnit === '₹' ? formatVariableValue(totalBudget, 'currency_inr') : `${totalBudget}${budgetUnit}`}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Remaining Unallocated</span>
          <p
            className={`text-lg font-bold ${
              isOverBudget
                ? 'text-rose-400'
                : remainingBudget === 0
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {budgetUnit === '₹' ? formatVariableValue(remainingBudget, 'currency_inr') : `${remainingBudget}${budgetUnit}`}
          </p>
        </div>
      </div>

      {/* Item sliders */}
      <div className="space-y-4">
        {(items ?? []).map((item) => {
          const val = currentAlloc[item.id] ?? 0
          const pct = totalBudget > 0 ? Math.round((val / totalBudget) * 100) : 0

          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">{item.label}</span>
                <span className="font-semibold text-cyan-400 font-mono">
                  {budgetUnit === '₹' ? formatVariableValue(val, 'currency_inr') : `${val}${budgetUnit}`}{' '}
                  <span className="text-slate-500 font-normal">({pct}%)</span>
                </span>
              </div>
              <input
                type="range"
                disabled={disabled}
                min={item.min ?? 0}
                max={item.max ?? totalBudget}
                step={item.step ?? 1}
                value={val}
                onChange={(e) => handleItemChange(item.id, Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          )
        })}
      </div>

      {isOverBudget && (
        <p className="text-xs text-rose-400 bg-rose-950/50 p-2 rounded border border-rose-900">
          ⚠️ You have allocated more than the available budget limit! Please reduce allocations to proceed.
        </p>
      )}
    </div>
  )
}

/* =========================================================================
   3. SLIDER CONTROL (Continuous parameter)
   ========================================================================= */
const SliderControl: React.FC<DecisionControlsProps> = ({ decision, value, onChange, disabled }) => {
  const min = decision.min ?? 0
  const max = decision.max ?? 100
  const step = decision.step ?? 1
  const unit = decision.unitLabel ?? ''

  const numVal = Number(value)

  return (
    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 uppercase tracking-wider">Current Selection</span>
        <div className="text-xl font-bold font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-800">
          {numVal.toLocaleString()} {unit}
        </div>
      </div>

      <input
        type="range"
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={numVal}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />

      <div className="flex justify-between text-xs text-slate-500 font-mono">
        <span>Min: {min.toLocaleString()} {unit}</span>
        <span>Max: {max.toLocaleString()} {unit}</span>
      </div>
    </div>
  )
}

/* =========================================================================
   4. QUANTITY CONTROL (Stepper)
   ========================================================================= */
const QuantityControl: React.FC<DecisionControlsProps> = ({ decision, value, onChange, disabled }) => {
  const min = decision.min ?? 0
  const max = decision.max ?? 100000
  const step = decision.step ?? 500
  const unit = decision.unitLabel ?? 'units'
  const numVal = Number(value) || min

  const adjust = (amount: number) => {
    const next = Math.max(min, Math.min(max, numVal + amount))
    onChange(next)
  }

  return (
    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
      <div>
        <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Target Volume</span>
        <div className="text-2xl font-bold font-mono text-white">
          {numVal.toLocaleString()} <span className="text-sm font-normal text-slate-400">{unit}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || numVal <= min}
          onClick={() => adjust(-step)}
          className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 flex items-center justify-center transition"
        >
          -
        </button>
        <button
          type="button"
          disabled={disabled || numVal >= max}
          onClick={() => adjust(step)}
          className="w-10 h-10 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-500 flex items-center justify-center transition"
        >
          +
        </button>
      </div>
    </div>
  )
}

/* =========================================================================
   5. RANKING CONTROL (Priority)
   ========================================================================= */
const RankingControl: React.FC<DecisionControlsProps> = ({ decision, value, onChange, disabled }) => {
  const items = decision.rankingItems ?? []
  const order: string[] = Array.isArray(value) && value.length === items.length ? value : items.map((i) => i.id)

  const move = (index: number, direction: 'up' | 'down') => {
    if (disabled) return
    const newOrder = [...order]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= newOrder.length) return
    const temp = newOrder[index]
    newOrder[index] = newOrder[targetIdx]
    newOrder[targetIdx] = temp
    onChange(newOrder)
  }

  const itemMap = new Map(items.map((i) => [i.id, i.label]))

  return (
    <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
      <p className="text-xs text-slate-400 mb-2">Rank items in order of priority (1 = Highest Priority):</p>
      {order.map((id, idx) => (
        <div
          key={id}
          className="flex items-center justify-between p-3 rounded-lg bg-slate-850 border border-slate-800 text-sm text-slate-200"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center text-xs font-bold">
              {idx + 1}
            </span>
            <span className="font-medium">{itemMap.get(id) || id}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={disabled || idx === 0}
              onClick={() => move(idx, 'up')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={disabled || idx === order.length - 1}
              onClick={() => move(idx, 'down')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ▼
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* =========================================================================
   6. NEGOTIATION CONTROL
   ========================================================================= */
const NegotiationControl: React.FC<DecisionControlsProps> = ({ decision, value, onChange, disabled }) => {
  const options = decision.negotiationOptions ?? [
    {
      id: 'accept',
      title: 'Accept Demands',
      description: 'Accept the supplier price hike in full to preserve relations.',
      riskLevel: 'Low' as const,
      potentialDiscount: '0%',
    },
    {
      id: 'counteroffer',
      title: 'Counteroffer with Volume Guarantee',
      description: 'Propose a 4% increase tied to a 12-month exclusivity guarantee.',
      riskLevel: 'Medium' as const,
      potentialDiscount: '5-8%',
    },
    {
      id: 'threaten_switch',
      title: 'Threaten to Switch to Competitor',
      description: 'Leverage rival supplier bids to force aggressive concession.',
      riskLevel: 'High' as const,
      potentialDiscount: '10-14%',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {options.map((opt) => {
        const isSelected = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              isSelected
                ? 'border-cyan-500 bg-cyan-950/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-100">{opt.title}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    opt.riskLevel === 'Low'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : opt.riskLevel === 'Medium'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {opt.riskLevel} Risk
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{opt.description}</p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Potential Cost Gain:</span>
              <span className="font-semibold text-cyan-400">{opt.potentialDiscount}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* =========================================================================
   7. PORTFOLIO CONTROL
   ========================================================================= */
const PortfolioControl: React.FC<DecisionControlsProps> = ({ decision, value, onChange, disabled }) => {
  const items = decision.portfolioItems ?? []
  const maxSelectable = decision.maxSelectable ?? 3
  const selected: string[] = Array.isArray(value) ? value : []

  const toggle = (id: string) => {
    if (disabled) return
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id))
    } else {
      if (selected.length < maxSelectable) {
        onChange([...selected, id])
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-400 flex items-center justify-between">
        <span>Select up to {maxSelectable} initiatives to fund:</span>
        <span className="font-semibold text-cyan-400">
          {selected.length} / {maxSelectable} Selected
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => {
          const isSelected = selected.includes(item.id)
          return (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`p-4 rounded-xl border-2 transition cursor-pointer ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-400'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-sm text-slate-100">{item.name}</span>
                <span className="text-xs font-mono font-semibold text-amber-400">
                  {formatVariableValue(item.investmentCost, 'currency_inr')}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">{item.description}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                <span>Return: {item.expectedReturn}</span>
                <span>Profile: {item.riskProfile}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
