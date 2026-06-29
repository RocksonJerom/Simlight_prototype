import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RoleRoute, PlatformAdminRoute, OrgAdminRoute } from './components/auth/RoleRoute'
import { HomePage } from './pages/HomePage'
import { BrowsePage } from './pages/BrowsePage'
import { SimulationDetailPage } from './pages/SimulationDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { CreatorPage } from './pages/CreatorPage'
import { PlayLandingPage } from './pages/PlayLandingPage'
import { LearnerPlayerPage } from './pages/LearnerPlayerPage'
import { AssignPage } from './pages/AssignPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { TeamPage } from './pages/TeamPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { LearnerPortalPage } from './pages/LearnerPortalPage'
import { AdminDashboardPage } from './pages/platform/AdminDashboardPage'
import { LeadsPage, CreateLeadPage } from './pages/platform/LeadsPage'
import { ConvertLeadPage } from './pages/platform/ConvertLeadPage'
import { OrganizationsPage, CoursesPage, TaglinesPage, SimJobRolesPage } from './pages/platform/CatalogPages'
import { OrgDashboardPage, OrgProfilePage } from './pages/platform/OrgPages'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/browse/:category" element={<BrowsePage />} />
          <Route path="/sim/:id" element={<SimulationDetailPage />} />
          <Route path="/marketplace" element={<Navigate to="/browse" replace />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/play/:id" element={<PlayLandingPage />} />
          <Route path="/session/:sessionId" element={<LearnerPlayerPage />} />

          <Route path="/learner" element={<Navigate to="/learn" replace />} />

          {/* Superadmin (platform) */}
          <Route path="/admin" element={<PlatformAdminRoute><AdminDashboardPage /></PlatformAdminRoute>} />
          <Route path="/admin/leads" element={<PlatformAdminRoute><LeadsPage /></PlatformAdminRoute>} />
          <Route path="/admin/leads/new" element={<PlatformAdminRoute><CreateLeadPage /></PlatformAdminRoute>} />
          <Route path="/admin/leads/:id/convert" element={<PlatformAdminRoute><ConvertLeadPage /></PlatformAdminRoute>} />
          <Route path="/admin/organizations" element={<PlatformAdminRoute><OrganizationsPage /></PlatformAdminRoute>} />
          <Route path="/admin/courses" element={<RoleRoute roles={['faculty', 'admin']}><CoursesPage /></RoleRoute>} />
          <Route path="/admin/taglines" element={<PlatformAdminRoute><TaglinesPage /></PlatformAdminRoute>} />
          <Route path="/admin/sim-roles" element={<RoleRoute roles={['faculty', 'admin']}><SimJobRolesPage /></RoleRoute>} />

          {/* Org admin */}
          <Route path="/org" element={<OrgAdminRoute><OrgDashboardPage /></OrgAdminRoute>} />
          <Route path="/org/profile" element={<RoleRoute roles={['faculty', 'admin']}><OrgProfilePage /></RoleRoute>} />

          {/* Faculty */}
          <Route path="/teach" element={<RoleRoute roles={['faculty', 'admin']}><DashboardPage /></RoleRoute>} />
          <Route path="/creator/:id" element={<RoleRoute roles={['faculty', 'admin']}><CreatorPage /></RoleRoute>} />
          <Route path="/assign/:id" element={<RoleRoute roles={['faculty', 'admin']}><AssignPage /></RoleRoute>} />
          <Route path="/analytics/:id" element={<RoleRoute roles={['faculty', 'admin']}><AnalyticsPage /></RoleRoute>} />
          <Route path="/team" element={<RoleRoute roles={['faculty', 'admin']}><TeamPage /></RoleRoute>} />

          {/* Student / learner */}
          <Route path="/learn" element={<RoleRoute roles={['learner', 'faculty', 'admin']}><LearnerPortalPage /></RoleRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
