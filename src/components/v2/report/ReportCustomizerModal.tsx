import React, { useState } from 'react'
import type { ReportCustomizationConfig } from '../../../types/simulation'
import { DEFAULT_REPORT_CUSTOMIZATION } from '../../../types/simulation'

interface ReportCustomizerModalProps {
  simulationId: string
  simulationTitle: string
  initialConfig?: ReportCustomizationConfig
  isOpen: boolean
  onClose: () => void
  onSave: (config: ReportCustomizationConfig) => Promise<void>
}

export const ReportCustomizerModal: React.FC<ReportCustomizerModalProps> = ({
  simulationTitle,
  initialConfig,
  isOpen,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState<ReportCustomizationConfig>(() => ({
    ...DEFAULT_REPORT_CUSTOMIZATION,
    ...(initialConfig || {}),
  }))
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  const handleToggle = (key: keyof ReportCustomizationConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setSavedSuccess(false)
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig((prev) => ({
      ...prev,
      facultyNotes: e.target.value,
    }))
    setSavedSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(config)
      setSavedSuccess(true)
      setTimeout(() => {
        setSavedSuccess(false)
        onClose()
      }, 1200)
    } finally {
      setSaving(false)
    }
  }

  const toggleItems: {
    key: keyof Omit<ReportCustomizationConfig, 'facultyNotes'>
    label: string
    desc: string
    category: string
  }[] = [
    {
      key: 'showOverallScore',
      label: 'Overall Numerical Score (0 - 100)',
      desc: 'Display total performance points computed from holistic rubric',
      category: 'Score & Evaluation',
    },
    {
      key: 'showGrade',
      label: 'Academic Grade Tier',
      desc: 'Display letter honors (e.g. A+ High Distinction, A Distinction)',
      category: 'Score & Evaluation',
    },
    {
      key: 'showStrategicArchetype',
      label: 'Strategic Executive Posture',
      desc: 'e.g. "Aggressive Capital Optimizer", "Prudent Operator"',
      category: 'Score & Evaluation',
    },
    {
      key: 'showExecutiveSummary',
      label: 'Executive Performance Summary',
      desc: 'Automated strategic debrief analyzing trade-offs across rounds',
      category: 'Performance Analysis',
    },
    {
      key: 'showStrengthsAndTradeoffs',
      label: 'Key Strengths & Negative Trade-Offs',
      desc: 'Bullet-by-bullet breakdown of operational wins and resource strains',
      category: 'Performance Analysis',
    },
    {
      key: 'showBehaviorInsights',
      label: 'Executive Behavior & Play Style Analysis',
      desc: 'Risk Profile, Capital Allocation Style, and Strategic Focus matrix derived from decisions',
      category: 'Performance Analysis',
    },
    {
      key: 'showKpiTrajectory',
      label: 'KPI Balance Sheet & Trajectory Table',
      desc: 'Initial vs final values, net delta, and % shifts for all financial/operational variables',
      category: 'Operational Data',
    },
    {
      key: 'showDecisionAudit',
      label: 'Round-by-Round Decision Audit',
      desc: 'Detailed log of exact sliders, allocations, and choices submitted by student',
      category: 'Decisions & Activity',
    },
    {
      key: 'showCohortBenchmark',
      label: 'Cohort Benchmark & Class Ranking',
      desc: 'Display class rank, percentile, cohort average score, and peer metric averages',
      category: 'Comparative Analytics',
    },
    {
      key: 'showStudentRegNumber',
      label: 'Student Registration Number / ID',
      desc: 'Include university roll number or student ID in report header',
      category: 'Student Identity',
    },
    {
      key: 'showStudentEmail',
      label: 'Student Registered Email Address',
      desc: 'Display student university email in official report dossier',
      category: 'Student Identity',
    },
  ]

  // Group by category
  const categories = Array.from(new Set(toggleItems.map((item) => item.category)))

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              Faculty Report Control & Customization
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Configure Report Structure: {simulationTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs leading-relaxed">
            ℹ️ <strong>Faculty Control Note:</strong> You can show or hide specific fields and sections to fit formative vs summative requirements. Underlying participant scores and database records are never modified.
          </div>

          {categories.map((cat) => (
            <div key={cat} className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                {cat}
              </h3>
              <div className="space-y-2">
                {toggleItems
                  .filter((item) => item.category === cat)
                  .map((item) => {
                    const isChecked = Boolean(config[item.key])
                    return (
                      <label
                        key={item.key}
                        className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-slate-700 cursor-pointer transition"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-200 text-xs block">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {item.desc}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggle(item.key)}
                          className="w-4 h-4 mt-0.5 accent-cyan-500 rounded cursor-pointer"
                        />
                      </label>
                    )
                  })}
              </div>
            </div>
          ))}

          {/* Faculty Custom Notes / Instructions */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Faculty Instructor Notes & Debrief Rubric (Optional)
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 mb-2">
                Custom feedback, debrief notes, or rubric guidance that will appear in the official performance report for all students in this simulation.
              </span>
              <textarea
                value={config.facultyNotes || ''}
                onChange={handleNotesChange}
                rows={3}
                placeholder="e.g. Focus on your Round 2 capacity investments and how they balanced against working capital constraints..."
                className="w-full bg-slate-950 border border-slate-750 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setConfig({ ...DEFAULT_REPORT_CUSTOMIZATION })}
            className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            ↺ Reset Defaults
          </button>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-bold animate-fade-in">
                ✓ Report Structure Saved!
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Report Structure'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
