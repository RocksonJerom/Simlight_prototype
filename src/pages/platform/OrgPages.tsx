import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { api } from '../../api/client'
import type { OrgGroup, OrgMember, PlatformStats } from '../../types/platform'
import type { UserRole } from '../../types/auth'

export function OrgDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)

  useEffect(() => {
    api.getPlatformStats().then(setStats).catch(console.error)
  }, [])

  return (
    <AdminLayout title="Organization Dashboard" subtitle="Analytics and quick actions">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Simulations', value: stats?.simulations ?? 0 },
          { label: 'Published', value: stats?.publishedSimulations ?? 0 },
          { label: 'Learners', value: stats?.activeLearners ?? 0 },
          { label: 'Courses', value: stats?.courses ?? 0 },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-500 uppercase">{k.label}</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to="/teach" className="px-4 py-2 bg-[#005b7f] text-white text-sm font-semibold rounded-xl">
          Manage Simulations
        </Link>
        <Link to="/org/profile" className="px-4 py-2 border border-slate-300 text-sm font-semibold rounded-xl">
          Organization Profile
        </Link>
        <Link to="/team" className="px-4 py-2 border border-slate-300 text-sm font-semibold rounded-xl">
          Invite Team
        </Link>
      </div>
    </AdminLayout>
  )
}

export function OrgProfilePage() {
  const [tab, setTab] = useState<'members' | 'groups'>('members')
  const [members, setMembers] = useState<OrgMember[]>([])
  const [groups, setGroups] = useState<OrgGroup[]>([])
  const [memberForm, setMemberForm] = useState<{ name: string; email: string; role: UserRole }>({
    name: '',
    email: '',
    role: 'learner',
  })
  const [groupName, setGroupName] = useState('')

  const load = () => {
    api.listOrgMembers().then(setMembers).catch(console.error)
    api.listOrgGroups().then(setGroups).catch(console.error)
  }
  useEffect(() => { load() }, [])

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createOrgMember(memberForm)
    setMemberForm({ name: '', email: '', role: 'learner' })
    load()
  }

  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createOrgGroup(groupName)
    setGroupName('')
    load()
  }

  return (
    <AdminLayout title="Organization Profile" subtitle="Manage admins, faculty, participants, and groups">
      <div className="flex gap-2 mb-6">
        {(['members', 'groups'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${tab === t ? 'bg-[#005b7f] text-white' : 'bg-white border border-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'members' ? (
        <>
          <form onSubmit={addMember} className="flex flex-wrap gap-2 mb-4">
            <input placeholder="Name" required value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              className="px-3 py-2 border rounded-xl text-sm" />
            <input placeholder="Email" required type="email" value={memberForm.email}
              onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
              className="px-3 py-2 border rounded-xl text-sm" />
            <select value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as UserRole })}
              className="px-3 py-2 border rounded-xl text-sm">
              <option value="learner">Participant</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-[#005b7f] text-white text-sm font-semibold rounded-xl">+ Add</button>
          </form>
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b"><tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
              </tr></thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-slate-600">{m.email}</td>
                    <td className="px-4 py-3 capitalize">{m.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <form onSubmit={addGroup} className="flex gap-2 mb-4">
            <input placeholder="Group name" required value={groupName} onChange={(e) => setGroupName(e.target.value)}
              className="px-3 py-2 border rounded-xl text-sm flex-1" />
            <button type="submit" className="px-4 py-2 bg-[#005b7f] text-white text-sm font-semibold rounded-xl">+ Add Group</button>
          </form>
          <div className="grid md:grid-cols-2 gap-4">
            {groups.map((g) => (
              <div key={g.id} className="bg-white rounded-2xl border p-4">
                <p className="font-bold">{g.name}</p>
                <p className="text-sm text-slate-500">{g.memberCount} members</p>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
