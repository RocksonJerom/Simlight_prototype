import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.forgotPassword(email.trim())
      setSent(true)
    } catch {
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset password</h1>
        {sent ? (
          <p className="text-sm text-slate-600">
            If that email exists, we sent a reset link. Check the server console if SMTP is not configured.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full px-4 py-3 border border-slate-300 rounded-xl"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/login" className="text-violet-600 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
