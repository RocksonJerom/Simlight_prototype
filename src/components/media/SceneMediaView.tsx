import type { VideoHTMLAttributes } from 'react'
import type { SceneMedia } from '../../utils/media'

export function SceneMediaView({
  media,
  className = '',
  videoProps = {},
}: {
  media: SceneMedia | null
  className?: string
  videoProps?: VideoHTMLAttributes<HTMLVideoElement>
}) {
  if (!media) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-7xl mb-2">🏭</div>
          <p className="text-slate-400 text-sm">No scene media uploaded</p>
        </div>
      </div>
    )
  }

  if (media.type === 'video') {
    return (
      <video
        src={media.url}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        controls
        aria-label={media.name}
        {...videoProps}
      />
    )
  }

  return <img src={media.url} alt={media.name} className={className} />
}
