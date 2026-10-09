import type { SceneMedia } from '../../utils/media'

const BUILDINGS = [
  { left: '6%', width: 52, height: 90, color: '#3d5a73', delay: '0s' },
  { left: '16%', width: 68, height: 118, color: '#2a4a62', delay: '0.3s' },
  { left: '30%', width: 58, height: 98, color: '#005b7f', delay: '0.6s' },
  { left: '44%', width: 76, height: 132, color: '#1a4d6e', delay: '0.9s' },
  { left: '60%', width: 62, height: 104, color: '#3d5a73', delay: '0.5s' },
  { left: '74%', width: 54, height: 86, color: '#2a4a62', delay: '0.8s' },
  { left: '86%', width: 48, height: 76, color: '#005b7f', delay: '1.1s' },
]

function IsoBuilding({
  width,
  height,
  color,
  delay,
}: {
  width: number
  height: number
  color: string
  delay: string
}) {
  return (
    <div className="sim-building-simple" style={{ width, animationDelay: delay }}>
      <div
        className="sim-tower-roof"
        style={{ width: width + 8, background: `color-mix(in srgb, ${color} 50%, #67e8f9)` }}
      />
      <div
        className="sim-tower"
        style={{
          width,
          height,
          background: `linear-gradient(160deg, color-mix(in srgb, ${color} 80%, white), ${color})`,
        }}
      >
        <div className="sim-windows-simple">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="sim-window" style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </div>
      </div>
      <div className="sim-tower-shadow" style={{ width: width + 16 }} />
    </div>
  )
}

export function AnimatedSimulationWorld({
  phaseName,
  industry,
  eventTitle,
  eventIndex = 0,
}: {
  phaseName?: string
  industry?: string
  eventTitle?: string
  eventIndex?: number
}) {
  const accent = eventIndex % 3 === 0 ? '#22d3ee' : eventIndex % 3 === 1 ? '#34d399' : '#fbbf24'

  return (
    <div className="sim-world absolute inset-0 overflow-hidden">
      <div className="sim-sky" />
      <div className="sim-sun" />

      <div className="sim-cloud sim-cloud-1" />
      <div className="sim-cloud sim-cloud-2" />
      <div className="sim-cloud sim-cloud-3" />

      <div className="sim-grid-floor" />

      <div className="sim-city">
        {BUILDINGS.map((b, i) => (
          <div key={i} className="sim-building-wrap" style={{ left: b.left }}>
            <IsoBuilding width={b.width} height={b.height} color={b.color} delay={b.delay} />
          </div>
        ))}
      </div>

      <div className="sim-conveyor">
        <div className="sim-conveyor-belt" />
        <div className="sim-conveyor-box sim-conveyor-box-1" />
        <div className="sim-conveyor-box sim-conveyor-box-2" />
      </div>

      <div className="sim-truck">
        <div className="sim-truck-body" />
        <div className="sim-truck-cab" />
      </div>

      <div className="sim-particles">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="sim-particle" style={{ left: `${8 + i * 9}%`, animationDelay: `${i * 0.6}s` }} />
        ))}
      </div>

      <div className="sim-hud-badge" style={{ borderColor: accent }}>
        <p className="sim-hud-label">Active phase</p>
        <p className="sim-hud-phase">{phaseName ?? 'Simulation World'}</p>
        <p className="sim-hud-industry">{industry ?? 'Interactive business simulation'}</p>
      </div>

      {eventTitle && (
        <div className="sim-event-ticker">
          <span className="sim-event-dot" style={{ background: accent }} />
          <span className="sim-event-text">Event: {eventTitle}</span>
        </div>
      )}

      <div className="sim-scanline" aria-hidden />
    </div>
  )
}

export function SceneMediaPiP({ media }: { media: SceneMedia }) {
  return (
    <div className="sim-media-pip">
      <p className="sim-pip-label">{media.type === 'video' ? 'Uploaded scene clip' : 'Reference image'}</p>
      {media.type === 'video' ? (
        <video
          src={media.url}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          controls
          aria-label={media.name}
        />
      ) : (
        <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
      )}
    </div>
  )
}
