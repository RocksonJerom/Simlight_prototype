import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getNavForUser } from '../../data/adminNav'

export function AdminLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const { user, organization, logout } = useAuth()
  const location = useLocation()
  const nav = user ? getNavForUser(user.role, organization?.slug) : []

  return (
    <div className="min-h-screen flex bg-[#f4f6fc]">
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col p-4 z-10">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#005b7f] to-[#008fbe] text-white flex items-center justify-center font-bold text-sm">
            S
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">SimLight Tech</p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path.split('?')[0]))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[#eef7fc] text-[#005b7f]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-200 pt-4 px-2">
          <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
          <p className="text-[10px] text-slate-500 truncate">{organization?.name}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 text-xs text-slate-500 hover:text-slate-800"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-64 min-h-screen">
        <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-5">
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </header>
        <main className="p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-[min(100%,90rem)]">{children}</div>
        </main>
      </div>
    </div>
  )
}
