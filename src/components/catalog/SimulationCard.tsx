import { Link } from 'react-router-dom'
import type { MarketplaceItem } from '../../types/extras'

export function SimulationCard({ item, size = 'md' }: { item: MarketplaceItem; size?: 'sm' | 'md' | 'lg' }) {
  const thumbH = size === 'lg' ? 'h-40' : size === 'sm' ? 'h-24' : 'h-32'

  return (
    <Link
      to={`/sim/${item.id}`}
      className="group block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
    >
      <div className={`relative ${thumbH} bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden`}>
        {item.thumbnailUrl ? (
          item.thumbnailType === 'video' ? (
            <video
              src={item.thumbnailUrl}
              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={item.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-60">🏭</div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs font-medium">
          {item.difficulty}
        </span>
        {item.playCount > 0 && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-xs">
            ▶ {item.playCount}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
          {item.title}
        </h3>
        <p className="text-xs text-slate-400 mt-1 truncate">
          {item.domain} · {item.duration}
        </p>
        <p className="text-xs text-slate-500 mt-1">by {item.orgName}</p>
        {item.avgScore > 0 && (
          <p className="text-xs text-amber-400 mt-2">⭐ Avg score {item.avgScore}</p>
        )}
      </div>
    </Link>
  )
}
