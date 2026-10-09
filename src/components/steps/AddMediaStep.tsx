import { useRef, useState } from 'react'
import { useSimulation } from '../../context/SimulationContext'
import { api } from '../../api/client'
import { getSceneMedia } from '../../utils/media'

function UploadZone({
  label,
  accept,
  onUpload,
  uploading,
}: {
  label: string
  accept: string
  onUpload: (file: File) => void
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full py-3 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 text-sm font-medium hover:bg-orange-50 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : label}
      </button>
    </>
  )
}

export function AddMediaStep() {
  const { simulationId, state, setAssetsFromServer, setCurrentStep } = useSimulation()
  const [uploading, setUploading] = useState(false)
  const [generatingScene, setGeneratingScene] = useState(false)
  const [scenePrompt, setScenePrompt] = useState('')
  const [error, setError] = useState('')

  const images = state.assets.filter((a) => a.type === 'image')
  const documents = state.assets.filter((a) => a.type === 'document')
  const videos = state.assets.filter((a) => a.type === 'video')
  const sceneMedia = getSceneMedia(state.assets)

  const handleUpload = async (file: File) => {
    if (!simulationId) return
    setUploading(true)
    setError('')
    try {
      const { simulation } = await api.uploadAsset(simulationId, file)
      setAssetsFromServer(simulation.assets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (assetId: string) => {
    if (!simulationId) return
    try {
      const simulation = await api.deleteAsset(simulationId, assetId)
      setAssetsFromServer(simulation.assets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleGenerateScene = async () => {
    if (!simulationId) return
    setGeneratingScene(true)
    setError('')
    try {
      const { simulation } = await api.generateSceneVisual(
        simulationId,
        scenePrompt.trim() || undefined
      )
      setAssetsFromServer(simulation.assets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scene generation failed')
    } finally {
      setGeneratingScene(false)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-orange-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-orange-600 px-6 py-3 flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
          4
        </span>
        <h2 className="text-white font-semibold">Add Media & Assets</h2>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <section className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-violet-900">AI scene video (Hugging Face + fal.ai)</h3>
          <p className="text-xs text-violet-800">
            Generates a short scene clip from your prompt using{' '}
            <code className="bg-white/70 px-1 rounded">Wan-AI/Wan2.2-TI2V-5B</code> via Hugging Face Inference.
            The clip appears in the learner play corner panel next to the animated simulation world. Set{' '}
            <code className="bg-white/70 px-1 rounded">HF_TOKEN</code> in .env (free token at huggingface.co/settings/tokens).
          </p>
          <textarea
            value={scenePrompt}
            onChange={(e) => setScenePrompt(e.target.value)}
            rows={2}
            placeholder={`Optional: custom prompt (default uses "${state.meta.title}" + ${state.meta.industry})`}
            className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-400 outline-none resize-none bg-white"
          />
          <button
            type="button"
            onClick={handleGenerateScene}
            disabled={generatingScene || uploading}
            className="px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {generatingScene ? 'Generating video… (1–3 min)' : '✨ Generate scene video (HF)'}
          </button>
        </section>

        {sceneMedia && (
          <section className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <h3 className="text-sm font-semibold text-orange-900 mb-2">Scene media preview</h3>
            <p className="text-xs text-orange-800 mb-3">
              Shows in the corner panel during play. The main view is always the animated simulation world.
            </p>
            <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
              {sceneMedia.type === 'video' ? (
                <video
                  src={sceneMedia.url}
                  className="w-full h-full object-cover"
                  controls
                  muted
                  playsInline
                />
              ) : (
                <img src={sceneMedia.url} alt={sceneMedia.name} className="w-full h-full object-cover" />
              )}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Images</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.name}
                    className="aspect-video rounded-lg object-cover w-full bg-slate-100"
                  />
                ) : (
                  <div className="aspect-video rounded-lg bg-slate-200 flex items-center justify-center text-2xl">
                    🖼️
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1 truncate">{img.name}</p>
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="aspect-video flex items-stretch">
              <UploadZone
                label="+ Upload Image"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onUpload={handleUpload}
                uploading={uploading}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Documents</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {doc.name}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                    )}
                    <p className="text-xs text-slate-500">{doc.size}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-500 opacity-0 group-hover:opacity-100 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <UploadZone
              label="+ Upload Document (PDF, Excel, TXT)"
              accept=".pdf,.xlsx,.xls,.txt,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onUpload={handleUpload}
              uploading={uploading}
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Videos</h3>
          <p className="text-xs text-slate-500 mb-3">
            Videos are used as the simulation scene background (preferred over images).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {videos.map((vid) => (
              <div key={vid.id} className="relative group rounded-lg border border-slate-200 overflow-hidden bg-slate-900">
                {vid.url ? (
                  <video
                    src={vid.url}
                    className="aspect-video w-full object-cover"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="aspect-video flex items-center justify-center text-white text-2xl">▶</div>
                )}
                <div className="px-3 py-2 bg-white flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{vid.name}</p>
                    <p className="text-xs text-slate-500">{vid.size}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(vid.id)}
                    className="text-red-500 text-sm shrink-0 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <UploadZone
              label="+ Upload Video (MP4, WebM)"
              accept="video/mp4,video/webm,video/quicktime"
              onUpload={handleUpload}
              uploading={uploading}
            />
          </div>
        </section>

        <button
          type="button"
          onClick={() => setCurrentStep(5)}
          className="px-5 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700"
        >
          Next: Configure Scoring →
        </button>
      </div>
    </div>
  )
}
