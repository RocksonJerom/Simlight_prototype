import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Clean, Minimal Professional Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-extrabold text-sm shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              SL
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight block text-white group-hover:text-cyan-400 transition-colors">
                SimLight
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block -mt-1">
                Business Simulation Platform
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user?.role === 'faculty' || user?.role === 'admin' ? (
                  <Link
                    to="/teach"
                    className="px-4 py-2 text-xs font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl hover:bg-indigo-600/40 transition flex items-center gap-1.5"
                  >
                    <span>🏛️</span> Faculty Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/learn"
                    className="px-4 py-2 text-xs font-bold bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl hover:bg-cyan-600/40 transition flex items-center gap-1.5"
                  >
                    <span>🎓</span> Student Dashboard
                  </Link>
                )}

                <div className="hidden sm:block text-right">
                  <span className="text-xs font-bold text-slate-300 block">{user?.name}</span>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">{user?.role}</span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold bg-cyan-500 text-slate-950 rounded-xl hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Focused, Clean Footer */}
      <footer className="border-t border-slate-850 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} SimLight Platform · Decision-Driven Business Simulations (Capsim Inspired)</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-cyan-400 transition">Sign In</Link>
            <span>•</span>
            <Link to="/register" className="hover:text-cyan-400 transition">Register</Link>
            <span>•</span>
            <Link to="/learn" className="hover:text-cyan-400 transition">Student Access</Link>
            <span>•</span>
            <Link to="/teach" className="hover:text-cyan-400 transition">Faculty Access</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
