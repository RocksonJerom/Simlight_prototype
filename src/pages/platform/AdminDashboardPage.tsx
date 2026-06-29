import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { api } from '../../api/client'
import type { PlatformStats } from '../../types/platform'

function Kpi({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const inner = (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-extrabold text-slate-900 mt-2">{value}</p>
    </div>
  )
  return href ? <Link to={href}>{inner}</Link> : inner
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)

  useEffect(() => {
    api.getPlatformStats().then(setStats).catch(console.error)
  }, [])

  return (
    <AdminLayout title="Superadmin Dashboard" subtitle="Platform overview and quick actions">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Total Leads" value={stats?.leads ?? '—'} href="/admin/leads" />
        <Kpi label="Organizations" value={stats?.organizations ?? '—'} href="/admin/organizations" />
        <Kpi label="Courses" value={stats?.courses ?? '—'} href="/admin/courses" />
        <Kpi label="Simulations" value={stats?.simulations ?? '—'} href="/teach" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/leads/new" className="px-4 py-2 bg-[#005b7f] text-white text-sm font-semibold rounded-xl">
              + New Lead
            </Link>
            <Link to="/teach" className="px-4 py-2 border border-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50">
              Manage Simulations
            </Link>
            <Link to="/admin/courses" className="px-4 py-2 border border-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50">
              Course Catalog
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Activity</h2>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>Published simulations: <strong>{stats?.publishedSimulations ?? 0}</strong></li>
            <li>Active learners: <strong>{stats?.activeLearners ?? 0}</strong></li>
            <li>Conversions this month: <strong>{stats?.conversionsThisMonth ?? 0}</strong></li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
