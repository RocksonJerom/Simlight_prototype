import { ALL_V2_TEMPLATES } from '../src/data/v2Templates.js'
import { simulateRound, calculateScorecard } from '../src/engine/v2Engine.js'
import { getSessionReport, createSession, updateSession, createSimulation } from '../server/db.js'

async function runTest() {
  console.log('--- Testing Capsim V2 Engine & Behavioral Analysis ---')

  const sim = ALL_V2_TEMPLATES[0]
  if (!sim) throw new Error('No simulation template found')

  console.log(`Loaded simulation: ${sim.title} (${sim.rounds.length} rounds)`)

  let runningVars: Record<string, number> = {}
  sim.variables.forEach((v) => {
    runningVars[v.id] = v.initialValue
  })
  const initialVars = { ...runningVars }
  const history: any[] = []

  // Simulate round 1 with aggressive choices
  const r1 = sim.rounds[0]
  const decs1: Record<string, any> = {}
  r1.decisions.forEach((d) => {
    if (d.type === 'slider') decs1[d.id] = d.max || 100
    else if (d.type === 'select') decs1[d.id] = d.options?.[0]?.id
    else decs1[d.id] = 100
  })

  const res1 = simulateRound(sim, runningVars, 1, decs1)
  history.push(res1)
  runningVars = { ...res1.updatedVariables }

  // Simulate round 2
  const r2 = sim.rounds[1]
  const decs2: Record<string, any> = {}
  r2.decisions.forEach((d) => {
    if (d.type === 'slider') decs2[d.id] = d.max ? Math.round(d.max * 0.8) : 80
    else if (d.type === 'select') decs2[d.id] = d.options?.[0]?.id
    else decs2[d.id] = 80
  })

  const res2 = simulateRound(sim, runningVars, 2, decs2)
  history.push(res2)
  runningVars = { ...res2.updatedVariables }

  // Calculate Scorecard
  const sc = calculateScorecard(sim, initialVars, runningVars, history)
  console.log('Scorecard generated with score:', sc.overallScore)
  console.log('Strategic Archetype:', sc.strategicArchetype)
  console.log('Behavior Insights:', sc.behaviorInsights)

  if (!sc.behaviorInsights) {
    throw new Error('Expected behaviorInsights on scorecard!')
  }

  // Create a DB session and verify getSessionReport
  console.log('\n--- Testing Session Persistence & Report Generation ---')
  const dbSim = createSimulation({ v2Data: sim }, 'org-test', 'user-test', sim)
  console.log(`Created simulation record in DB: ${dbSim.id}`)

  const session = createSession(sim.id, 'Priya Sharma', undefined, undefined, 'REG-2026-99')

  if (!session) throw new Error('Failed to create session')

  updateSession(session.id, {
    score: sc.overallScore ?? 85,
    roundHistory: history,
    scorecard: sc,
    completed: true,
    completedAt: new Date().toISOString(),
  })

  const report = getSessionReport(session.id)
  if (!report) throw new Error('Failed to fetch session report')

  console.log('Report participant:', report.learner)
  console.log('Report behaviorInsights:', report.behaviorInsights)
  console.log('Report customization showBehaviorInsights:', report.customization?.showBehaviorInsights)

  if (!report.behaviorInsights?.riskProfile) {
    throw new Error('Report missing behaviorInsights.riskProfile')
  }

  console.log('\n✅ All automated verification checks passed successfully!')
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
