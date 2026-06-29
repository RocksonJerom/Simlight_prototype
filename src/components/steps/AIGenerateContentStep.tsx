import { useEffect, useState } from 'react'
import { AI_GENERATION_TASKS } from '../../data/mockData'
import { useSimulation } from '../../context/SimulationContext'
import { api, type AiStatus } from '../../api/client'

const SOURCE_LABELS = {
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  nvidia: 'NVIDIA NIM',
  groq: 'Groq',
  mock: 'Demo Mode',
}

export function AIGenerateContentStep() {
  const {
    state,
    lastGeneration,
    generating,
    generationError,
    runAIGeneration,
    runDocumentGeneration,
    setCurrentStep,
  } = useSimulation()
  const [completedTasks, setCompletedTasks] = useState(0)
  const [progress, setProgress] = useState(0)
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)

  useEffect(() => {
    api.getAiStatus().then(setAiStatus).catch(console.error)
  }, [])

  const isLoading = generating || (!state.aiGenerationComplete && !generationError)

  useEffect(() => {
    if (!isLoading) {
      if (state.aiGenerationComplete) {
        setCompletedTasks(AI_GENERATION_TASKS.length)
        setProgress(100)
      }
      return
    }

    setCompletedTasks(0)
    setProgress(5)

    const taskInterval = setInterval(() => {
      setCompletedTasks((c) => Math.min(c + 1, AI_GENERATION_TASKS.length - 1))
    }, 800)

    const progressInterval = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + 3))
    }, 400)

    return () => {
      clearInterval(taskInterval)
      clearInterval(progressInterval)
    }
  }, [isLoading, state.aiGenerationComplete])

  useEffect(() => {
    if (state.aiGenerationComplete && !generating) {
      setCompletedTasks(AI_GENERATION_TASKS.length)
      setProgress(100)
    }
  }, [state.aiGenerationComplete, generating])

  const g = state.generated
  const source = lastGeneration?.source ?? state.aiGenerationSource

  if (state.meta.contentMode === 'manual') {
    return (
      <div className="rounded-2xl border-2 border-teal-200 bg-white overflow-hidden shadow-sm">
        <div className="bg-teal-600 px-6 py-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
            2
          </span>
          <h2 className="text-white font-semibold">AI Generate Content</h2>
        </div>
        <div className="p-8 text-center space-y-4">
          <p className="text-slate-600">
            You chose <strong>manual</strong> content creation. AI generation is skipped — edit events
            and questions in Step 3.
          </p>
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700"
          >
            Go to Review & Customize →
          </button>
        </div>
      </div>
    )
  }

  if (!generating && !state.aiGenerationComplete && !generationError) {
    return (
      <div className="rounded-2xl border-2 border-blue-200 bg-white overflow-hidden shadow-sm">
        <div className="bg-blue-600 px-6 py-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
            2
          </span>
          <h2 className="text-white font-semibold">AI Generate Content</h2>
        </div>
        <div className="p-8 text-center space-y-4">
          <p className="text-slate-600">
            Generation has not started yet. Go back to Step 1 and{' '}
            {state.meta.contentMode === 'document' ? (
              <>
                upload a document, then click <strong>Create from document</strong>.
              </>
            ) : (
              <>
                click <strong>Generate with AI</strong>.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
          >
            ← Back to Define
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-blue-600 px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
            2
          </span>
          <h2 className="text-white font-semibold">AI Generate Content</h2>
        </div>
        {aiStatus && (
          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
            {aiStatus.configured ? `🤖 ${aiStatus.model}` : '⚙️ Demo mode'}
          </span>
        )}
      </div>

      <div className="p-6">
        {generationError && !state.aiGenerationComplete ? (
          <div className="space-y-4">
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <strong>Generation failed:</strong> {generationError}
            </p>
            <p className="text-sm text-slate-600">
              Check your API key in <code className="text-xs bg-slate-100 px-1 rounded">.env</code>, ensure
              the server is running, then retry. Demo content will be used if the LLM is unreachable.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  state.meta.contentMode === 'document' ? runDocumentGeneration : runAIGeneration
                }
                disabled={generating || state.meta.contentMode === 'document'}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {state.meta.contentMode === 'document' ? 'Retry from Step 1' : 'Retry generation'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
              >
                ← Back to Define
              </button>
            </div>
          </div>
        ) : !state.aiGenerationComplete ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {generating
                ? aiStatus?.configured
                  ? `Calling ${aiStatus.model}… this can take 30–90 seconds.`
                  : 'Generating demo content…'
                : 'Preparing…'}
            </p>
            <ul className="space-y-2">
              {AI_GENERATION_TASKS.map((task, i) => (
                <li key={task} className="flex items-center gap-3 text-sm">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      i < completedTasks
                        ? 'bg-green-500 text-white'
                        : i === completedTasks && generating
                          ? 'bg-blue-500 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {i < completedTasks ? '✓' : i === completedTasks && generating ? '…' : ''}
                  </span>
                  <span className={i < completedTasks ? 'text-slate-800' : 'text-slate-500'}>{task}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : g ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                  ✓
                </span>
                Content generated successfully
              </div>
              {source && (
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    source === 'mock' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  via {SOURCE_LABELS[source]}
                </span>
              )}
            </div>

            {lastGeneration?.usedFallback && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                LLM call failed — demo content was used instead.
                {lastGeneration.error && (
                  <span className="block text-xs text-amber-600 mt-1">{lastGeneration.error}</span>
                )}
              </p>
            )}

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase">Scenario</h4>
                <p className="text-sm text-slate-700 mt-1">{g.scenario}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase">Phases</h4>
                <ul className="mt-1 space-y-1">
                  {g.phases.map((ph) => (
                    <li key={ph.id} className="text-sm text-slate-700 flex items-center gap-2">
                      <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded text-xs flex items-center justify-center font-medium">
                        {ph.order}
                      </span>
                      {ph.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-blue-600">{g.events.length}</p>
                  <p className="text-xs text-slate-500">Events</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-blue-600">
                    {g.events.reduce((s, e) => s + e.decisions.length, 0)}
                  </p>
                  <p className="text-xs text-slate-500">Decisions</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-blue-600">{g.metrics.length}</p>
                  <p className="text-xs text-slate-500">Metrics</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              Continue to Review & Customize →
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
