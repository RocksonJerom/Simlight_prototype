import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Assignment, SimulationRecord } from '../types/simulation'

export function AssignPage() {
  const { id } = useParams<{ id: string }>()
  const [simulation, setSimulation] = useState<SimulationRecord | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendEmail, setSendEmail] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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
        learnerEmail: email.trim() || undefined,
        dueDate: dueDate || undefined,
        sendEmail: email.trim() ? sendEmail : false,
      })
      setName('')
      setEmail('')
      setDueDate('')
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign')
    } finally {
      setSubmitting(false)
    }
  }

  const playUrl = (assignmentId: string) =>
    `/play/${id}?assignment=${assignmentId}&name=${encodeURIComponent(
      assignments.find((a) => a.id === assignmentId)?.learnerName ?? ''
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
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/teach" className="text-sm text-slate-500 hover:text-slate-700">← Dashboard</Link>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Assign Learners</h1>
            <p className="text-sm text-slate-500">{simulation.meta.title}</p>
          </div>
          <Link
            to={`/analytics/${id}`}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
          >
            View Analytics
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <form onSubmit={handleAssign} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">New Assignment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Learner Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email (optional)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Due Date (optional)</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>
            {email.trim() && (
              <label className="flex items-center gap-2 sm:col-span-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                Send email invite to learner
              </label>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Assigning…' : 'Assign Learner'}
          </button>
        </form>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <h2 className="font-semibold text-slate-800 px-6 py-4 border-b border-slate-100">
            Assigned Learners ({assignments.length})
          </h2>
          {assignments.length === 0 ? (
            <p className="px-6 py-8 text-slate-500 text-sm text-center">No assignments yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {assignments.map((a) => (
                <li key={a.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{a.learnerName}</p>
                    {a.learnerEmail && (
                      <p className="text-xs text-slate-500">{a.learnerEmail}</p>
                    )}
                    {a.dueDate && (
                      <p className="text-xs text-slate-400">Due: {a.dueDate}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        a.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : a.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {a.status.replace('_', ' ')}
                    </span>
                    {a.status !== 'completed' && (
                      <Link
                        to={playUrl(a.id)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Play link →
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
