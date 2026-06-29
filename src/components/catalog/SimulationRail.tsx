import { Link } from 'react-router-dom'
import type { MarketplaceItem } from '../../types/extras'
import { SimulationCard } from './SimulationCard'

export function SimulationRail({
  title,
  items,
  seeAllHref,
}: {
  title: string
  items: MarketplaceItem[]
  seeAllHref?: string
}) {
  if (!items.length) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {seeAllHref && (
          <Link to={seeAllHref} className="text-sm text-cyan-400 hover:text-cyan-300">
            See all →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item) => (
          <SimulationCard key={item.id} item={item} size="sm" />
        ))}
      </div>
    </section>
  )
}
