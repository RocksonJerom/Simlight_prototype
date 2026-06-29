import type { SimulationRecord, Visibility } from '../../src/types/simulation.js'

export interface AccessContext {
  orgId?: string
  playToken?: string
  assignmentId?: string
  isFaculty?: boolean
}

export function canPlaySimulation(sim: SimulationRecord, ctx: AccessContext): boolean {
  if (!sim.isPublished || !sim.generated) return false

  const visibility: Visibility = sim.visibility

  if (visibility === 'public') return true

  if (visibility === 'organization') {
    if (ctx.assignmentId) return true
    if (ctx.orgId && ctx.orgId === sim.orgId) return true
    return false
  }

  // private
  if (ctx.isFaculty && ctx.orgId === sim.orgId) return true
  if (ctx.assignmentId) return true
  if (sim.playToken && ctx.playToken === sim.playToken) return true
  return false
}

export function canListInMarketplace(sim: SimulationRecord): boolean {
  return sim.isPublished && sim.visibility === 'public'
}
