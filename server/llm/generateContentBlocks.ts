import type { SimulationMeta, Event, ContentBlock, ContentBlockType } from '../../src/types/simulation.js'
import { resolveProvider } from '../config.js'
import { callLlmPrompt } from './providers.js'
import { parseContentBlocks } from './parser.js'
import { extractJson } from './parser.js'

const BLOCK_SCHEMA = `{
  "contentBlocks": [
    { "type": "text", "title": "Section", "text": "Paragraph content" },
    { "type": "table", "title": "KPIs", "table": { "headers": ["A","B"], "rows": [["1","2"]] } },
    { "type": "chart", "title": "Trend", "chart": { "type": "pie|bar|line", "labels": ["Q1","Q2"], "values": [40,60] } }
  ]
}`

export async function generateEventContentBlocks(
  meta: SimulationMeta,
  event: Event,
  mode: 'all' | ContentBlockType = 'all'
): Promise<ContentBlock[]> {
  const provider = resolveProvider()
  if (provider === 'mock') {
    throw new Error('Configure GROQ_API_KEY in .env for AI content generation')
  }

  const modeHint =
    mode === 'all'
      ? 'Generate 3-4 blocks mixing text, table, and chart types.'
      : `Generate 1-2 blocks of type "${mode}" only.`

  const prompt = `You are an instructional designer. Create event content blocks as JSON only (no markdown fences).

Simulation: ${meta.title} (${meta.domain} / ${meta.industry})
Event title: ${event.title}
Event description: ${event.description}
${modeHint}

Each block must match this schema. Use realistic business data related to the event.
${BLOCK_SCHEMA}`

  const raw = await callLlmPrompt(prompt, provider, { maxTokens: 4096 })
  const draft = extractJson(raw) as { contentBlocks?: unknown[] }
  const blocks = parseContentBlocks(
    draft.contentBlocks as Parameters<typeof parseContentBlocks>[0],
    0
  )

  if (blocks.length === 0) {
    throw new Error('AI did not return valid content blocks. Try again.')
  }

  if (mode !== 'all') {
    return blocks.filter((b) => b.type === mode)
  }
  return blocks
}
