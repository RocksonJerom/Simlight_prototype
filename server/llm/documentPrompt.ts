import type { SimulationMeta } from '../../src/types/simulation.js'

export const DOCUMENT_GENERATION_JSON_SCHEMA = `{
  "scenario": "2-4 sentence immersive scenario narrative derived from the document",
  "phases": [
    { "name": "Phase name from document structure", "order": 1 }
  ],
  "events": [
    {
      "phaseOrder": 1,
      "title": "Event title",
      "description": "Brief event framing (1-2 sentences)",
      "impact": { "cost": "Low|Medium|High", "budget": "Up|Down|Neutral", "risk": "Low|Medium|High" },
      "decisions": ["Decision option 1", "Decision option 2", "Decision option 3"],
      "contentBlocks": [
        {
          "type": "text",
          "title": "Section heading",
          "text": "Paragraphs, bullet context, or case details from the source material"
        },
        {
          "type": "table",
          "title": "Data table title",
          "table": {
            "headers": ["Column A", "Column B"],
            "rows": [["value", "value"]]
          }
        },
        {
          "type": "chart",
          "title": "Chart title",
          "chart": {
            "type": "bar|line|pie",
            "labels": ["Label 1", "Label 2"],
            "values": [10, 20]
          }
        }
      ]
    }
  ],
  "metrics": [
    { "name": "Metric name", "weight": 20, "description": "What this measures" }
  ]
}`

export function buildDocumentGenerationPrompt(meta: SimulationMeta, documentText: string): string {
  const objectives = meta.learningObjectives.length
    ? meta.learningObjectives.map((o) => `- ${o}`).join('\n')
    : '- Apply concepts from the source material\n- Make evidence-based decisions'

  const hints = [
    meta.title ? `- Suggested title: ${meta.title}` : null,
    meta.domain ? `- Domain: ${meta.domain}` : null,
    meta.industry ? `- Industry: ${meta.industry}` : null,
    meta.difficulty ? `- Difficulty: ${meta.difficulty}` : null,
    meta.duration ? `- Duration: ${meta.duration}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return `You are an expert instructional designer. Convert the SOURCE DOCUMENT below into a complete interactive business simulation as JSON only (no markdown fences).

CREATOR HINTS (use when the document does not specify):
${hints || '- Infer appropriate domain and difficulty from the document'}

LEARNING OBJECTIVES:
${objectives}

REQUIREMENTS:
1. Structure phases and events to follow the document's sections, case phases, or logical progression.
2. Create 3-6 phases and 5-12 events (at least one event per phase).
3. Each event MUST include a "contentBlocks" array with 2-5 blocks mixing:
   - "text": narrative, instructions, or case excerpts (preserve key facts and numbers from the document)
   - "table": tabular data when the document has figures, comparisons, or KPIs (use real values from the document when available)
   - "chart": visualizable numeric series derived from document data (bar/line/pie with labels and values arrays)
4. Each event needs 3-4 realistic decision options grounded in the document scenario.
5. Return 5-8 scoring metrics with weights summing to exactly 100.
6. Do NOT invent generic placeholder content — anchor scenario, tables, and charts in the source material.

OUTPUT JSON SHAPE:
${DOCUMENT_GENERATION_JSON_SCHEMA}

SOURCE DOCUMENT:
---
${documentText}
---`
}
