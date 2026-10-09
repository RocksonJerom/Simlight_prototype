import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { StudentReportData, ReportCustomizationConfig } from '../types/simulation'
import { DEFAULT_REPORT_CUSTOMIZATION } from '../types/simulation'
import { formatVariableValue } from '../engine/v2Engine'
import { ReportCustomizerModal } from '../components/v2/report/ReportCustomizerModal'

export function PerformanceReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [report, setReport] = useState<StudentReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customizerOpen, setCustomizerOpen] = useState(false)

  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin'

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    api
      .getSessionReport(sessionId)
      .then((data) => {
        setReport(data)
        setError(null)
      })
      .catch((err) => {
        console.error(err)
        setError('Unable to load performance report. Please ensure the simulation has been completed.')
      })
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Compiling executive performance report…</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-bold text-slate-200">Performance Report Not Found</h2>
        <p className="text-sm text-slate-400 max-w-md text-center">{error ?? 'Report data unavailable.'}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
          >
            ← Go Back
          </button>
          <Link
            to="/teach"
            className="px-4 py-2 bg-cyan-600 text-white text-xs font-semibold rounded-lg hover:bg-cyan-500"
          >
            Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { session, simulation, learner, scorecard, decisionInsights, cohortComparison } = report
  const customization: ReportCustomizationConfig = {
    ...DEFAULT_REPORT_CUSTOMIZATION,
    ...(report.customization || {}),
  }

  const score = session.score
  const grade =
    score >= 90
      ? 'A+ (High Distinction)'
      : score >= 80
        ? 'A (Distinction)'
        : score >= 70
          ? 'B+ (Merit)'
          : score >= 60
            ? 'B (Pass)'
            : 'Needs Review'

  const handleSaveCustomization = async (newConfig: ReportCustomizationConfig) => {
    if (!simulation.id) return
    await api.updateReportConfig(simulation.id, newConfig)
    setReport((prev) => (prev ? { ...prev, customization: newConfig } : prev))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-12 print:bg-white print:text-black print:p-2">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Faculty Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              ← Back
            </button>
            <span className="text-slate-700">|</span>
            <Link to="/teach" className="text-xs text-slate-400 hover:text-cyan-400 transition">
              Faculty Dashboard
            </Link>
            <span className="text-slate-700">·</span>
            <Link to="/learn" className="text-xs text-slate-400 hover:text-cyan-400 transition">
              Student Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isFacultyOrAdmin && (
              <button
                type="button"
                onClick={() => setCustomizerOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>⚙️</span> Customize Report Structure
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🖨️ Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Official Header Banner */}
        <header className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden print:border-slate-300 print:bg-none">
          <div className="flex flex-wrap items-start justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Official Academic Report
                </span>
                <span className="text-xs text-slate-400">
                  {simulation.companyName} · {simulation.industry}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white print:text-black">
                {simulation.title}
              </h1>
              <p className="text-xs text-slate-400 max-w-2xl print:text-slate-600">
                {simulation.companyOverview}
              </p>
            </div>

            {/* Student ID Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 min-w-[240px] space-y-2 shadow-lg print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
                Participant Details
              </span>
              <div>
                <p className="font-bold text-white text-base print:text-black">{learner.name}</p>
                {customization.showStudentRegNumber && learner.regNumber && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">Reg / ID:</span>
                    <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                      {learner.regNumber}
                    </span>
                  </div>
                )}
                {customization.showStudentEmail && learner.email && (
                  <p className="text-xs text-slate-400 mt-1 truncate">{learner.email}</p>
                )}
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                Completed: {session.completedAt ? new Date(session.completedAt).toLocaleString() : new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </header>

        {/* Faculty Instructor Notes / Rubric (If provided) */}
        {customization.facultyNotes && (
          <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-2xl p-5 shadow-lg space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
              Faculty Instructor Commentary & Rubric Notes
            </span>
            <p className="text-xs text-slate-200 leading-relaxed print:text-slate-800">
              {customization.facultyNotes}
            </p>
          </div>
        )}

        {/* Score & Strategic Archetype Card */}
        {(customization.showOverallScore || customization.showStrategicArchetype) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Main Score Dial */}
            {customization.showOverallScore ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl print:border-slate-300">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Score Achieved</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-extrabold text-cyan-400 print:text-black">{score}</span>
                    <span className="text-lg text-slate-400">/ 100</span>
                  </div>
                  {customization.showGrade && (
                    <p className="text-xs font-semibold text-emerald-400 mt-1">{grade}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
                  Session Status: <span className="text-emerald-400 font-bold">100% Completed</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl print:border-slate-300">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Evaluation Type</span>
                  <div className="mt-3">
                    <span className="text-lg font-bold text-cyan-400">Formative Assessment</span>
                    <p className="text-xs text-slate-400 mt-1">Focus on decision consequences & trade-off analysis.</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
                  Status: <span className="text-emerald-400 font-bold">Completed & Submitted</span>
                </div>
              </div>
            )}

            {/* Strategic Posture Archetype */}
            {customization.showStrategicArchetype && (
              <div className={`${customization.showOverallScore ? 'md:col-span-2' : 'md:col-span-2'} bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xl print:border-slate-300 space-y-3`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Strategic Posture Archetype
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2 print:text-black">
                    <span>🎯</span>
                    <span className="text-cyan-300 print:text-black">{scorecard?.strategicArchetype || 'Balanced Execution'}</span>
                  </h3>
                  {customization.showExecutiveSummary && (
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed print:text-slate-700">
                      {scorecard?.summary ||
                        'The student navigated the multi-phase scenario with focus on balancing capital liquidity against operational expansion.'}
                    </p>
                  )}
                </div>

                {/* Strengths and Trade-offs Tag Rail */}
                {customization.showStrengthsAndTradeoffs && (
                  <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                        Key Strengths
                      </span>
                      <ul className="space-y-1 text-slate-300 print:text-slate-700 list-disc pl-4 text-[11px]">
                        {scorecard?.strengths?.slice(0, 2).map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                        Strategic Trade-Offs
                      </span>
                      <ul className="space-y-1 text-slate-300 print:text-slate-700 list-disc pl-4 text-[11px]">
                        {scorecard?.tradeOffsNoted?.slice(0, 2).map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Executive Behavior & Play Style Analysis */}
        {customization.showBehaviorInsights !== false && (report.behaviorInsights || (scorecard as any)?.behaviorInsights) && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 print:border-slate-300">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <span>🧠</span> Executive Behavior & Play Style Analysis
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Algorithmic behavioral profile evaluating risk appetite, capital allocation, and tactical focus
                </p>
              </div>
              <span className="px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full text-xs font-mono font-bold">
                Behavioral Matrix Verified
              </span>
            </div>

            {/* 3 Pillars Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>🎯</span> Risk Posture
                </div>
                <p className="text-base font-extrabold text-white print:text-black">
                  {(report.behaviorInsights || (scorecard as any)?.behaviorInsights)?.riskProfile}
                </p>
                <p className="text-[11px] text-slate-400">
                  Decision appetite under market volatility and operational bottlenecks
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>💼</span> Capital Deployment
                </div>
                <p className="text-base font-extrabold text-white print:text-black">
                  {(report.behaviorInsights || (scorecard as any)?.behaviorInsights)?.capitalStyle}
                </p>
                <p className="text-[11px] text-slate-400">
                  Working capital allocation and cash preservation tendencies
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>⚡</span> Strategic Focus
                </div>
                <p className="text-base font-extrabold text-white print:text-black">
                  {(report.behaviorInsights || (scorecard as any)?.behaviorInsights)?.strategicFocus}
                </p>
                <p className="text-[11px] text-slate-400">
                  Primary operational variable prioritized throughout rounds
                </p>
              </div>
            </div>

            {/* Trait Summary Callout */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="text-xs space-y-1">
                <span className="font-bold text-cyan-300 block">Behavioral Debrief & Key Signature</span>
                <p className="text-slate-300 leading-relaxed print:text-slate-800">
                  {(report.behaviorInsights || (scorecard as any)?.behaviorInsights)?.keyTraitSummary}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Cohort Comparison (If participants available & enabled by faculty) */}
        {customization.showCohortBenchmark && cohortComparison && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 print:border-slate-300">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                  Cohort / Participant Benchmark Comparison
                </h3>
                <p className="text-xs text-slate-400">
                  Performance relative to all {cohortComparison.totalParticipants} participating students
                </p>
              </div>
              <span className="px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full text-xs font-bold">
                Cohort Rank: #{cohortComparison.rank} of {cohortComparison.totalParticipants}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Standing</span>
                <p className="text-xl font-extrabold text-white mt-1 print:text-black">
                  Top {100 - cohortComparison.percentile + 1}%
                </p>
                <span className="text-[10px] text-slate-500">Percentile: {cohortComparison.percentile}th</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Score</span>
                <p className="text-xl font-extrabold text-cyan-400 mt-1 print:text-black">{score}</p>
                <span className="text-[10px] text-slate-500">Your final outcome</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Average</span>
                <p className="text-xl font-extrabold text-slate-300 mt-1 print:text-black">
                  {cohortComparison.classAverageScore}
                </p>
                <span className="text-[10px] text-slate-500">Cohort mean score</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cohort Highest</span>
                <p className="text-xl font-extrabold text-emerald-400 mt-1 print:text-black">
                  {cohortComparison.highestScore}
                </p>
                <span className="text-[10px] text-slate-500">Top achieved score</span>
              </div>
            </div>

            {/* Benchmark Visual Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1 font-semibold">
                <span>Score Comparison Bar</span>
                <span>
                  {score >= cohortComparison.classAverageScore
                    ? `+${score - cohortComparison.classAverageScore} pts above class average`
                    : `${cohortComparison.classAverageScore - score} pts below class average`}
                </span>
              </div>
              <div className="h-3.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, Math.max(10, score))}%` }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full h-full"
                />
              </div>
            </div>
          </section>
        )}

        {/* Performance Analysis: KPI Evolution Matrix */}
        {customization.showKpiTrajectory && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 print:border-slate-300">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                Performance Analysis & State Evolution
              </h3>
              <p className="text-xs text-slate-400">
                Analysis of how student decisions shifted financial and operational corporate indicators.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 font-bold">Metric / Variable</th>
                    <th className="p-3.5 font-bold">Baseline</th>
                    <th className="p-3.5 font-bold">Final Outcome</th>
                    <th className="p-3.5 font-bold">Net Change</th>
                    <th className="p-3.5 font-bold">% Shift</th>
                    <th className="p-3.5 font-bold">Trajectory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {scorecard?.metrics?.map((m: any) => {
                    const isPositive = m.status === 'positive'
                    const isNeutral = m.status === 'neutral'
                    return (
                      <tr key={m.id} className="hover:bg-slate-950/40 transition">
                        <td className="p-3.5 font-semibold text-slate-200 print:text-black">
                          {m.label}
                        </td>
                        <td className="p-3.5 text-slate-400 print:text-black font-mono">
                          {formatVariableValue(m.initialValue, m.unit)}
                        </td>
                        <td className="p-3.5 font-bold text-white print:text-black font-mono">
                          {formatVariableValue(m.finalValue, m.unit)}
                        </td>
                        <td className="p-3.5 font-mono">
                          <span
                            className={
                              isPositive
                                ? 'text-emerald-400 font-bold'
                                : isNeutral
                                  ? 'text-slate-400'
                                  : 'text-rose-400 font-bold'
                            }
                          >
                            {m.change > 0 ? '+' : ''}
                            {formatVariableValue(m.change, m.unit)}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono">
                          <span
                            className={
                              isPositive
                                ? 'text-emerald-400 font-bold'
                                : isNeutral
                                  ? 'text-slate-400'
                                  : 'text-rose-400 font-bold'
                            }
                          >
                            {m.percentChange > 0 ? '+' : ''}
                            {m.percentChange}%
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isPositive
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : isNeutral
                                  ? 'bg-slate-800 text-slate-300'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {isPositive ? '▲ Favorable' : isNeutral ? '◆ Maintained' : '▼ Strained'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Decisions Taken: Activity & Decision Insights */}
        {customization.showDecisionAudit && decisionInsights && decisionInsights.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 print:border-slate-300">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                Decision Audit Trail & Operational Choices
              </h3>
              <p className="text-xs text-slate-400">
                Full chronological record of decisions submitted across each operational phase.
              </p>
            </div>

            <div className="space-y-3">
              {decisionInsights.map((insight) => (
                <div
                  key={insight.roundNumber}
                  className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-white flex items-center gap-2 print:text-black">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center text-xs font-mono">
                        {insight.roundNumber}
                      </span>
                      {insight.title}
                    </span>
                  </div>

                  {/* What student decided */}
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Decisions Taken
                      </span>
                      <div className="space-y-1 text-slate-200 print:text-slate-800">
                        {Object.entries(insight.decisions).map(([key, val]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="font-semibold text-cyan-300 print:text-black">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trade-off summary */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Strategic Consequence
                      </span>
                      <p className="text-slate-300 leading-relaxed print:text-slate-700">
                        {insight.tradeOffSummary}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Verification Certificate Footer */}
        <footer className="pt-4 text-center text-xs text-slate-500 border-t border-slate-900 space-y-1 print:text-slate-600">
          <p className="font-semibold text-slate-400">
            SimLight Business Simulation Platform · Capsim-Style Executive Assessment
          </p>
          <p>
            Official record for {learner.name} {learner.regNumber ? `(${learner.regNumber})` : ''} · Session ID: {session.id}
          </p>
        </footer>
      </div>

      {/* Report Customization Modal (For Faculty/Admin) */}
      {isFacultyOrAdmin && simulation.id && (
        <ReportCustomizerModal
          simulationId={simulation.id}
          simulationTitle={simulation.title}
          initialConfig={customization}
          isOpen={customizerOpen}
          onClose={() => setCustomizerOpen(false)}
          onSave={handleSaveCustomization}
        />
      )}
    </div>
  )
}
