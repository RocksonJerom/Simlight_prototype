import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { CATALOG_CATEGORIES } from '../../data/categories'
import { SearchBar } from '../catalog/SearchBar'

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold text-sm">
              SL
            </div>
            <span className="font-bold text-lg hidden sm:inline">SimLight</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link to="/" className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white">
              Home
            </Link>
            <Link
              to="/browse"
              className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              Browse
            </Link>
            {CATALOG_CATEGORIES.filter((c) => c.slug !== 'all').map((cat) => (
              <Link
                key={cat.slug}
                to={`/browse/${cat.slug}`}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
              >
                {cat.icon} {cat.name.split(' ')[0]}
              </Link>
            ))}
          </nav>

          <div className="flex-1 min-w-[200px] max-w-md">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isAuthenticated ? (
              <>
                <Link
                  to="/teach"
                  className="px-3 py-1.5 text-sm font-medium bg-violet-600 rounded-lg hover:bg-violet-500"
                >
                  Teach
                </Link>
                <Link to="/learn" className="px-3 py-1.5 text-sm text-slate-300 hover:text-white">
                  My sims
                </Link>
                <span className="text-xs text-slate-500 hidden lg:inline">{user?.name}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm text-slate-300 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm font-medium bg-cyan-600 rounded-lg hover:bg-cyan-500"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-800 bg-slate-950 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-3 gap-8 text-sm text-slate-400">
          <div>
            <p className="font-semibold text-white mb-2">SimLight</p>
            <p>Decision-based business simulations for learning through play.</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Explore</p>
            <ul className="space-y-1">
              <li><Link to="/browse" className="hover:text-cyan-400">All simulations</Link></li>
              <li><Link to="/browse/financial-literacy" className="hover:text-cyan-400">Financial literacy</Link></li>
              <li><Link to="/teach" className="hover:text-cyan-400">For faculty</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Create</p>
            <p>Faculty build simulations in 7 steps with AI — then publish to your class or the marketplace.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
