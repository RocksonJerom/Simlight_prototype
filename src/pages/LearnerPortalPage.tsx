import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { AdminLayout } from '../components/layout/AdminLayout'
import type { Assignment } from '../types/simulation'

export function LearnerPortalPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listLearnerAssignments()
      .then(setAssignments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const pending = assignments.filter((a) => a.status !== 'completed')
  const completed = assignments.filter((a) => a.status === 'completed')

  return (
    <AdminLayout title="Student Dashboard" subtitle={`Welcome, ${user?.name ?? 'Learner'}`}>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Assigned</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{pending.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Completed</p>
          <p className="text-3xl font-extrabold text-green-600 mt-2">{completed.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Browse</p>
          <Link to="/browse" className="text-sm font-semibold text-[#005b7f] mt-3 inline-block hover:underline">
            Public catalog →
          </Link>
        </div>
      </div>

      <h2 className="font-bold text-slate-900 mb-4">Active Assignments</h2>
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 mb-8">
          No active assignments. Check back when faculty assigns a simulation.
        </div>
      ) : (
        <ul className="space-y-3 mb-8">
          {pending.map((a) => (
            <li key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">Simulation assignment</p>
                {a.dueDate && <p className="text-xs text-slate-500">Due: {a.dueDate}</p>}
                <span className="text-xs text-slate-400 capitalize">{a.status.replace('_', ' ')}</span>
              </div>
              <Link
                to={`/play/${a.simulationId}?assignment=${a.id}&name=${encodeURIComponent(a.learnerName)}`}
                className="px-4 py-2 bg-[#005b7f] text-white text-sm font-medium rounded-lg"
              >
                Start Simulation
              </Link>
            </li>
          ))}
        </ul>
      )}

      {completed.length > 0 && (
        <>
          <h2 className="font-bold text-slate-900 mb-4">Completed</h2>
          <ul className="space-y-2">
            {completed.map((a) => (
              <li key={a.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                ✓ Completed — {a.learnerName}
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminLayout>
  )
}
