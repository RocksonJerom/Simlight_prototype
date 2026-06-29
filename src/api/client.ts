import type {
  SimulationRecord,
  PlaySession,
  Assignment,
  SimulationAnalytics,
  AiGenerationSource,
} from '../types/simulation'
import type { User, Organization, LoginRequest, RegisterRequest } from '../types/auth'
import type {
  MarketplaceItem,
  OrgInvite,
  PublicSimulationDetail,
  CatalogHome,
  CatalogCategory,
} from '../types/extras'
import type {
  Lead,
  Course,
  Tagline,
  SimJobRole,
  OrgGroup,
  OrgMember,
  PlatformStats,
  ConvertLeadInput,
} from '../types/platform'

export interface AiStatus {
  provider: AiGenerationSource
  configured: boolean
  openai: boolean
  anthropic: boolean
  nvidia: boolean
  groq: boolean
  model: string | null
  message: string
}

export interface GenerationResponse {
  simulation: SimulationRecord
  generation: {
    source: AiGenerationSource
    usedFallback: boolean
    error?: string
  }
}

export interface DecideResponse {
  session: PlaySession
  simulation: SimulationRecord
  aiFeedback?: string
  metricDeltas?: Record<string, number>
}

export interface PlayRoom {
  id: string
  code: string
  simulationId: string
  hostName: string
  maxPlayers: number
  players: { id: string; name: string; sessionId?: string }[]
  status: 'waiting' | 'playing' | 'finished'
  createdAt: string
}

const BASE = '/api'
let authToken: string | null = null

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData
  const headers: Record<string, string> = isFormData
    ? { ...(options?.headers as Record<string, string>) }
    : { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) }

  if (authToken) headers.Authorization = `Bearer ${authToken}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

async function requestText(path: string, options?: RequestInit): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (authToken) headers.Authorization = `Bearer ${authToken}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  return res.text()
}

export const api = {
  setToken: (token: string | null) => {
    authToken = token
  },

  login: (data: LoginRequest) =>
    request<{ token: string; user: User; organization: Organization }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    request<{ token: string; user: User; organization: Organization }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<{ user: User; organization: Organization }>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  inviteColleague: (data: { email: string; name: string; role?: string }) =>
    request<{ invite: OrgInvite; inviteUrl: string }>('/auth/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInvite: (token: string) =>
    request<{ invite: OrgInvite; organization: Organization }>(`/auth/invite/${token}`),

  listLearnerAssignments: () => request<Assignment[]>('/auth/assignments'),

  listSimulations: () => request<SimulationRecord[]>('/simulations'),

  getSimulation: (id: string) => request<SimulationRecord>(`/simulations/${id}`),

  createSimulation: (meta?: Partial<SimulationRecord['meta']>) =>
    request<SimulationRecord>('/simulations', {
      method: 'POST',
      body: JSON.stringify({ meta }),
    }),

  updateSimulation: (id: string, data: Partial<SimulationRecord>) =>
    request<SimulationRecord>(`/simulations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteSimulation: (id: string) =>
    request<void>(`/simulations/${id}`, { method: 'DELETE' }),

  duplicateSimulation: (id: string) =>
    request<SimulationRecord>(`/simulations/${id}/duplicate`, { method: 'POST' }),

  generateContent: (id: string) =>
    request<GenerationResponse>(`/simulations/${id}/generate`, { method: 'POST' }),

  generateFromDocument: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<GenerationResponse & { documentChars?: number }>(
      `/simulations/${id}/generate-from-document`,
      { method: 'POST', body: form }
    )
  },

  generateContentBlocks: (
    simulationId: string,
    eventId: string,
    opts?: { mode?: 'all' | 'text' | 'table' | 'chart'; replace?: boolean }
  ) =>
    request<{ contentBlocks: import('../types/simulation').ContentBlock[]; simulation: SimulationRecord }>(
      `/simulations/${simulationId}/generate-content-blocks`,
      {
        method: 'POST',
        body: JSON.stringify({ eventId, mode: opts?.mode ?? 'all', replace: opts?.replace ?? false }),
      }
    ),

  generateEventQuestions: (simulationId: string, eventId: string) =>
    request<{ decisions: string[] }>(`/simulations/${simulationId}/generate-questions`, {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    }),

  getAiStatus: () => request<AiStatus>('/ai/status'),

  publishSimulation: (id: string, visibility?: SimulationRecord['visibility']) =>
    request<SimulationRecord>(`/simulations/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ visibility }),
    }),

  listSessions: (simulationId: string) =>
    request<PlaySession[]>(`/simulations/${simulationId}/sessions`),

  startSession: (
    simulationId: string,
    learnerName: string,
    opts?: {
      assignmentId?: string
      playToken?: string
      resumeSessionId?: string
      userId?: string
      roomCode?: string
    }
  ) =>
    request<PlaySession>(`/simulations/${simulationId}/sessions`, {
      method: 'POST',
      body: JSON.stringify({ learnerName, ...opts }),
    }),

  getSession: (sessionId: string) =>
    request<{ session: PlaySession; simulation: SimulationRecord }>(`/sessions/${sessionId}`),

  makeDecision: (sessionId: string, decisionId: string) =>
    request<DecideResponse>(`/sessions/${sessionId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decisionId }),
    }),

  uploadAsset: (simulationId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ asset: SimulationRecord['assets'][0]; simulation: SimulationRecord }>(
      `/simulations/${simulationId}/upload`,
      { method: 'POST', body: form }
    )
  },

  deleteAsset: (simulationId: string, assetId: string) =>
    request<SimulationRecord>(`/simulations/${simulationId}/assets/${assetId}`, {
      method: 'DELETE',
    }),

  listAssignments: (simulationId: string) =>
    request<Assignment[]>(`/simulations/${simulationId}/assignments`),

  createAssignment: (
    simulationId: string,
    data: { learnerName: string; learnerEmail?: string; dueDate?: string; sendEmail?: boolean }
  ) =>
    request<{ assignment: Assignment; playUrl: string }>(`/simulations/${simulationId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAnalytics: (simulationId: string) =>
    request<SimulationAnalytics>(`/simulations/${simulationId}/analytics`),

  exportAnalyticsCsv: (simulationId: string) =>
    requestText(`/simulations/${simulationId}/analytics/export`),

  listMarketplace: () => request<MarketplaceItem[]>('/marketplace'),

  searchMarketplace: (params?: {
    q?: string
    category?: string
    difficulty?: string
    industry?: string
    domain?: string
    sort?: 'new' | 'popular' | 'title'
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.category) qs.set('category', params.category)
    if (params?.difficulty) qs.set('difficulty', params.difficulty)
    if (params?.industry) qs.set('industry', params.industry)
    if (params?.domain) qs.set('domain', params.domain)
    if (params?.sort) qs.set('sort', params.sort)
    if (params?.limit) qs.set('limit', String(params.limit))
    const query = qs.toString()
    return request<MarketplaceItem[]>(`/marketplace${query ? `?${query}` : ''}`)
  },

  getCatalogHome: () => request<CatalogHome>('/marketplace/home'),

  getCatalogCategories: () => request<CatalogCategory[]>('/marketplace/categories'),

  getPublicSimulation: (id: string) => request<PublicSimulationDetail>(`/marketplace/${id}`),

  getPlayMeta: (simulationId: string, opts?: { token?: string; assignment?: string }) => {
    const qs = new URLSearchParams()
    if (opts?.token) qs.set('token', opts.token)
    if (opts?.assignment) qs.set('assignment', opts.assignment)
    const query = qs.toString()
    return request<{ title: string; playMode: 'single' | 'multiplayer'; maxPlayers: number }>(
      `/simulations/${simulationId}/play-meta${query ? `?${query}` : ''}`
    )
  },

  createRoom: (simulationId: string, hostName: string, maxPlayers?: number) =>
    request<PlayRoom>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ simulationId, hostName, maxPlayers }),
    }),

  getRoom: (code: string) => request<PlayRoom>(`/rooms/${code}`),

  joinRoom: (code: string, playerName: string) =>
    request<PlayRoom>(`/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    }),

  getPlatformStats: () => request<PlatformStats>('/platform/stats'),

  listLeads: (q?: string) =>
    request<Lead[]>(`/platform/leads${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  getLead: (id: string) => request<Lead>(`/platform/leads/${id}`),

  createLead: (data: {
    orgName: string
    segment: string
    contactName: string
    contactEmail?: string
    notes?: string
  }) =>
    request<Lead>('/platform/leads', { method: 'POST', body: JSON.stringify(data) }),

  convertLead: (id: string, data: ConvertLeadInput) =>
    request<{ lead: Lead; orgId: string }>(`/platform/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listOrganizations: () =>
    request<
      {
        id: string
        name: string
        slug: string
        createdAt: string
        adminSlots: number
        participantCapacity: number
        aiLimit: number
        userCount: number
        simCount: number
      }[]
    >('/platform/organizations'),

  listCourses: () => request<Course[]>('/platform/courses'),

  createCourse: (data: { name: string; category: string; courseType?: Course['courseType'] }) =>
    request<Course>('/platform/courses', { method: 'POST', body: JSON.stringify(data) }),

  listTaglines: () => request<Tagline[]>('/platform/taglines'),

  createTagline: (text: string) =>
    request<Tagline>('/platform/taglines', { method: 'POST', body: JSON.stringify({ text }) }),

  listSimJobRoles: () => request<SimJobRole[]>('/platform/sim-roles'),

  createSimJobRole: (name: string, description?: string) =>
    request<SimJobRole>('/platform/sim-roles', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  listOrgGroups: () => request<OrgGroup[]>('/platform/org/groups'),

  createOrgGroup: (name: string, description?: string) =>
    request<OrgGroup>('/platform/org/groups', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  listOrgMembers: () => request<OrgMember[]>('/platform/org/members'),

  createOrgMember: (data: {
    name: string
    email: string
    role?: OrgMember['role']
    groupId?: string
  }) =>
    request<OrgMember>('/platform/org/members', { method: 'POST', body: JSON.stringify(data) }),
}
