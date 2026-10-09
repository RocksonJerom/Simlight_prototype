import { useCallback, useEffect, useRef, useState } from 'react'

export function SceneVideoPlayer({
  src,
  name,
  className = '',
}: {
  src: string
  name: string
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)

  const tryPlay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    try {
      await video.play()
      setPlaying(true)
      setError(false)
    } catch {
      setPlaying(false)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onLoaded = () => tryPlay()
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onError = () => setError(true)
    const onVolumeChange = () => setMuted(video.muted)

    video.addEventListener('loadeddata', onLoaded)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('error', onError)
    video.addEventListener('volumechange', onVolumeChange)
    tryPlay()

    return () => {
      video.removeEventListener('loadeddata', onLoaded)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('error', onError)
      video.removeEventListener('volumechange', onVolumeChange)
    }
  }, [src, tryPlay])

  const enableSound = async () => {
    const video = videoRef.current
    if (!video) return
    video.muted = false
    video.volume = 1
    setMuted(false)
    await tryPlay()
  }

  return (
    <div className="absolute inset-0 z-[1] bg-black">
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-full object-cover object-center ${className}`}
        autoPlay
        loop
        playsInline
        muted={muted}
        controls
        preload="auto"
        aria-label={name}
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm p-6 text-center z-[3]">
          Unable to load scene video. Re-upload the file in Step 4 (Add Media).
        </div>
      )}

      {!playing && !error && (
        <button
          type="button"
          onClick={tryPlay}
          className="absolute inset-0 z-[2] flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          aria-label="Play scene video"
        >
          <span className="w-16 h-16 rounded-full bg-white/90 text-slate-900 flex items-center justify-center text-2xl shadow-lg">
            ▶
          </span>
        </button>
      )}

      {muted && !error && (
        <div className="absolute top-3 right-3 z-[4] pointer-events-auto">
          <button
            type="button"
            onClick={enableSound}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg border border-cyan-400/50"
          >
            <span aria-hidden>🔊</span>
            Enable audio
          </button>
        </div>
      )}
    </div>
  )
}
