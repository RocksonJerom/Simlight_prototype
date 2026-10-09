import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { SimulationAnalytics } from '../types/simulation'
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard'

export function AnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<SimulationAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api
      .getAnalytics(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading analytics…</div>
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p>Analytics not found.</p>
        <Link to="/teach" className="text-violet-600">Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-[#005b7f] text-white px-6 py-5">
        <div className="w-full max-w-[min(100%,90rem)] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between">
          <div>
            <Link to={`/assign/${id}`} className="text-sm text-cyan-200 hover:text-white">
              ← Back to Assignments
            </Link>
            <h1 className="text-xl font-bold mt-1">Analytics Dashboard</h1>
            <p className="text-sm text-cyan-100/80">{data.title}</p>
          </div>
          {id && (
            <button
              type="button"
              onClick={async () => {
                const csv = await api.exportAnalyticsCsv(id)
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `analytics-${id}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="px-4 py-2 bg-white/10 border border-white/30 text-white text-sm font-medium rounded-lg hover:bg-white/20"
            >
              Export CSV
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-[min(100%,90rem)] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <AnalyticsDashboard data={data} />

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <h2 className="font-semibold text-slate-800 px-6 py-4 border-b border-slate-100">
            All Sessions
          </h2>
          {data.sessions.length === 0 ? (
            <p className="px-6 py-8 text-slate-500 text-sm text-center">No play sessions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-slate-600">Learner</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-600">Score</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-600">Budget</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-600">Risk</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-600">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sessions.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-6 py-3 font-medium">{s.learnerName}</td>
                      <td className="px-6 py-3">{s.score}</td>
                      <td className="px-6 py-3">{s.budget}%</td>
                      <td className="px-6 py-3">{s.risk}%</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.completed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {s.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {new Date(s.startedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
