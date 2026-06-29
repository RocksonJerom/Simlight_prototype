import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../types/auth'
import { getDefaultPath } from '../../data/adminNav'

export function RoleRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: UserRole[]
}) {
  const { isAuthenticated, loading, user, organization } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={getDefaultPath(user.role, organization?.slug)} replace />
  }

  return children
}

export function PlatformAdminRoute({ children }: { children: React.ReactNode }) {
  const { organization, user } = useAuth()
  if (organization?.slug !== 'simlight-platform') {
    return <Navigate to={getDefaultPath(user!.role, organization?.slug)} replace />
  }
  return <RoleRoute roles={['admin']}>{children}</RoleRoute>
}

export function OrgAdminRoute({ children }: { children: React.ReactNode }) {
  const { organization } = useAuth()
  if (organization?.slug === 'simlight-platform') {
    return <Navigate to="/admin" replace />
  }
  return <RoleRoute roles={['admin']}>{children}</RoleRoute>
}
