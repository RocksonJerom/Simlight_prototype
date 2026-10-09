import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/auth'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<UserRole>('learner')
  const [orgName, setOrgName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register({
        role,
        orgName: role === 'faculty' ? orgName : undefined,
        name,
        email,
        password,
        regNumber: role === 'learner' ? regNumber : undefined,
      })

      if (role === 'learner') {
        navigate('/learn', { replace: true })
      } else {
        navigate('/teach', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-slate-200 animate-in fade-in duration-300">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-extrabold mx-auto mb-3 shadow-md shadow-cyan-600/30">
            SL
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Your Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'learner'
              ? 'Access business simulations assigned to you by faculty'
              : 'Architect, manage, and assign simulations to students'}
          </p>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => setRole('learner')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'learner'
                ? 'bg-white text-cyan-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🎓</span> Student / Learner
          </button>
          <button
            type="button"
            onClick={() => setRole('faculty')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'faculty'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🏛️</span> Faculty / Educator
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'faculty' && (
            <label className="block">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Institution / Organization Name</span>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Stanford Graduate School of Business"
                required={role === 'faculty'}
                className="mt-1 w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </label>
          )}

          <label className="block">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === 'learner' ? 'e.g. Alex Morgan' : 'e.g. Prof. Robert Hayes'}
              required
              className="mt-1 w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@university.edu"
              required
              className="mt-1 w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
            />
            {role === 'learner' && (
              <span className="text-[11px] text-slate-500 mt-1 block">
                Simulations assigned to this email will automatically appear in your dashboard.
              </span>
            )}
          </label>

          {role === 'learner' && (
            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Student ID / Registration No.</span>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. REG-2026-8841"
                className="mt-1 w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-mono"
              />
            </label>
          )}

          <label className="block">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              placeholder="Minimum 6 characters"
              required
              className="mt-1 w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
            />
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50 text-sm ${
              role === 'learner'
                ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
            }`}
          >
            {loading ? 'Creating Account…' : role === 'learner' ? 'Join as Student' : 'Create Faculty Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-700 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
