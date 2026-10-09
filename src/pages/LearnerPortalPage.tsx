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

  const getPlayUrl = (a: Assignment) => {
    const isV2 = a.simulationId.startsWith('v2-') || !a.simulationId.includes('-wizard-')
    const prefix = isV2 ? '/v2/play' : '/play'
    const name = encodeURIComponent(a.learnerName || user?.name || 'Student')
    const reg = encodeURIComponent(a.regNumber || '')
    return `${prefix}/${a.simulationId}?assignment=${a.id}&name=${name}&regNumber=${reg}`
  }

  return (
    <AdminLayout
      title="Student Dashboard"
      subtitle={`Welcome, ${user?.name ?? 'Student'} • ${user?.email ?? ''}`}
    >
      {/* Top Metrics Cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned by Faculty</p>
            <p className="text-3xl font-extrabold text-cyan-900 mt-1">{pending.length}</p>
            <p className="text-xs text-slate-400 mt-1">Pending student action</p>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-xl text-cyan-600">
            ⏳
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Reports</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{completed.length}</p>
            <p className="text-xs text-slate-400 mt-1">Personal performance evaluations</p>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl text-emerald-600">
            📊
          </span>
        </div>
      </div>

      {/* Primary Section: Simulations assigned to you by faculty */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <span>🎯</span> Simulations assigned to you by faculty
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Access and play simulations assigned specifically to your student email ({user?.email})
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full">
            {pending.length} Active
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm space-y-3">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Loading your assigned simulations…</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 shadow-sm space-y-3">
            <p className="text-4xl">📂</p>
            <h3 className="text-base font-bold text-slate-800">No Simulations Assigned Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              When faculty assigns a business simulation to your registered email (<span className="font-mono text-slate-700">{user?.email}</span>), it will appear here with scenario briefings and decision controls.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {pending.map((a) => (
              <li
                key={a.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-5 shadow-sm hover:shadow-md transition"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                      Assigned by Faculty
                    </span>
                    {a.regNumber && (
                      <span className="text-xs bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded">
                        Student ID: {a.regNumber}
                      </span>
                    )}
                    <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {a.status === 'pending' ? 'Not Started' : a.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">
                    {a.simulationTitle || 'Capsim-Style Business Flight Simulation'}
                  </h3>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span><strong>Student:</strong> {a.learnerName}</span>
                    <span><strong>Email:</strong> {a.learnerEmail || user?.email}</span>
                    {a.dueDate && (
                      <span className="text-amber-700 font-medium">
                        <strong>Due Date:</strong> {a.dueDate}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to={getPlayUrl(a)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>▶ Play Simulation</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Completed Performance Reports */}
      {completed.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <span>📋</span> Your Completed Simulation Reports
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your scores, operational decisions, and executive performance analysis
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              {completed.length} Completed
            </span>
          </div>

          <ul className="space-y-3">
            {completed.map((a) => (
              <li
                key={a.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {a.simulationTitle || 'Capsim Business Simulation'}
                    </h3>
                    {a.regNumber && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded">
                        ID: {a.regNumber}
                      </span>
                    )}
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                      ✓ Submitted
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Completed for {a.learnerName} ({a.learnerEmail || user?.email})</p>
                </div>

                {a.sessionId ? (
                  <Link
                    to={`/report/${a.sessionId}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>📄 View Performance Report</span>
                  </Link>
                ) : (
                  <span className="text-xs text-slate-400">Report archiving…</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminLayout>
  )
}
