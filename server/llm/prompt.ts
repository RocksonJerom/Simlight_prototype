import type { SimulationMeta } from '../src/types/simulation.js'

export const GENERATION_JSON_SCHEMA = `{
  "scenario": "2-3 sentence immersive scenario narrative",
  "phases": [
    { "name": "Phase name", "order": 1 }
  ],
  "events": [
    {
      "phaseOrder": 1,
      "title": "Event title",
      "description": "2-4 sentence event description with business context",
      "impact": { "cost": "Low|Medium|High", "budget": "Up|Down|Neutral", "risk": "Low|Medium|High" },
      "decisions": ["Decision option 1", "Decision option 2", "Decision option 3"]
    }
  ],
  "metrics": [
    { "name": "Metric name", "weight": 20, "description": "What this measures" }
  ]
}`

export function buildGenerationPrompt(meta: SimulationMeta): string {
  const objectives = meta.learningObjectives.length
    ? meta.learningObjectives.map((o) => `- ${o}`).join('\n')
    : '- Apply domain knowledge\n- Make strategic decisions'

  return `You are an expert instructional designer building an interactive business simulation for higher education.

Create a complete simulation definition as JSON only (no markdown, no code fences).

SIMULATION INPUT:
- Title: ${meta.title}
- Domain: ${meta.domain}
- Industry: ${meta.industry}
- Difficulty: ${meta.difficulty}
- Duration: ${meta.duration}
- Learning objectives:
${objectives}

REQUIREMENTS:
1. Return exactly 4 phases in logical progression for this topic.
2. Return 5 events distributed across phases (at least 1 per phase).
3. Each event must have 3-4 realistic decision options for learners.
4. Return 6 scoring metrics with weights that sum to exactly 100.
5. Tailor scenario, events, and decisions to the title, domain, and industry — do NOT use generic placeholder text.
6. Match difficulty: Beginner = clearer trade-offs; Advanced = ambiguous, high-stakes choices.
7. Impact tags must reflect each event's business consequences.

OUTPUT JSON SHAPE:
${GENERATION_JSON_SCHEMA}`
}
