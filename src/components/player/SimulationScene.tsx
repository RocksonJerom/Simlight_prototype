import type { ReactNode } from 'react'
import type { Event } from '../../types/simulation'
import { SceneMediaView } from '../media/SceneMediaView'
import type { SceneMedia } from '../../utils/media'

export function SimulationScene({
  phaseName,
  sceneMedia,
  event,
  children,
}: {
  phaseName?: string
  sceneMedia: SceneMedia | null
  event?: Event
  children?: ReactNode
}) {
  return (
    <div className="relative flex-1 min-h-[280px] lg:min-h-[360px] bg-gradient-to-b from-[#1a3a52] to-[#0d2137] overflow-hidden">
      {/* Isometric city-style backdrop */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0a1628] to-transparent" />
        <div className="absolute bottom-8 left-[10%] w-16 h-20 bg-slate-600/50 skew-x-6 rounded-sm" />
        <div className="absolute bottom-12 left-[25%] w-20 h-28 bg-slate-500/40 -skew-x-3 rounded-sm" />
        <div className="absolute bottom-6 left-[45%] w-24 h-32 bg-[#005b7f]/30 rounded-sm" />
        <div className="absolute bottom-10 right-[20%] w-18 h-24 bg-slate-600/45 skew-x-12 rounded-sm" />
        <div className="absolute bottom-4 right-[8%] w-14 h-16 bg-slate-500/50 rounded-sm" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-cyan-400/5 blur-3xl" />
      </div>

      {sceneMedia ? (
        <SceneMediaView
          media={sceneMedia}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-6xl mb-2 drop-shadow-lg">🏙️</div>
            <p className="text-cyan-200/80 text-sm font-medium">{phaseName ?? 'Simulation World'}</p>
          </div>
        </div>
      )}

      {event && (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-6 max-w-lg w-full animate-in fade-in">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">📋</span>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{event.title}</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{event.description}</p>
              </div>
            </div>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
