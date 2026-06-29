import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicLayout } from '../components/layout/PublicLayout'
import { SimulationRail } from '../components/catalog/SimulationRail'
import { CATALOG_CATEGORIES } from '../data/categories'
import { api } from '../api/client'
import type { CatalogHome } from '../types/extras'

export function HomePage() {
  const [catalog, setCatalog] = useState<CatalogHome | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getCatalogHome()
      .then(setCatalog)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-slate-950 to-cyan-900/30" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
          <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-3">
            Learn through play
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 max-w-2xl mx-auto leading-tight">
            Business simulations you can browse, play, and master
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            Pick a scenario, make decisions, get scored — like a game portal, built for faculty and learners.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/browse"
              className="px-6 py-3 bg-cyan-500 text-slate-950 font-semibold rounded-xl hover:bg-cyan-400"
            >
              Browse all simulations
            </Link>
            <Link
              to="/teach"
              className="px-6 py-3 border border-slate-600 text-white font-semibold rounded-xl hover:bg-slate-800"
            >
              Create as faculty
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {CATALOG_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={cat.slug === 'all' ? '/browse' : `/browse/${cat.slug}`}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
            >
              {cat.icon} {cat.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {loading ? (
          <p className="text-slate-500 text-center py-12">Loading simulations…</p>
        ) : catalog ? (
          <>
            <SimulationRail title="⭐ Featured" items={catalog.featured} seeAllHref="/browse?sort=popular" />
            <SimulationRail title="🆕 New this week" items={catalog.newThisWeek} seeAllHref="/browse" />
            <SimulationRail title="🔥 Top played" items={catalog.topPlayed} seeAllHref="/browse?sort=popular" />
            <SimulationRail
              title="💰 Financial literacy"
              items={catalog.financialLiteracy}
              seeAllHref="/browse/financial-literacy"
            />
            <SimulationRail title="🏭 Operations" items={catalog.operations} seeAllHref="/browse/operations" />
            <SimulationRail
              title="♟️ Business & strategy"
              items={catalog.businessStrategy}
              seeAllHref="/browse/business-strategy"
            />
            {catalog.featured.length === 0 && catalog.newThisWeek.length === 0 && (
              <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
                <p className="text-4xl mb-4">🎮</p>
                <p className="text-slate-400 mb-4">No public simulations yet.</p>
                <Link to="/teach" className="text-cyan-400 hover:underline">
                  Publish your first simulation →
                </Link>
              </div>
            )}
          </>
        ) : null}
      </div>
    </PublicLayout>
  )
}
