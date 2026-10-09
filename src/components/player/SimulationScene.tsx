import type { ReactNode } from 'react'
import type { Event } from '../../types/simulation'
import { AnimatedSimulationWorld, SceneMediaPiP } from './AnimatedSimulationWorld'
import type { SceneMedia } from '../../utils/media'

export function SimulationScene({
  phaseName,
  industry,
  sceneMedia,
  event,
  eventIndex = 0,
  showInfo,
  onCloseInfo,
  children,
}: {
  phaseName?: string
  industry?: string
  sceneMedia: SceneMedia | null
  event?: Event
  eventIndex?: number
  showInfo?: boolean
  onCloseInfo?: () => void
  children?: ReactNode
}) {
  return (
    <div className="relative flex-1 min-h-[240px] sm:min-h-[320px] lg:min-h-[380px] bg-[#0a1628] overflow-hidden">
      {/* Primary gameplay: animated isometric simulation world */}
      <AnimatedSimulationWorld
        phaseName={phaseName}
        industry={industry}
        eventTitle={event?.title}
        eventIndex={eventIndex}
      />

      {/* Optional uploaded media as picture-in-picture — not full-screen replacement */}
      {sceneMedia && <SceneMediaPiP media={sceneMedia} />}

      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a1628]/70 to-transparent pointer-events-none z-[3]" />

      {showInfo && event && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="Close event information"
            className="absolute inset-0 bg-black/25"
            onClick={onCloseInfo}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-info-title"
            className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-5 sm:p-6 max-w-lg w-full max-h-[80%] overflow-y-auto"
          >
            <button
              type="button"
              onClick={onCloseInfo}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex items-start gap-3 pr-8">
              <span className="text-2xl shrink-0">📋</span>
              <div>
                <h3 id="event-info-title" className="font-bold text-slate-900 text-lg">
                  {event.title}
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{event.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {children && (
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-3xl mx-auto">{children}</div>
        </div>
      )}
    </div>
  )
}
