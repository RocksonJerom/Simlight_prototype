import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Assignment, SimulationRecord, ReportCustomizationConfig } from '../types/simulation'
import { ReportCustomizerModal } from '../components/v2/report/ReportCustomizerModal'

export function AssignPage() {
  const { id } = useParams<{ id: string }>()
  const [simulation, setSimulation] = useState<SimulationRecord | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [name, setName] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [email, setEmail] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendEmail, setSendEmail] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customizerOpen, setCustomizerOpen] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    Promise.all([api.getSimulation(id), api.listAssignments(id)])
      .then(([sim, assigns]) => {
        setSimulation(sim)
        setAssignments(assigns)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !name.trim()) return
    setSubmitting(true)
    try {
      await api.createAssignment(id, {
        learnerName: name.trim(),
        regNumber: regNumber.trim() || undefined,
        learnerEmail: email.trim() || undefined,
        dueDate: dueDate || undefined,
        sendEmail: email.trim() ? sendEmail : false,
      })
      setName('')
      setRegNumber('')
      setEmail('')
      setDueDate('')
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign')
    } finally {
      setSubmitting(false)
    }
  }

  const isV2 = Boolean(simulation?.v2Data)
  const playPath = isV2 ? '/v2/play' : '/play'

  const playUrl = (a: Assignment) =>
    `${playPath}/${id}?assignment=${a.id}&name=${encodeURIComponent(a.learnerName)}&regNumber=${encodeURIComponent(
      a.regNumber ?? ''
    )}`

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading…</div>
  }

  if (!simulation) {
    return (
      <div className="p-8 text-center">
        <p>Simulation not found.</p>
        <Link to="/teach" className="text-violet-600">Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="w-full max-w-[min(100%,90rem)] mx-auto px-4 sm:px-6 lg:px-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/teach" className="text-sm text-slate-500 hover:text-slate-700">← Dashboard</Link>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-xl font-bold text-slate-900">Assign Participants</h1>
              {isV2 && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold">
                  Capsim Engine
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{simulation.meta.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCustomizerOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              ⚙️ Customize Student Report
            </button>
            <Link
              to={`/analytics/${id}`}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
            >
              Class Analytics
            </Link>
            <Link
              to={isV2 ? `/v2/creator/${id}` : `/creator/${id}`}
              className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700"
            >
              Edit Simulation
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[min(100%,90rem)] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        <form onSubmit={handleAssign} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-semibold text-slate-800 text-base">New Participant Assignment</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign this simulation to a student with their Name and Registration Number.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Student Name *</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Sharma"
                required
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-cyan-500 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Registration Number / Student ID</span>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. REG-2026-1042"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-cyan-500 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email Address (optional)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-cyan-500 outline-none"
              />
            </label>

            <label className="block sm:col-span-3">
              <span className="text-sm font-medium text-slate-700">Due Date (optional)</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-cyan-500 outline-none"
              />
            </label>

            {email.trim() && (
              <label className="flex items-center gap-2 sm:col-span-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                Send email invite notification to learner
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-cyan-700 text-white text-sm font-bold rounded-lg hover:bg-cyan-800 disabled:opacity-50 transition cursor-pointer"
          >
            {submitting ? 'Assigning…' : '+ Assign Student'}
          </button>
        </form>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              Assigned Participants ({assignments.length})
            </h2>
            <span className="text-xs text-slate-500">
              {assignments.filter((a) => a.status === 'completed').length} Completed ·{' '}
              {assignments.filter((a) => a.status === 'in_progress').length} In Progress
            </span>
          </div>

          {assignments.length === 0 ? (
            <p className="px-6 py-8 text-slate-500 text-sm text-center">No assignments yet. Use the form above to assign students.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {assignments.map((a) => (
                <li key={a.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 text-sm">{a.learnerName}</p>
                      {a.regNumber && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded">
                          {a.regNumber}
                        </span>
                      )}
                    </div>
                    {a.learnerEmail && (
                      <p className="text-xs text-slate-500">{a.learnerEmail}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Assigned: {new Date(a.assignedAt).toLocaleDateString()}</span>
                      {a.dueDate && <span>Due: {a.dueDate}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        a.status === 'completed'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : a.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {a.status.replace('_', ' ')}
                    </span>

                    {a.status === 'completed' && a.sessionId ? (
                      <Link
                        to={`/report/${a.sessionId}`}
                        className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg hover:bg-indigo-100 transition flex items-center gap-1"
                      >
                        📊 View Performance Report
                      </Link>
                    ) : (
                      <Link
                        to={playUrl(a)}
                        className="px-3.5 py-1.5 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-bold rounded-lg hover:bg-cyan-100 transition"
                      >
                        Play Link →
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {id && simulation && (
        <ReportCustomizerModal
          simulationId={id}
          simulationTitle={simulation.meta.title}
          initialConfig={simulation.reportConfig}
          isOpen={customizerOpen}
          onClose={() => setCustomizerOpen(false)}
          onSave={async (newConfig: ReportCustomizationConfig) => {
            await api.updateReportConfig(id, newConfig)
            setSimulation((prev) => prev ? { ...prev, reportConfig: newConfig } : prev)
          }}
        />
      )}
    </div>
  )
}
