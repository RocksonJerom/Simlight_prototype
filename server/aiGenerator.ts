import type { SimulationMeta, GeneratedContent } from '../src/types/simulation.js'

export function generateMockContent(meta: SimulationMeta): GeneratedContent {
  const phases = [
    { id: 'p1', name: 'Requirement Analysis', order: 1 },
    { id: 'p2', name: 'Supplier Evaluation', order: 2 },
    { id: 'p3', name: 'Negotiation & Selection', order: 3 },
    { id: 'p4', name: 'Implementation & Review', order: 4 },
  ]

  const events = [
    {
      id: 'e1',
      phaseId: 'p1',
      title: 'Define procurement needs',
      description:
        'Your manufacturing unit needs raw materials for Q3 production. Define specifications, volume requirements, and quality standards for supplier evaluation.',
      impact: { cost: 'Low' as const, budget: 'Neutral' as const, risk: 'Low' as const },
      decisions: [
        { id: 'd1', text: 'Prioritize cost over quality' },
        { id: 'd2', text: 'Balance cost and quality equally' },
        { id: 'd3', text: 'Prioritize quality over cost' },
      ],
    },
    {
      id: 'e2',
      phaseId: 'p2',
      title: 'Market price increase',
      description:
        'Global commodity prices have risen 12% this quarter. Three shortlisted suppliers have submitted revised quotes with varying price increases and delivery terms.',
      impact: { cost: 'High' as const, budget: 'Down' as const, risk: 'Medium' as const },
      decisions: [
        { id: 'd4', text: 'Accept the price increase from current supplier' },
        { id: 'd5', text: 'Switch to a lower-cost alternative supplier' },
        { id: 'd6', text: 'Negotiate a volume discount to offset increase' },
        { id: 'd7', text: 'Delay procurement and monitor market' },
      ],
    },
    {
      id: 'e3',
      phaseId: 'p2',
      title: 'Quality audit findings',
      description:
        'A quality audit reveals that Supplier B has inconsistent batch quality but offers the lowest price. Supplier A has premium quality at 18% higher cost.',
      impact: { cost: 'Medium' as const, budget: 'Down' as const, risk: 'High' as const },
      decisions: [
        { id: 'd8', text: 'Select Supplier A for reliability' },
        { id: 'd9', text: 'Select Supplier B with enhanced QC' },
        { id: 'd10', text: 'Split order between both suppliers' },
      ],
    },
    {
      id: 'e4',
      phaseId: 'p3',
      title: 'Contract negotiation',
      description:
        'Enter final negotiations with your preferred supplier. They are requesting shorter payment terms and a 2-year exclusivity clause.',
      impact: { cost: 'Medium' as const, budget: 'Neutral' as const, risk: 'Medium' as const },
      decisions: [
        { id: 'd11', text: 'Accept all terms to close quickly' },
        { id: 'd12', text: 'Negotiate payment terms only' },
        { id: 'd13', text: 'Reject exclusivity, offer longer contract' },
      ],
    },
    {
      id: 'e5',
      phaseId: 'p4',
      title: 'Delivery disruption',
      description:
        'Your selected supplier reports a 2-week delivery delay due to logistics issues. Production schedule is at risk.',
      impact: { cost: 'High' as const, budget: 'Down' as const, risk: 'High' as const },
      decisions: [
        { id: 'd14', text: 'Activate backup supplier immediately' },
        { id: 'd15', text: 'Adjust production schedule' },
        { id: 'd16', text: 'Expedite shipping at premium cost' },
      ],
    },
  ]

  const metrics = [
    { id: 'm1', name: 'Cost Efficiency', weight: 25, description: 'Ability to optimize procurement spend' },
    { id: 'm2', name: 'Quality', weight: 20, description: 'Maintaining product quality standards' },
    { id: 'm3', name: 'Delivery Time', weight: 15, description: 'Meeting delivery deadlines' },
    { id: 'm4', name: 'Risk Management', weight: 20, description: 'Identifying and mitigating supply risks' },
    { id: 'm5', name: 'Negotiation', weight: 10, description: 'Effective supplier negotiation skills' },
    { id: 'm6', name: 'Strategic Thinking', weight: 10, description: 'Long-term supply chain planning' },
  ]

  const scenario = `You are the Procurement Manager at ${meta.industry === 'Manufacturing' ? 'a leading manufacturing firm' : 'an organization'} facing a critical supplier selection challenge. Raw material costs are volatile, delivery timelines are tight, and quality standards cannot be compromised. Navigate through requirement analysis, supplier evaluation, negotiation, and implementation to build a resilient supply chain for your ${meta.domain.toLowerCase()} simulation.`

  return { scenario, phases, events, metrics }
}

export const AI_GENERATION_TASKS = [
  'Understanding topic and domain context',
  'Generating scenario narrative',
  'Creating simulation phases',
  'Building events and decision points',
  'Designing scoring framework',
  'Validating content coherence',
]
