import type { MarketplaceItem, PublicSimulationDetail, CatalogHome } from '../../src/types/extras.js'
import type { SimulationMeta } from '../../src/types/simulation.js'
import { getDatabase } from '../database.js'
import { basename } from 'path'
import { publicUploadUrl } from '../upload.js'

export interface MarketplaceFilters {
  q?: string
  category?: string
  difficulty?: string
  industry?: string
  domain?: string
  sort?: 'new' | 'popular' | 'title'
  limit?: number
}

const CATEGORY_DOMAINS: Record<string, string[]> = {
  'business-strategy': ['Business Strategy'],
  'financial-literacy': ['Finance'],
  operations: ['Operations Management', 'Supply Chain Management'],
  leadership: ['Human Resources'],
  'all': [],
}

type MarketplaceRow = {
  id: string
  meta: string
  updated_at: string
  org_name: string
  play_count: number
  avg_score: number | null
  thumb_path: string | null
  thumb_type: string | null
  event_count: number
}

function rowToItem(row: MarketplaceRow): MarketplaceItem {
  const meta = JSON.parse(row.meta) as SimulationMeta
  return {
    id: row.id,
    title: meta.title,
    domain: meta.domain,
    industry: meta.industry,
    difficulty: meta.difficulty,
    duration: meta.duration,
    orgName: row.org_name,
    publishedAt: row.updated_at,
    playCount: row.play_count ?? 0,
    avgScore: Math.round(row.avg_score ?? 0),
    thumbnailUrl: row.thumb_path ? publicUploadUrl(basename(row.thumb_path)) : undefined,
    thumbnailType: (row.thumb_type as 'image' | 'video') ?? undefined,
    eventCount: row.event_count ?? 0,
  }
}

function baseMarketplaceSql(extraWhere = '') {
  return `
    SELECT
      s.id, s.meta, s.updated_at, o.name as org_name,
      (SELECT COUNT(*) FROM sessions WHERE simulation_id = s.id) as play_count,
      (SELECT AVG(score) FROM sessions WHERE simulation_id = s.id AND completed = 1) as avg_score,
      (
        SELECT file_path FROM assets
        WHERE simulation_id = s.id AND type IN ('image', 'video')
        ORDER BY CASE type WHEN 'video' THEN 0 ELSE 1 END, created_at
        LIMIT 1
      ) as thumb_path,
      (
        SELECT type FROM assets
        WHERE simulation_id = s.id AND type IN ('image', 'video')
        ORDER BY CASE type WHEN 'video' THEN 0 ELSE 1 END, created_at
        LIMIT 1
      ) as thumb_type,
      COALESCE((
        SELECT COUNT(*) FROM json_each(COALESCE(json_extract(s.generated, '$.events'), '[]'))
      ), 0) as event_count
    FROM simulations s
    JOIN organizations o ON o.id = s.org_id
    WHERE s.is_published = 1 AND s.visibility = 'public'
    ${extraWhere}
  `
}

export function searchMarketplace(filters: MarketplaceFilters = {}): MarketplaceItem[] {
  const clauses: string[] = []
  const params: unknown[] = []

  if (filters.q?.trim()) {
    clauses.push(`(json_extract(s.meta, '$.title') LIKE ? OR json_extract(s.meta, '$.domain') LIKE ? OR json_extract(s.meta, '$.industry') LIKE ?)`)
    const term = `%${filters.q.trim()}%`
    params.push(term, term, term)
  }

  if (filters.category && filters.category !== 'all') {
    const domains = CATEGORY_DOMAINS[filters.category]
    if (domains?.length) {
      clauses.push(`json_extract(s.meta, '$.domain') IN (${domains.map(() => '?').join(',')})`)
      params.push(...domains)
    }
  }

  if (filters.domain) {
    clauses.push(`json_extract(s.meta, '$.domain') = ?`)
    params.push(filters.domain)
  }

  if (filters.difficulty) {
    clauses.push(`json_extract(s.meta, '$.difficulty') = ?`)
    params.push(filters.difficulty)
  }

  if (filters.industry) {
    clauses.push(`json_extract(s.meta, '$.industry') = ?`)
    params.push(filters.industry)
  }

  const whereExtra = clauses.length ? `AND ${clauses.join(' AND ')}` : ''

  let orderBy = 's.updated_at DESC'
  if (filters.sort === 'popular') orderBy = 'play_count DESC, s.updated_at DESC'
  if (filters.sort === 'title') orderBy = `json_extract(s.meta, '$.title') ASC`

  const limit = Math.min(filters.limit ?? 100, 200)

  const rows = getDatabase()
    .prepare(`${baseMarketplaceSql(whereExtra)} ORDER BY ${orderBy} LIMIT ?`)
    .all(...params, limit) as MarketplaceRow[]

  return rows.map(rowToItem)
}

export function listMarketplace(): MarketplaceItem[] {
  return searchMarketplace({ sort: 'new' })
}

export function getCatalogHome(): CatalogHome {
  const all = searchMarketplace({ sort: 'new', limit: 50 })
  const topPlayed = searchMarketplace({ sort: 'popular', limit: 10 })
  const newThisWeek = all.slice(0, 8)
  const featured = topPlayed.length > 0 ? topPlayed.slice(0, 6) : all.slice(0, 6)

  return {
    featured,
    newThisWeek,
    topPlayed: topPlayed.slice(0, 10),
    financialLiteracy: searchMarketplace({ category: 'financial-literacy', limit: 8 }),
    operations: searchMarketplace({ category: 'operations', limit: 8 }),
    businessStrategy: searchMarketplace({ category: 'business-strategy', limit: 8 }),
    leadership: searchMarketplace({ category: 'leadership', limit: 8 }),
  }
}

export function getPublicSimulationDetail(id: string): PublicSimulationDetail | null {
  const row = getDatabase()
    .prepare(`${baseMarketplaceSql('AND s.id = ?')}`)
    .get(id) as MarketplaceRow | undefined

  if (!row) return null

  const meta = JSON.parse(row.meta) as SimulationMeta
  const simRow = getDatabase()
    .prepare(`SELECT generated FROM simulations WHERE id = ?`)
    .get(id) as { generated: string | null } | undefined

  let scenario: string | undefined
  let phases = 0
  if (simRow?.generated) {
    const generated = JSON.parse(simRow.generated) as {
      scenario?: string
      phases?: unknown[]
    }
    scenario = generated.scenario
    phases = generated.phases?.length ?? 0
  }

  const assets = getDatabase()
    .prepare(`SELECT id, type, name, file_path FROM assets WHERE simulation_id = ? ORDER BY created_at`)
    .all(id) as { id: string; type: string; name: string; file_path: string }[]

  const base = rowToItem(row)
  return {
    ...base,
    scenario,
    learningObjectives: meta.learningObjectives,
    phases,
    playMode: meta.playMode ?? 'single',
    maxPlayers: meta.maxPlayers ?? 4,
    assets: assets.map((a) => ({
      id: a.id,
      type: a.type as 'image' | 'video' | 'document',
      name: a.name,
      url: publicUploadUrl(basename(a.file_path)),
    })),
  }
}

export function getCategoryList() {
  return Object.entries(CATEGORY_DOMAINS)
    .filter(([slug]) => slug !== 'all')
    .map(([slug, domains]) => ({
      slug,
      name:
        slug === 'business-strategy'
          ? 'Business & Strategy'
          : slug === 'financial-literacy'
            ? 'Financial Literacy'
            : slug === 'operations'
              ? 'Operations'
              : slug === 'leadership'
                ? 'Leadership & HR'
                : slug,
      domains,
    }))
}
