import type { GeneratedContent, SimulationMeta } from '../types/simulation'

/** Blank scaffold for faculty who build events and questions manually in Step 3. */
export function createManualTemplate(meta: SimulationMeta): GeneratedContent {
  return {
    scenario: `You are managing a ${meta.domain.toLowerCase()} scenario in the ${meta.industry} industry. Define events and decision questions in the review step.`,
    phases: [{ id: 'p1', name: 'Phase 1 — Getting Started', order: 1 }],
    events: [
      {
        id: 'e1',
        phaseId: 'p1',
        title: 'Opening decision',
        description: 'Describe the first situation learners will face. Edit this text and add more decision options below.',
        impact: { cost: 'Low', budget: 'Neutral', risk: 'Low' },
        decisions: [
          { id: 'd1', text: 'Option A — add your first choice' },
          { id: 'd2', text: 'Option B — add your second choice' },
        ],
        assessment: {
          type: 'mcq',
          prompt: 'What is your first decision?',
        },
      },
    ],
    metrics: [
      { id: 'm1', name: 'Decision Quality', weight: 40, description: 'Quality of choices made' },
      { id: 'm2', name: 'Risk Management', weight: 30, description: 'How well risk was handled' },
      { id: 'm3', name: 'Budget Control', weight: 30, description: 'Budget impact of decisions' },
    ],
  }
}
