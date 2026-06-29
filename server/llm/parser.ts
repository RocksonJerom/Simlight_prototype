import type { GeneratedContent, ContentBlock, ContentChart, ContentTable } from '../../src/types/simulation.js'

type ImpactLevel = 'Low' | 'Medium' | 'High'
type BudgetImpact = 'Up' | 'Down' | 'Neutral'

interface RawContentBlock {
  type?: string
  title?: string
  text?: string
  table?: { headers?: string[]; rows?: string[][] }
  chart?: { type?: string; title?: string; labels?: string[]; values?: number[] }
}

interface RawDraft {
  scenario?: string
  phases?: { name?: string; order?: number }[]
  events?: {
    phaseOrder?: number
    title?: string
    description?: string
    impact?: { cost?: string; budget?: string; risk?: string }
    decisions?: string[]
    contentBlocks?: RawContentBlock[]
  }[]
  metrics?: { name?: string; weight?: number; description?: string }[]
}

function asImpactLevel(v: unknown, fallback: ImpactLevel): ImpactLevel {
  const s = String(v ?? '').toLowerCase()
  if (s === 'low') return 'Low'
  if (s === 'medium') return 'Medium'
  if (s === 'high') return 'High'
  return fallback
}

function asBudgetImpact(v: unknown, fallback: BudgetImpact): BudgetImpact {
  const s = String(v ?? '').toLowerCase()
  if (s === 'up') return 'Up'
  if (s === 'down') return 'Down'
  return fallback
}

function asChartType(v: unknown): ContentChart['type'] {
  const s = String(v ?? 'bar').toLowerCase()
  if (s === 'line' || s === 'pie') return s
  return 'bar'
}

function parseContentBlocks(raw: RawContentBlock[] | undefined, eventIndex: number): ContentBlock[] {
  if (!raw?.length) return []

  return raw
    .map((block, blockIndex) => {
      const type = String(block.type ?? '').toLowerCase()
      const id = `cb${eventIndex + 1}_${blockIndex + 1}`

      if (type === 'text' && block.text?.trim()) {
        return {
          id,
          type: 'text' as const,
          title: block.title?.trim() || undefined,
          text: block.text.trim(),
        }
      }

      if (type === 'table' && block.table?.headers?.length) {
        const table: ContentTable = {
          headers: block.table.headers.map((h) => String(h).trim()),
          rows: (block.table.rows ?? []).map((row) => row.map((cell) => String(cell).trim())),
        }
        return {
          id,
          type: 'table' as const,
          title: block.title?.trim() || undefined,
          table,
        }
      }

      if (type === 'chart' && block.chart?.labels?.length && block.chart.values?.length) {
        const chart: ContentChart = {
          type: asChartType(block.chart.type),
          title: String(block.chart.title ?? block.title ?? 'Chart').trim(),
          labels: block.chart.labels.map((l) => String(l).trim()),
          values: block.chart.values.map((v) => Number(v) || 0),
        }
        return {
          id,
          type: 'chart' as const,
          title: block.title?.trim() || chart.title,
          chart,
        }
      }

      return null
    })
    .filter((b): b is ContentBlock => b !== null)
}

function extractJson(text: string): RawDraft {
  const trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fence ? fence[1].trim() : trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('LLM response did not contain JSON')
  return JSON.parse(candidate.slice(start, end + 1)) as RawDraft
}

function normalizeMetricWeights(
  metrics: { id: string; name: string; weight: number; description: string }[]
) {
  const total = metrics.reduce((s, m) => s + m.weight, 0)
  if (total === 100 || metrics.length === 0) return metrics
  const scaled = metrics.map((m) => ({
    ...m,
    weight: Math.max(1, Math.round((m.weight / total) * 100)),
  }))
  const drift = 100 - scaled.reduce((s, m) => s + m.weight, 0)
  scaled[0].weight += drift
  return scaled
}

export function parseLlmResponse(raw: string): GeneratedContent {
  const draft = extractJson(raw)

  if (!draft.scenario?.trim()) throw new Error('LLM response missing scenario')
  if (!draft.phases?.length) throw new Error('LLM response missing phases')
  if (!draft.events?.length) throw new Error('LLM response missing events')
  if (!draft.metrics?.length) throw new Error('LLM response missing metrics')

  const phases = draft.phases.map((p, i) => ({
    id: `p${i + 1}`,
    name: String(p.name ?? `Phase ${i + 1}`).trim(),
    order: Number(p.order ?? i + 1),
  }))

  const phaseByOrder = new Map(phases.map((p) => [p.order, p.id]))

  const events = draft.events.map((e, i) => {
    const phaseOrder = Number(e.phaseOrder ?? 1)
    const phaseId = phaseByOrder.get(phaseOrder) ?? phases[0].id
    const decisions = (e.decisions ?? []).filter(Boolean).map((text, j) => ({
      id: `d${i + 1}_${j + 1}`,
      text: String(text).trim(),
    }))
    if (decisions.length === 0) {
      decisions.push({ id: `d${i + 1}_1`, text: 'Proceed with default option' })
    }
    const contentBlocks = parseContentBlocks(e.contentBlocks, i)
    return {
      id: `e${i + 1}`,
      phaseId,
      title: String(e.title ?? `Event ${i + 1}`).trim(),
      description: String(e.description ?? '').trim(),
      impact: {
        cost: asImpactLevel(e.impact?.cost, 'Medium'),
        budget: asBudgetImpact(e.impact?.budget, 'Neutral'),
        risk: asImpactLevel(e.impact?.risk, 'Medium'),
      },
      decisions,
      ...(contentBlocks.length > 0 ? { contentBlocks } : {}),
    }
  })

  const metrics = normalizeMetricWeights(
    draft.metrics.map((m, i) => ({
      id: `m${i + 1}`,
      name: String(m.name ?? `Metric ${i + 1}`).trim(),
      weight: Math.max(1, Math.min(100, Number(m.weight ?? 10))),
      description: String(m.description ?? '').trim(),
    }))
  )

  return {
    scenario: draft.scenario.trim(),
    phases,
    events,
    metrics,
  }
}

export function parseLlmResponseSafe(raw: string): GeneratedContent {
  try {
    return parseLlmResponse(raw)
  } catch (err) {
    throw new Error(`Failed to parse LLM output: ${err instanceof Error ? err.message : 'unknown error'}`)
  }
}

export { extractJson, parseContentBlocks }
