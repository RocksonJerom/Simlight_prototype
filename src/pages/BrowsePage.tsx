import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { PublicLayout } from '../components/layout/PublicLayout'
import { SimulationCard } from '../components/catalog/SimulationCard'
import { SearchBar } from '../components/catalog/SearchBar'
import {
  CATALOG_CATEGORIES,
  DIFFICULTY_OPTIONS,
  INDUSTRY_FILTER_OPTIONS,
} from '../data/categories'
import { api } from '../api/client'
import type { MarketplaceItem } from '../types/extras'

export function BrowsePage() {
  const { category } = useParams<{ category?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const sort = (searchParams.get('sort') as 'new' | 'popular' | 'title') || 'new'
  const difficulty = searchParams.get('difficulty') ?? ''
  const industry = searchParams.get('industry') ?? ''

  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)

  const activeCategory = CATALOG_CATEGORIES.find((c) => c.slug === (category ?? 'all')) ?? CATALOG_CATEGORIES[0]

  useEffect(() => {
    setLoading(true)
    api
      .searchMarketplace({
        q: q || undefined,
        category: category ?? 'all',
        difficulty: difficulty || undefined,
        industry: industry || undefined,
        sort,
      })
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, q, sort, difficulty, industry])

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {activeCategory.icon} {activeCategory.name}
          </h1>
          <p className="text-slate-400">
            {items.length} simulation{items.length !== 1 ? 's' : ''} available
            {q ? ` for “${q}”` : ''}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-56 shrink-0 space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Search</p>
              <SearchBar defaultValue={q} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Category</p>
              <ul className="space-y-1">
                {CATALOG_CATEGORIES.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      to={
                        cat.slug === 'all'
                          ? `/browse${q ? `?q=${encodeURIComponent(q)}` : ''}`
                          : `/browse/${cat.slug}`
                      }
                      className={`block px-3 py-2 rounded-lg text-sm ${
                        (category ?? 'all') === cat.slug || (!category && cat.slug === 'all')
                          ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                          : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Difficulty</p>
              <select
                value={difficulty}
                onChange={(e) => setFilter('difficulty', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
              >
                <option value="">All levels</option>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Industry</p>
              <select
                value={industry}
                onChange={(e) => setFilter('industry', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
              >
                <option value="">All industries</option>
                {INDUSTRY_FILTER_OPTIONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Sort</p>
              <select
                value={sort}
                onChange={(e) => setFilter('sort', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
              >
                <option value="new">Newest</option>
                <option value="popular">Most played</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <p className="text-slate-500">Loading…</p>
            ) : items.length === 0 ? (
              <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
                <p className="text-slate-400 mb-4">No simulations match your filters.</p>
                <Link to="/teach" className="text-cyan-400 hover:underline">
                  Create and publish one →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <SimulationCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
