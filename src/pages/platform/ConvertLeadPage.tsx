import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { api } from '../../api/client'
import type { Course, Lead } from '../../types/platform'

export function ConvertLeadPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lead, setLead] = useState<Lead | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [form, setForm] = useState({
    adminSlots: 5,
    participantCapacity: 100,
    aiLimit: 5000,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getLead(id).then(setLead).catch(console.error)
    api.listCourses().then(setCourses).catch(console.error)
  }, [id])

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId) ? prev.filter((c) => c !== courseId) : [...prev, courseId]
    )
  }

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      await api.convertLead(id, { ...form, courseIds: selectedCourses })
      navigate('/admin/organizations')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Conversion failed')
    } finally {
      setSaving(false)
    }
  }

  if (!lead) {
    return (
      <AdminLayout title="Convert Lead">
        <p className="text-slate-500">Loading…</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Convert Lead" subtitle={`${lead.orgName} → new organization`}>
      <form onSubmit={handleConvert} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Organization Admin</h2>
            {(['adminName', 'adminEmail', 'adminPassword'] as const).map((field) => (
              <label key={field} className="block">
                <span className="text-sm font-medium text-slate-700">
                  {field === 'adminPassword' ? 'Admin Password' : field === 'adminEmail' ? 'Admin Email' : 'Admin Name'}
                </span>
                <input
                  type={field === 'adminPassword' ? 'password' : field === 'adminEmail' ? 'email' : 'text'}
                  required
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </label>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-4">Assign Courses</h2>
            <div className="space-y-2">
              {courses.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(c.id)}
                    onChange={() => toggleCourse(c.id)}
                  />
                  <div>
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.category} · {c.courseType}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 h-fit sticky top-24 space-y-4">
          <h2 className="font-bold text-slate-900">Conversion Summary</h2>
          <p className="text-sm text-slate-600">Lead: <strong>{lead.orgName}</strong></p>
          <p className="text-sm text-slate-600">Courses: <strong>{selectedCourses.length}</strong></p>
          <label className="block text-sm">
            Admin slots
            <input type="number" min={1} value={form.adminSlots}
              onChange={(e) => setForm({ ...form, adminSlots: +e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </label>
          <label className="block text-sm">
            Participant capacity
            <input type="number" min={10} value={form.participantCapacity}
              onChange={(e) => setForm({ ...form, participantCapacity: +e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </label>
          <label className="block text-sm">
            AI limit
            <input type="number" min={100} value={form.aiLimit}
              onChange={(e) => setForm({ ...form, aiLimit: +e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </label>
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-[#005b7f] text-white font-semibold rounded-xl disabled:opacity-50">
            {saving ? 'Converting…' : 'Confirm Conversion'}
          </button>
          <Link to="/admin/leads" className="block text-center text-sm text-slate-500 hover:text-slate-700">
            Cancel
          </Link>
        </div>
      </form>
    </AdminLayout>
  )
}
