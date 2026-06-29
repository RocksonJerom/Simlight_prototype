import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { api } from '../../api/client'

export function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Awaited<ReturnType<typeof api.listOrganizations>>>([])

  useEffect(() => {
    api.listOrganizations().then(setOrgs).catch(console.error)
  }, [])

  return (
    <AdminLayout title="Organizations" subtitle="Registered institutions">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Users</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Simulations</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Capacity</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">AI Limit</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold">{o.name}</td>
                <td className="px-4 py-3">{o.userCount}</td>
                <td className="px-4 py-3">{o.simCount}</td>
                <td className="px-4 py-3">{o.participantCapacity}</td>
                <td className="px-4 py-3">{o.aiLimit.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}

export function CoursesPage() {
  const [courses, setCourses] = useState<Awaited<ReturnType<typeof api.listCourses>>>([])
  const [form, setForm] = useState({ name: '', category: '', courseType: 'Core' as const })

  const load = () => api.listCourses().then(setCourses).catch(console.error)
  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createCourse(form)
    setForm({ name: '', category: '', courseType: 'Core' })
    load()
  }

  return (
    <AdminLayout title="Course Management" subtitle="Catalog of courses for organizations">
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-6">
        <input placeholder="Course name" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 border rounded-xl text-sm" />
        <input placeholder="Category" required value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="px-3 py-2 border rounded-xl text-sm" />
        <select value={form.courseType} onChange={(e) => setForm({ ...form, courseType: e.target.value as 'Core' })}
          className="px-3 py-2 border rounded-xl text-sm">
          <option>Core</option><option>Elective</option><option>Advanced</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-[#005b7f] text-white text-sm font-semibold rounded-xl">+ Add</button>
      </form>
      <div className="grid md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="font-bold text-slate-900">{c.name}</p>
            <p className="text-sm text-slate-500">{c.category} · {c.courseType}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}

export function TaglinesPage() {
  const [taglines, setTaglines] = useState<Awaited<ReturnType<typeof api.listTaglines>>>([])
  const [text, setText] = useState('')

  const load = () => api.listTaglines().then(setTaglines).catch(console.error)
  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createTagline(text)
    setText('')
    load()
  }

  return (
    <AdminLayout title="Tagline Management" subtitle="Branding taglines for simulations">
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input placeholder="New tagline" required value={text} onChange={(e) => setText(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-xl text-sm" />
        <button type="submit" className="px-4 py-2 bg-[#005b7f] text-white text-sm font-semibold rounded-xl">+ Add</button>
      </form>
      <ul className="space-y-2">
        {taglines.map((t) => (
          <li key={t.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-800">
            {t.text}
          </li>
        ))}
      </ul>
    </AdminLayout>
  )
}

export function SimJobRolesPage() {
  const [roles, setRoles] = useState<Awaited<ReturnType<typeof api.listSimJobRoles>>>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const load = () => api.listSimJobRoles().then(setRoles).catch(console.error)
  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createSimJobRole(name, description)
    setName('')
    setDescription('')
    load()
  }

  return (
    <AdminLayout title="Simulation Roles" subtitle="Job roles learners play (e.g. Supply Manager)">
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-6">
        <input placeholder="Role name" required value={name} onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm" />
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm flex-1 min-w-[200px]" />
        <button type="submit" className="px-4 py-2 bg-[#005b7f] text-white text-sm font-semibold rounded-xl">+ Add</button>
      </form>
      <div className="grid md:grid-cols-2 gap-4">
        {roles.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="font-bold text-slate-900">{r.name}</p>
            {r.description && <p className="text-sm text-slate-500 mt-1">{r.description}</p>}
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
