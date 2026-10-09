import React, { useState } from 'react'
import type {
  V2Simulation,
  LiveVariable,
  SimulationRound,
  DecisionComponent,
  SimulationRule,
  DecisionComponentType,
} from '../../../types/v2.js'
import { V2_SUPPLY_CHAIN_SIMULATION, V2_MARKETING_BUDGET_SIMULATION } from '../../../data/v2Templates.js'
import { api } from '../../../api/client.js'

interface V2SimulationBuilderProps {
  initialSimulation?: V2Simulation
  onSave: (sim: V2Simulation) => void
  onPreview: (sim: V2Simulation) => void
}

export const V2SimulationBuilder: React.FC<V2SimulationBuilderProps> = ({
  initialSimulation,
  onSave,
  onPreview,
}) => {
  const [creationMode, setCreationMode] = useState<'manual' | 'genie'>('manual')
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [simulation, setSimulation] = useState<V2Simulation>(() => {
    return initialSimulation ?? { ...V2_SUPPLY_CHAIN_SIMULATION, id: `v2-${Date.now()}` }
  })

  // Selected round in Steps 3, 4, 5
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0)
  const currentRound = simulation.rounds[selectedRoundIndex] ?? simulation.rounds[0]

  // Genie AI Creation Inputs State
  const [genieTitle, setGenieTitle] = useState(simulation.title || '')
  const [genieIndustry, setGenieIndustry] = useState(simulation.industry || 'Manufacturing & Strategy')
  const [genieDescription, setGenieDescription] = useState(
    simulation.companyOverview ||
      'Executive multi-phase scenario where students lead capital allocation, manage supply constraints, and defend gross margins against competitors.'
  )
  const [genieObjectives, setGenieObjectives] = useState(
    simulation.learningObjectives.join('\n') ||
      'Evaluate capital allocation under working capital constraints\nBalance factory capacity against demand volatility\nDefend profitability during competitive price wars'
  )
  const [genieScenarios, setGenieScenarios] = useState(
    'Phase 1: Market Baseline & Capital Allocation\nPhase 2: Operational Scaling & Demand Surge\nPhase 3: Competitive Price War & Margin Defense'
  )
  const [genieFinancials, setGenieFinancials] = useState('Cash Reserves (₹ Cr), Revenue (₹ Cr), Operating Margin (%)')
  const [genieOperational, setGenieOperational] = useState('Capacity Utilization (%), Customer Satisfaction (%), Defect Rate (%)')
  const [genieRules, setGenieRules] = useState(
    'Low-cost sourcing expands gross margin by 3.5% but degrades CSAT by 6%\nDouble production shifts increase revenue by ₹24L but add ₹60L overhead'
  )
  const [genieEvaluation, setGenieEvaluation] = useState(
    'Financial Health (35%), Operational Efficiency (25%), Market Competitiveness (25%), Risk Control (15%)'
  )

  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiNotification, setAiNotification] = useState<string | null>(null)

  // Evaluation criteria state in Step 1
  const [evalWeights, setEvalWeights] = useState({
    financial: 35,
    operational: 25,
    market: 25,
    risk: 15,
  })

  // Load template
  const handleLoadTemplate = (tpl: V2Simulation) => {
    setSimulation({ ...tpl, id: `v2-${Date.now()}` })
    setSelectedRoundIndex(0)
    setAiNotification(`Loaded template: "${tpl.title}"`)
    setTimeout(() => setAiNotification(null), 3000)
  }

  // Genie AI Generation
  const handleGenieGenerate = async () => {
    setAiGenerating(true)
    setAiNotification(null)

    const objectivesList = genieObjectives
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const scenariosList = genieScenarios
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const facultyInputs = {
      title: genieTitle || simulation.title,
      industry: genieIndustry,
      difficulty: simulation.difficulty,
      duration: simulation.duration,
      companyName: simulation.companyName,
      companyOverview: genieDescription,
      learningObjectives: objectivesList,
      scenarios: scenariosList,
      financialKpis: [genieFinancials],
      operationalKpis: [genieOperational],
      constraintsRules: [genieRules],
      evaluationCriteria: [genieEvaluation],
    }

    try {
      const res = await api.generateV2Genie(
        `${genieTitle}: ${genieDescription}`,
        facultyInputs
      )
      if (res && res.simulation) {
        setSimulation(res.simulation)
        setSelectedRoundIndex(0)
        setAiNotification('✨ Genie successfully generated your simulation structure! You can now review and customize all steps.')
        setCreationMode('manual') // switch to review mode
        setActiveStep(1)
      } else {
        throw new Error('Failed to parse simulation')
      }
    } catch (err) {
      console.warn('Genie generation fallback:', err)
      // Fallback local synthesis
      const newSim: V2Simulation = {
        ...simulation,
        id: `v2-${Date.now()}`,
        title: genieTitle || simulation.title,
        industry: genieIndustry,
        companyOverview: genieDescription,
        learningObjectives: objectivesList.length ? objectivesList : simulation.learningObjectives,
      }
      setSimulation(newSim)
      setAiNotification('✨ Simulation structure created from your inputs! Customize rounds and live variables below.')
      setCreationMode('manual')
      setActiveStep(1)
    } finally {
      setAiGenerating(false)
      setTimeout(() => setAiNotification(null), 5000)
    }
  }

  // Live Variable Helpers
  const addVariable = (category: LiveVariable['category'] = 'financial') => {
    const newVar: LiveVariable = {
      id: `var_${Date.now()}`,
      label: category === 'financial' ? 'Net Operating Cash' : 'Line Production Yield',
      unit: category === 'financial' ? 'currency_inr' : 'percent',
      category,
      initialValue: category === 'financial' ? 2000000 : 85,
      currentValue: category === 'financial' ? 2000000 : 85,
      min: 0,
      max: category === 'financial' ? 10000000 : 100,
      targetDirection: 'higher_is_better',
      benchmark: category === 'financial' ? 3000000 : 90,
    }
    setSimulation((prev) => ({ ...prev, variables: [...prev.variables, newVar] }))
  }

  const updateVariable = (id: string, updates: Partial<LiveVariable>) => {
    setSimulation((prev) => ({
      ...prev,
      variables: prev.variables.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    }))
  }

  const deleteVariable = (id: string) => {
    setSimulation((prev) => ({
      ...prev,
      variables: prev.variables.filter((v) => v.id !== id),
    }))
  }

  // Round Helpers
  const addRound = () => {
    const newRoundNum = simulation.rounds.length + 1
    const newRound: SimulationRound = {
      roundNumber: newRoundNum,
      title: `Phase ${newRoundNum}: Strategic Expansion & Execution`,
      role: simulation.initialRole,
      company: simulation.companyName,
      situationBrief: 'Describe the emerging market conditions and executive trade-offs for this phase...',
      bulletPoints: ['Capital expenditure limit', 'Competitive pressure on margin'],
      decisions: [
        {
          id: `dec_${Date.now()}`,
          type: 'select',
          label: 'Primary Strategic Posture',
          options: [
            { id: 'opt_a', label: 'Aggressive Expansion (+CapEx, +Market Share)' },
            { id: 'opt_b', label: 'Conservative Preservation (Conserve Cash, Protect Margin)' },
          ],
        },
      ],
      rules: [],
      events: [],
    }
    setSimulation((prev) => ({ ...prev, rounds: [...prev.rounds, newRound] }))
    setSelectedRoundIndex(simulation.rounds.length)
  }

  const deleteRound = (roundNum: number) => {
    if (simulation.rounds.length <= 1) return
    const filtered = simulation.rounds
      .filter((r) => r.roundNumber !== roundNum)
      .map((r, idx) => ({ ...r, roundNumber: idx + 1 }))
    setSimulation((prev) => ({ ...prev, rounds: filtered }))
    setSelectedRoundIndex(0)
  }

  // Decision Component Helpers
  const addDecision = (type: DecisionComponentType) => {
    const newDec: DecisionComponent = {
      id: `dec_${Date.now()}`,
      type,
      label: `New ${type.toUpperCase()} Decision`,
      options:
        type === 'select'
          ? [
              { id: 'opt1', label: 'Strategic Option Alpha', description: 'Faster execution with higher cash outlay' },
              { id: 'opt2', label: 'Strategic Option Beta', description: 'Lower capital risk with conservative yield' },
            ]
          : undefined,
      min: type === 'slider' || type === 'quantity' ? 0 : undefined,
      max: type === 'slider' || type === 'quantity' ? 100 : undefined,
      step: type === 'slider' || type === 'quantity' ? 5 : undefined,
      unitLabel: type === 'slider' ? '%' : undefined,
      totalBudget: type === 'allocate' ? 100 : undefined,
      budgetUnit: type === 'allocate' ? '%' : undefined,
      allocateItems:
        type === 'allocate'
          ? [
              { id: 'alloc1', label: 'Marketing & Sales', defaultVal: 50 },
              { id: 'alloc2', label: 'Operations & Quality', defaultVal: 50 },
            ]
          : undefined,
    }

    setSimulation((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r, idx) =>
        idx === selectedRoundIndex ? { ...r, decisions: [...r.decisions, newDec] } : r
      ),
    }))
  }

  const deleteDecision = (decId: string) => {
    setSimulation((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r, idx) =>
        idx === selectedRoundIndex
          ? { ...r, decisions: r.decisions.filter((d) => d.id !== decId) }
          : r
      ),
    }))
  }

  // Rule Builder Helpers
  const addRule = () => {
    const targetVar = simulation.variables[0]?.id || 'cash'
    const newRule: SimulationRule = {
      id: `rule_${Date.now()}`,
      name: 'Strategic Trade-off Rule',
      conditions: [
        {
          targetType: 'decision',
          targetId: currentRound?.decisions[0]?.id || 'decision_1',
          operator: 'equals',
          value: 'opt1',
        },
      ],
      variableDeltas: [
        {
          variableId: targetVar,
          operation: 'add',
          value: -100000,
        },
      ],
      narrativeFeedback: 'Decision executed: capital deployed to accelerate production throughput.',
    }

    setSimulation((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r, idx) =>
        idx === selectedRoundIndex ? { ...r, rules: [...r.rules, newRule] } : r
      ),
    }))
  }

  const deleteRule = (ruleId: string) => {
    setSimulation((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r, idx) =>
        idx === selectedRoundIndex ? { ...r, rules: r.rules.filter((rule) => rule.id !== ruleId) } : r
      ),
    }))
  }

  const totalEvalWeight = evalWeights.financial + evalWeights.operational + evalWeights.market + evalWeights.risk

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Creation Mode Switcher Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Simulation Architect
            </span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold">
              Capsim-Style Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">{simulation.title}</h2>
          <p className="text-xs text-slate-400">
            {simulation.companyName} · {simulation.rounds.length} Phases · {simulation.variables.length} Data Variables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex">
            <button
              type="button"
              onClick={() => setCreationMode('manual')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                creationMode === 'manual'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ✏️ Manual Creation
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('genie')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                creationMode === 'genie'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🧞 Genie AI-Assisted
            </button>
          </div>

          <button
            type="button"
            onClick={() => onPreview(simulation)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
          >
            <span>🎮 Test Flight</span>
          </button>
          <button
            type="button"
            onClick={() => onSave(simulation)}
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            💾 Save Simulation
          </button>
        </div>
      </div>

      {/* Notifications */}
      {aiNotification && (
        <div className="p-3 bg-cyan-950/70 border border-cyan-800 text-cyan-200 text-xs rounded-xl flex items-center justify-between">
          <span>{aiNotification}</span>
          <button type="button" onClick={() => setAiNotification(null)} className="text-cyan-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* GENIE AI CREATION MODE VIEW */}
      {creationMode === 'genie' ? (
        <div className="bg-slate-900 border border-violet-500/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🧞 Genie AI-Assisted Simulation Generator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Provide your required scenarios, parameters, data variables, rules, and evaluation criteria. Genie will synthesize the complete interactive Capsim-style engine structure.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Quick Templates:</span>
              <button
                type="button"
                onClick={() => handleLoadTemplate(V2_SUPPLY_CHAIN_SIMULATION)}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
              >
                📦 Supply Chain
              </button>
              <button
                type="button"
                onClick={() => handleLoadTemplate(V2_MARKETING_BUDGET_SIMULATION)}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 transition"
              >
                📊 FMCG Marketing
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Simulation Title
              </label>
              <input
                type="text"
                value={genieTitle}
                onChange={(e) => setGenieTitle(e.target.value)}
                placeholder="e.g., Global Semiconductor Supply & Capacity Strategy"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-violet-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Industry / Domain
              </label>
              <input
                type="text"
                value={genieIndustry}
                onChange={(e) => setGenieIndustry(e.target.value)}
                placeholder="e.g., High-Tech Manufacturing / FMCG / Healthcare Operations"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-violet-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Description / Business Challenge
              </label>
              <textarea
                rows={2}
                value={genieDescription}
                onChange={(e) => setGenieDescription(e.target.value)}
                placeholder="Describe the company context, market dynamics, and leadership challenge..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-violet-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Learning Objectives (one per line)
              </label>
              <textarea
                rows={3}
                value={genieObjectives}
                onChange={(e) => setGenieObjectives(e.target.value)}
                placeholder="Enter core educational objectives..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-violet-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Scenarios / Phases to Generate (one per line)
              </label>
              <textarea
                rows={3}
                value={genieScenarios}
                onChange={(e) => setGenieScenarios(e.target.value)}
                placeholder="Phase 1: Baseline Launch&#10;Phase 2: Demand Shock&#10;Phase 3: Market Expansion"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-violet-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Data Inputs: Financial Variables
              </label>
              <input
                type="text"
                value={genieFinancials}
                onChange={(e) => setGenieFinancials(e.target.value)}
                placeholder="e.g. Cash Reserves (₹ Cr), Revenue, Operating Margin (%)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-violet-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Data Inputs: Operational & Market Variables
              </label>
              <input
                type="text"
                value={genieOperational}
                onChange={(e) => setGenieOperational(e.target.value)}
                placeholder="e.g. Capacity Utilization (%), Customer Satisfaction (CSAT), Defect Rate (%)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-violet-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Rules & Constraints (Decision consequences & limits)
              </label>
              <textarea
                rows={2}
                value={genieRules}
                onChange={(e) => setGenieRules(e.target.value)}
                placeholder="e.g. Low cost procurement improves margin by 3% but increases defect rate by 1.5%..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-violet-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Evaluation Criteria (Balanced Scorecard Focus)
              </label>
              <input
                type="text"
                value={genieEvaluation}
                onChange={(e) => setGenieEvaluation(e.target.value)}
                placeholder="e.g. Financials (35%), Operations (25%), Market (25%), Risk (15%)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-violet-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCreationMode('manual')}
              className="px-4 py-2.5 text-xs text-slate-400 hover:text-white"
            >
              Switch to Manual Authoring
            </button>
            <button
              type="button"
              disabled={aiGenerating || !genieTitle.trim()}
              onClick={handleGenieGenerate}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>{aiGenerating ? '⏳' : '🧞'}</span>
              <span>{aiGenerating ? 'Genie Synthesizing Structure…' : 'Generate Simulation Structure with Genie'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* MANUAL CREATION MODE WITH 5 GUIDED STEPS */
        <div className="space-y-6">
          {/* Step Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { step: 1, label: '1. Title, Objectives & Evaluation Criteria' },
              { step: 2, label: '2. Data Inputs (Financials & Operations)' },
              { step: 3, label: '3. Scenarios & Phases' },
              { step: 4, label: '4. Decision Controls' },
              { step: 5, label: '5. Rules & Constraints' },
            ].map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStep(s.step as any)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
                  activeStep === s.step
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* STEP 1: TITLE, OBJECTIVES & EVALUATION CRITERIA */}
          {activeStep === 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Simulation Details & Evaluation Criteria</h3>
                  <p className="text-xs text-slate-400">
                    Define the core business context, student role, learning objectives, and balanced scorecard scoring rubric.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Simulation Title
                  </label>
                  <input
                    type="text"
                    value={simulation.title}
                    onChange={(e) => setSimulation({ ...simulation, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={simulation.companyName}
                    onChange={(e) => setSimulation({ ...simulation, companyName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Industry / Domain
                  </label>
                  <input
                    type="text"
                    value={simulation.industry}
                    onChange={(e) => setSimulation({ ...simulation, industry: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Student Executive Role
                  </label>
                  <input
                    type="text"
                    value={simulation.initialRole}
                    onChange={(e) => setSimulation({ ...simulation, initialRole: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Company Description & Scenario Brief
                </label>
                <textarea
                  rows={3}
                  value={simulation.companyOverview}
                  onChange={(e) => setSimulation({ ...simulation, companyOverview: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Learning Objectives (one per line)
                </label>
                <textarea
                  rows={3}
                  value={simulation.learningObjectives.join('\n')}
                  onChange={(e) =>
                    setSimulation({
                      ...simulation,
                      learningObjectives: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                />
              </div>

              {/* Evaluation Criteria Rubric */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Balanced Scorecard Evaluation Criteria
                  </h4>
                  <span className={`text-xs font-bold ${totalEvalWeight === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Total: {totalEvalWeight}% {totalEvalWeight === 100 ? '✓ Valid' : '(Must sum to 100%)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Financial Health Weight</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={evalWeights.financial}
                        onChange={(e) => setEvalWeights({ ...evalWeights, financial: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Operational Yield Weight</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={evalWeights.operational}
                        onChange={(e) => setEvalWeights({ ...evalWeights, operational: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Market & CSAT Weight</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={evalWeights.market}
                        onChange={(e) => setEvalWeights({ ...evalWeights, market: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Risk Discipline Weight</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={evalWeights.risk}
                        onChange={(e) => setEvalWeights({ ...evalWeights, risk: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DATA INPUTS (FINANCIALS & OPERATIONAL KPIS) */}
          {activeStep === 2 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Data Inputs: Financial & Operational Variables</h3>
                  <p className="text-xs text-slate-400">
                    Set up the living corporate state variables (Cash, Revenue, Margins, Production Capacity, Defect Rates). Student decisions mathematically shift these values.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addVariable('financial')}
                    className="px-3.5 py-1.5 bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    + Add Financial Input
                  </button>
                  <button
                    type="button"
                    onClick={() => addVariable('operational')}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    + Add Operational KPI
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {simulation.variables.map((v) => (
                  <div
                    key={v.id}
                    className={`bg-slate-950 p-4 rounded-xl border space-y-3 ${
                      v.category === 'financial' ? 'border-emerald-900/60' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            v.category === 'financial'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          }`}
                        >
                          {v.category}
                        </span>
                        <input
                          type="text"
                          value={v.label}
                          onChange={(e) => updateVariable(v.id, { label: e.target.value })}
                          className="bg-transparent font-bold text-sm text-white border-b border-slate-700 pb-0.5 focus:border-cyan-400 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteVariable(v.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        ✕ Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block">Initial Value</label>
                        <input
                          type="number"
                          value={v.initialValue}
                          onChange={(e) =>
                            updateVariable(v.id, {
                              initialValue: Number(e.target.value),
                              currentValue: Number(e.target.value),
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block">Unit Type</label>
                        <select
                          value={v.unit}
                          onChange={(e) => updateVariable(v.id, { unit: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                        >
                          <option value="currency_inr">₹ INR</option>
                          <option value="currency_usd">$ USD</option>
                          <option value="percent">% Percent</option>
                          <option value="units">Units</option>
                          <option value="ratio">Ratio (x)</option>
                          <option value="points">Points</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block">Target Goal</label>
                        <select
                          value={v.targetDirection || 'higher_is_better'}
                          onChange={(e) => updateVariable(v.id, { targetDirection: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                        >
                          <option value="higher_is_better">Higher is Better</option>
                          <option value="lower_is_better">Lower is Better</option>
                          <option value="target_range">Target Range</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SCENARIOS & PHASES */}
          {activeStep === 3 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Scenarios / Phases Architecture</h3>
                  <p className="text-xs text-slate-400">
                    Configure the multi-phase journey. In each round, students face an evolving business situation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRound}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  + Add Phase Round
                </button>
              </div>

              {/* Round Tabs */}
              <div className="flex gap-2">
                {simulation.rounds.map((r, idx) => (
                  <button
                    key={r.roundNumber}
                    type="button"
                    onClick={() => setSelectedRoundIndex(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedRoundIndex === idx
                        ? 'bg-cyan-500 text-slate-950 font-extrabold'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Phase {r.roundNumber}
                  </button>
                ))}
              </div>

              {currentRound && (
                <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Phase {currentRound.roundNumber} Configuration</h4>
                    {simulation.rounds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteRound(currentRound.roundNumber)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Delete Phase
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Phase Title</label>
                      <input
                        type="text"
                        value={currentRound.title}
                        onChange={(e) => {
                          const val = e.target.value
                          setSimulation((prev) => ({
                            ...prev,
                            rounds: prev.rounds.map((r, i) => (i === selectedRoundIndex ? { ...r, title: val } : r)),
                          }))
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Assigned Executive Role</label>
                      <input
                        type="text"
                        value={currentRound.role}
                        onChange={(e) => {
                          const val = e.target.value
                          setSimulation((prev) => ({
                            ...prev,
                            rounds: prev.rounds.map((r, i) => (i === selectedRoundIndex ? { ...r, role: val } : r)),
                          }))
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">
                      Situation Brief (What students read upon entering this phase)
                    </label>
                    <textarea
                      rows={4}
                      value={currentRound.situationBrief}
                      onChange={(e) => {
                        const val = e.target.value
                        setSimulation((prev) => ({
                          ...prev,
                          rounds: prev.rounds.map((r, i) => (i === selectedRoundIndex ? { ...r, situationBrief: val } : r)),
                        }))
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: DECISION CONTROLS */}
          {activeStep === 4 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Decision Controls for Phase {currentRound.roundNumber}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add the interactive decision widgets students use (Sliders, Budget Allocations, Strategy Choices).
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addDecision('select')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700"
                  >
                    + Option Select
                  </button>
                  <button
                    type="button"
                    onClick={() => addDecision('allocate')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 text-cyan-300"
                  >
                    + Budget Allocation
                  </button>
                  <button
                    type="button"
                    onClick={() => addDecision('slider')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 text-emerald-300"
                  >
                    + Slider Control
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {currentRound.decisions.map((d) => (
                  <div key={d.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                          {d.type}
                        </span>
                        <input
                          type="text"
                          value={d.label}
                          onChange={(e) => {
                            const val = e.target.value
                            setSimulation((prev) => ({
                              ...prev,
                              rounds: prev.rounds.map((r, i) =>
                                i === selectedRoundIndex
                                  ? { ...r, decisions: r.decisions.map((dec) => (dec.id === d.id ? { ...dec, label: val } : dec)) }
                                  : r
                              ),
                            }))
                          }}
                          className="bg-transparent font-bold text-sm text-white border-b border-slate-700 focus:border-cyan-400 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteDecision(d.id)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        ✕ Delete
                      </button>
                    </div>

                    {d.options && (
                      <div className="space-y-2 pt-2">
                        <p className="text-[10px] uppercase font-bold text-slate-500">Choice Options</p>
                        {d.options.map((opt, optIdx) => (
                          <div key={opt.id} className="flex gap-2">
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) => {
                                const val = e.target.value
                                const updatedOpts = d.options!.map((o, idx) => (idx === optIdx ? { ...o, label: val } : o))
                                setSimulation((prev) => ({
                                  ...prev,
                                  rounds: prev.rounds.map((r, i) =>
                                    i === selectedRoundIndex
                                      ? { ...r, decisions: r.decisions.map((dec) => (dec.id === d.id ? { ...dec, options: updatedOpts } : dec)) }
                                      : r
                                  ),
                                }))
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: RULES & CONSTRAINTS */}
          {activeStep === 5 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Rules & Consequence Engine for Phase {currentRound.roundNumber}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define mathematical rules and constraints. When a student chooses an option or slider value, these rules calculate variable shifts and explain trade-offs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRule}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  + Add Consequence Rule
                </button>
              </div>

              <div className="space-y-4">
                {currentRound.rules.map((rule) => (
                  <div key={rule.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => {
                          const val = e.target.value
                          setSimulation((prev) => ({
                            ...prev,
                            rounds: prev.rounds.map((r, i) =>
                              i === selectedRoundIndex
                                ? { ...r, rules: r.rules.map((rl) => (rl.id === rule.id ? { ...rl, name: val } : rl)) }
                                : r
                            ),
                          }))
                        }}
                        className="bg-transparent font-bold text-sm text-cyan-300 border-b border-slate-700 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => deleteRule(rule.id)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        ✕ Delete
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Narrative Feedback & Trade-off Explanation (Shown to student after execution)
                      </label>
                      <input
                        type="text"
                        value={rule.narrativeFeedback}
                        onChange={(e) => {
                          const val = e.target.value
                          setSimulation((prev) => ({
                            ...prev,
                            rounds: prev.rounds.map((r, i) =>
                              i === selectedRoundIndex
                                ? { ...r, rules: r.rules.map((rl) => (rl.id === rule.id ? { ...rl, narrativeFeedback: val } : rl)) }
                                : r
                            ),
                          }))
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
