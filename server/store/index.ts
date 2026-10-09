import { getDatabaseKind } from '../config.js'
import { getDatabase } from '../database.js'
import { initPostgres } from '../pg/pool.js'
import * as sqliteDb from '../db.js'
import * as sqliteUsers from '../users.js'

export async function initStore(): Promise<void> {
  if (getDatabaseKind() === 'postgres') {
    await initPostgres()
  } else {
    getDatabase()
  }
}

export function getDbKind() {
  return getDatabaseKind()
}

// Re-export all store operations — SQLite sync wrapped in promises when needed
export const store = {
  listSimulations: (orgId: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.listSimulations(orgId))
      : Promise.resolve(sqliteDb.listSimulations(orgId)),

  getSimulation: (id: string, opts?: { orgId?: string; allowPublic?: boolean }) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.getSimulation(id, opts))
      : Promise.resolve(sqliteDb.getSimulation(id, opts)),

  createSimulation: (
    meta: Parameters<typeof sqliteDb.createSimulation>[0],
    orgId: string = 'default-org',
    userId: string = 'default-user',
    v2Data?: any
  ) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.createSimulation(meta, orgId, userId))
      : Promise.resolve(sqliteDb.createSimulation(meta, orgId, userId, v2Data)),

  updateSimulation: (
    id: string,
    orgId: string,
    updates: Parameters<typeof sqliteDb.updateSimulation>[2]
  ) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.updateSimulation(id, orgId, updates))
      : Promise.resolve(sqliteDb.updateSimulation(id, orgId, updates)),

  deleteSimulation: (id: string, orgId: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.deleteSimulation(id, orgId))
      : Promise.resolve(sqliteDb.deleteSimulation(id, orgId)),

  addAsset: (
    simulationId: string,
    orgId: string,
    file: Parameters<typeof sqliteDb.addAsset>[2],
    type: Parameters<typeof sqliteDb.addAsset>[3]
  ) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.addAsset(simulationId, orgId, file, type))
      : Promise.resolve(sqliteDb.addAsset(simulationId, orgId, file, type)),

  deleteAsset: (simulationId: string, orgId: string, assetId: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.deleteAsset(simulationId, orgId, assetId))
      : Promise.resolve(sqliteDb.deleteAsset(assetId)),

  createAssignment: (
    simulationId: string,
    orgId: string,
    data: Parameters<typeof sqliteDb.createAssignment>[2]
  ) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.createAssignment(simulationId, orgId, data))
      : Promise.resolve(sqliteDb.createAssignment(simulationId, orgId, data)),

  listAssignments: (simulationId: string, orgId: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.listAssignments(simulationId, orgId))
      : Promise.resolve(sqliteDb.listAssignments(simulationId, orgId)),

  getAssignment: (id: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.getAssignment(id))
      : Promise.resolve(sqliteDb.getAssignment(id)),

  createSession: (
    simulationId: string,
    learnerName: string,
    assignmentId?: string,
    userId?: string,
    regNumber?: string
  ) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.createSession(simulationId, learnerName, assignmentId, userId))
      : Promise.resolve(sqliteDb.createSession(simulationId, learnerName, assignmentId, userId, regNumber)),

  getSession: (id: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.getSession(id))
      : Promise.resolve(sqliteDb.getSession(id)),

  getSessionReport: (sessionId: string) =>
    Promise.resolve(sqliteDb.getSessionReport(sessionId)),

  updateReportConfig: (simulationId: string, orgId: string, config: any) =>
    Promise.resolve(sqliteDb.updateReportConfig(simulationId, orgId, config)),

  listLearnerAssignments: (userId: string, userEmail?: string) =>
    Promise.resolve(sqliteDb.listLearnerAssignments(userId, userEmail)),

  updateSession: (id: string, updates: Parameters<typeof sqliteDb.updateSession>[1]) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.updateSession(id, updates))
      : Promise.resolve(sqliteDb.updateSession(id, updates)),

  listSessionsForSimulation: (simulationId: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.listSessionsForSimulation(simulationId))
      : Promise.resolve(sqliteDb.listSessionsForSimulation(simulationId)),

  getAnalytics: (simulationId: string, orgId: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.getAnalytics(simulationId, orgId))
      : Promise.resolve(sqliteDb.getAnalytics(simulationId, orgId)),

  publishSimulation: (
    id: string,
    orgId: string,
    visibility?: Parameters<typeof sqliteDb.publishSimulation>[2]
  ) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.publishSimulation(id, orgId, visibility))
      : Promise.resolve(sqliteDb.publishSimulation(id, orgId, visibility)),

  duplicateSimulation: (id: string, orgId: string, userId: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.duplicateSimulation(id, orgId, userId))
      : Promise.resolve(sqliteDb.duplicateSimulation(id, orgId, userId)),

  listMarketplace: () =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.listMarketplace())
      : Promise.resolve(sqliteDb.listMarketplace()),

  searchMarketplace: (filters: Parameters<typeof sqliteDb.searchMarketplace>[0]) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.searchMarketplace(filters))
      : Promise.resolve(sqliteDb.searchMarketplace(filters)),

  getCatalogHome: () =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.getCatalogHome())
      : Promise.resolve(sqliteDb.getCatalogHome()),

  getPublicSimulationDetail: (id: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.getPublicSimulationDetail(id))
      : Promise.resolve(sqliteDb.getPublicSimulationDetail(id)),

  getCategoryList: () =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.getCategoryList())
      : Promise.resolve(sqliteDb.getCategoryList()),

  exportAnalyticsCsv: (simulationId: string, orgId: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.exportAnalyticsCsv(simulationId, orgId))
      : Promise.resolve(sqliteDb.exportAnalyticsCsv(simulationId, orgId)),

  createOrgInvite: (data: Parameters<typeof sqliteDb.createOrgInvite>[0]) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.createOrgInvite(data))
      : Promise.resolve(sqliteDb.createOrgInvite(data)),

  getOrgInviteByToken: (token: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.getOrgInviteByToken(token))
      : Promise.resolve(sqliteDb.getOrgInviteByToken(token)),

  acceptOrgInvite: (token: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.acceptOrgInvite(token))
      : Promise.resolve(sqliteDb.acceptOrgInvite(token)),

  createPasswordReset: (userId: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.createPasswordReset(userId))
      : Promise.resolve(sqliteDb.createPasswordReset(userId)),

  consumePasswordReset: (token: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.consumePasswordReset(token))
      : Promise.resolve(sqliteDb.consumePasswordReset(token)),

  createOrganization: (name: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.createOrganization(name))
      : Promise.resolve(sqliteUsers.createOrganization(name)),

  getOrganization: (id: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.getOrganization(id))
      : Promise.resolve(sqliteUsers.getOrganization(id)),

  createUser: (data: Parameters<typeof sqliteUsers.createUser>[0]) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.createUser(data))
      : Promise.resolve(sqliteUsers.createUser(data)),

  findUserByEmail: (email: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.findUserByEmail(email))
      : Promise.resolve(sqliteUsers.findUserByEmail(email)),

  getUserById: (id: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.getUserById(id))
      : Promise.resolve(sqliteUsers.getUserById(id)),

  updateUserPassword: (userId: string, passwordHash: string) =>
    getDatabaseKind() === 'postgres'
      ? import('../pg/store.js').then((m) => m.updateUserPassword(userId, passwordHash))
      : Promise.resolve(sqliteUsers.updateUserPassword(userId, passwordHash)),
}
