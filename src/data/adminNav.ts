import type { UserRole } from '../types/auth'

export interface NavItem {
  label: string
  path: string
  icon: string
}

const superadminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: '📊' },
  { label: 'Lead Management', path: '/admin/leads', icon: '🎯' },
  { label: 'Organizations', path: '/admin/organizations', icon: '🏢' },
  { label: 'Course Management', path: '/admin/courses', icon: '📚' },
  { label: 'Simulations', path: '/teach', icon: '🎮' },
  { label: 'Taglines', path: '/admin/taglines', icon: '💬' },
  { label: 'Sim Roles', path: '/admin/sim-roles', icon: '👤' },
  { label: 'Public Portal', path: '/', icon: '🌐' },
]

const orgAdminNav: NavItem[] = [
  { label: 'Org Dashboard', path: '/org', icon: '📊' },
  { label: 'Organization Profile', path: '/org/profile', icon: '🏢' },
  { label: 'Simulations', path: '/teach', icon: '🎮' },
  { label: 'Courses', path: '/admin/courses', icon: '📚' },
  { label: 'Sim Roles', path: '/admin/sim-roles', icon: '👤' },
  { label: 'Team', path: '/team', icon: '👥' },
]

const facultyNav: NavItem[] = [
  { label: 'Faculty Dashboard', path: '/teach', icon: '📊' },
  { label: 'Create Simulation', path: '/teach?create=1', icon: '✨' },
  { label: 'User Management', path: '/org/profile', icon: '👥' },
  { label: 'Courses', path: '/admin/courses', icon: '📚' },
  { label: 'Sim Roles', path: '/admin/sim-roles', icon: '👤' },
  { label: 'Team', path: '/team', icon: '🤝' },
]

const studentNav: NavItem[] = [
  { label: 'My Dashboard', path: '/learn', icon: '📊' },
  { label: 'Browse Sims', path: '/browse', icon: '🔍' },
  { label: 'Public Home', path: '/', icon: '🌐' },
]

export function getNavForUser(role: UserRole, orgSlug?: string): NavItem[] {
  if (role === 'learner') return studentNav
  if (role === 'faculty') return facultyNav
  if (role === 'admin' && orgSlug === 'simlight-platform') return superadminNav
  if (role === 'admin') return orgAdminNav
  return facultyNav
}

export function getDefaultPath(role: UserRole, orgSlug?: string): string {
  if (role === 'learner') return '/learn'
  if (role === 'faculty') return '/teach'
  if (role === 'admin' && orgSlug === 'simlight-platform') return '/admin'
  if (role === 'admin') return '/org'
  return '/teach'
}
