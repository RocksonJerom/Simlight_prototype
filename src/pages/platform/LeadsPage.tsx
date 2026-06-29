import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { api } from '../../api/client'
import type { Lead } from '../../types/platform'

const statusClass: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-amber-100 text-amber-700',
  'IN PROGRESS': 'bg-violet-100 text-violet-700',
  CONVERTED: 'bg-green-100 text-green-700',
}

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const load = () => api.listLeads(q || undefined).then(setLeads).catch(console.error)
  useEffect(() => { load() }, [q])

  return (
    <AdminLayout title="Lead Management" subtitle="Sales pipeline — convert leads to organizations">
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          placeholder="Search leads…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-xl text-sm flex-1 min-w-[200px]"
        />
        <Link
          to="/admin/leads/new"
          className="px-4 py-2 bg-[#005b7f] text-white text-sm font-semibold rounded-xl"
        >
          + Create Lead
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Organization</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Contact</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Segment</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{lead.orgName}</td>
                <td className="px-4 py-3 text-slate-600">{lead.contactName}</td>
                <td className="px-4 py-3 text-slate-500">{lead.segment}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusClass[lead.status] ?? ''}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {lead.status !== 'CONVERTED' && (
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/leads/${lead.id}/convert`)}
                      className="text-[#005b7f] font-semibold hover:underline"
                    >
                      Convert
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}

export function CreateLeadPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    orgName: '',
    segment: 'Enterprise',
    contactName: '',
    contactEmail: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createLead(form)
      navigate('/admin/leads')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title="Create Lead" subtitle="Add a new sales lead">
      <form onSubmit={handleSubmit} className="max-w-lg bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {(['orgName', 'contactName', 'contactEmail'] as const).map((field) => (
          <label key={field} className="block">
            <span className="text-sm font-medium text-slate-700 capitalize">
              {field.replace(/([A-Z])/g, ' $1')}
            </span>
            <input
              required={field !== 'contactEmail'}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </label>
        ))}
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Segment</span>
          <select
            value={form.segment}
            onChange={(e) => setForm({ ...form, segment: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {['Enterprise', 'Startup', 'Partner', 'Education'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-5 py-2 bg-[#005b7f] text-white font-semibold rounded-xl disabled:opacity-50">
            {saving ? 'Saving…' : 'Create Lead'}
          </button>
          <Link to="/admin/leads" className="px-5 py-2 border border-slate-300 rounded-xl text-sm font-medium">
            Cancel
          </Link>
        </div>
      </form>
    </AdminLayout>
  )
}
