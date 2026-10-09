import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export function TeamPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('faculty')
  const [inviteUrl, setInviteUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setInviteUrl('')
    try {
      const res = await api.inviteColleague({ name: name.trim(), email: email.trim(), role })
      setInviteUrl(res.inviteUrl)
      setName('')
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="w-full max-w-[min(100%,90rem)] mx-auto px-4 sm:px-6 lg:px-10">
          <Link to="/teach" className="text-sm text-slate-500 hover:text-slate-700">← Dashboard</Link>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Invite Team Members</h1>
          <p className="text-sm text-slate-500">Add faculty or learners to your organization</p>
        </div>
      </header>

      <main className="w-full max-w-[min(100%,90rem)] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <form onSubmit={handleInvite} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="faculty">Faculty</option>
              <option value="learner">Learner</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {inviteUrl && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
              <p className="font-medium text-green-800">Invite sent (or logged)</p>
              <p className="text-green-700 break-all mt-1">{inviteUrl}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
      </main>
    </div>
  )
}
