import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type {
  SimulationState,
  WizardStep,
  Event,
  Phase,
  ScoringMetric,
  MediaAsset,
  SimulationMeta,
  SimulationRecord,
  AiGenerationSource,
} from '../types/simulation'
import { api } from '../api/client'
import { createManualTemplate } from '../data/manualTemplate'
import { defaultAssessment } from '../utils/assessment'

export interface GenerationInfo {
  source: AiGenerationSource
  usedFallback: boolean
  error?: string
}

interface SimulationContextValue {
  simulationId: string | null
  state: SimulationState
  loading: boolean
  saving: boolean
  currentStep: WizardStep
  setCurrentStep: (step: WizardStep) => void
  updateMeta: (meta: Partial<SimulationMeta>) => void
  toggleObjective: (objective: string) => void
  runAIGeneration: () => Promise<void>
  runManualSetup: () => Promise<void>
  runDocumentGeneration: (file: File) => Promise<void>
  generating: boolean
  generationError: string | null
  updateEvent: (eventId: string, updates: Partial<Event>) => void
  addPhase: (name: string) => void
  addEvent: (phaseId: string, title: string) => void
  setSelectedEventId: (id: string | null) => void
  selectedEventId: string | null
  selectedPhaseId: string | null
  setSelectedPhaseId: (id: string | null) => void
  refreshSimulation: () => Promise<void>
  setAssetsFromServer: (assets: MediaAsset[]) => void
  updateMetric: (id: string, updates: Partial<ScoringMetric>) => void
  setScoringType: (type: SimulationState['scoringType']) => void
  setVisibility: (visibility: SimulationState['visibility']) => void
  publish: () => Promise<void>
  saveNow: () => Promise<void>
  reorderEvents: (fromIndex: number, toIndex: number) => void
  lastGeneration: GenerationInfo | null
  getOutputCounts: () => {
    scenarios: number
    phases: number
    events: number
    decisions: number
    metrics: number
    assets: number
    simulations: number
  }
}

const SimulationContext = createContext<SimulationContextValue | null>(null)

function recordToState(record: SimulationRecord): SimulationState {
  const { id: _id, createdAt: _c, updatedAt: _u, ...state } = record
  return state
}

export function SimulationProvider({
  simulationId,
  children,
}: {
  simulationId: string
  children: ReactNode
}) {
  const [state, setState] = useState<SimulationState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null)
  const [lastGeneration, setLastGeneration] = useState<GenerationInfo | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const skipAutoSave = useRef(true)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    skipAutoSave.current = true
    setLoading(true)
    api
      .getSimulation(simulationId)
      .then((record) => {
        setState(recordToState(record))
        if (record.aiGenerationComplete && record.generated) {
          const firstPhase = record.generated.phases[0]
          setSelectedPhaseId(firstPhase?.id ?? null)
          setSelectedEventId(record.generated.events[1]?.id ?? record.generated.events[0]?.id ?? null)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [simulationId])

  const persist = useCallback(
    async (next: SimulationState) => {
      setSaving(true)
      try {
        const updated = await api.updateSimulation(simulationId, next)
        skipAutoSave.current = true
        setState(recordToState(updated))
      } catch (e) {
        console.error(e)
      } finally {
        setSaving(false)
      }
    },
    [simulationId]
  )

  const updateLocal = useCallback((updater: (s: SimulationState) => SimulationState) => {
    setState((s) => (s ? updater(s) : s))
  }, [])

  const saveNow = useCallback(async () => {
    if (state) await persist(state)
  }, [state, persist])

  useEffect(() => {
    if (!state || loading) return
    if (skipAutoSave.current) {
      skipAutoSave.current = false
      return
    }
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      persist(state).catch(console.error)
    }, 1500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [state, loading, persist])

  const reorderEvents = useCallback((fromIndex: number, toIndex: number) => {
    updateLocal((s) => {
      if (!s.generated) return s
      const events = [...s.generated.events]
      const [moved] = events.splice(fromIndex, 1)
      events.splice(toIndex, 0, moved)
      return { ...s, generated: { ...s.generated, events } }
    })
  }, [updateLocal])

  const updateMeta = useCallback((meta: Partial<SimulationMeta>) => {
    updateLocal((s) => ({ ...s, meta: { ...s.meta, ...meta } }))
  }, [updateLocal])

  const toggleObjective = useCallback((objective: string) => {
    updateLocal((s) => {
      const objectives = s.meta.learningObjectives.includes(objective)
        ? s.meta.learningObjectives.filter((o) => o !== objective)
        : [...s.meta.learningObjectives, objective]
      return { ...s, meta: { ...s.meta, learningObjectives: objectives } }
    })
  }, [updateLocal])

  const runAIGeneration = useCallback(async () => {
    if (!state || generating) return
    setGenerationError(null)
    setGenerating(true)
    setCurrentStep(2)
    skipAutoSave.current = true

    const metaWithMode = { ...state.meta, contentMode: 'ai' as const }

    try {
      await api.updateSimulation(simulationId, {
        meta: metaWithMode,
        aiGenerationComplete: false,
        generated: null,
      })
      setState((s) =>
        s
          ? {
              ...s,
              meta: metaWithMode,
              aiGenerationComplete: false,
              generated: null,
              aiGenerationSource: undefined,
            }
          : s
      )
      setLastGeneration(null)

      const { simulation, generation } = await api.generateContent(simulationId)
      if (generation.usedFallback) {
        setGenerationError(generation.error ?? 'AI generation failed — demo content was not applied')
        return
      }
      const next = recordToState(simulation)
      setState(next)
      setLastGeneration(generation)
      skipAutoSave.current = false
      setSelectedPhaseId(simulation.generated?.phases[0]?.id ?? null)
      setSelectedEventId(
        simulation.generated?.events[1]?.id ?? simulation.generated?.events[0]?.id ?? null
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setGenerationError(message)
      console.error('AI generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }, [simulationId, state, generating])

  const runDocumentGeneration = useCallback(
    async (file: File) => {
      if (!state || generating) return
      setGenerationError(null)
      setGenerating(true)
      setCurrentStep(2)
      skipAutoSave.current = true

      const metaWithMode = { ...state.meta, contentMode: 'document' as const }

      try {
        await api.updateSimulation(simulationId, {
          meta: metaWithMode,
          aiGenerationComplete: false,
          generated: null,
        })
        setState((s) =>
          s
            ? {
                ...s,
                meta: metaWithMode,
                aiGenerationComplete: false,
                generated: null,
                aiGenerationSource: undefined,
              }
            : s
        )
        setLastGeneration(null)

        const { simulation, generation } = await api.generateFromDocument(simulationId, file)
        if (generation.usedFallback) {
          setGenerationError(generation.error ?? 'Document import failed — demo content was not applied')
          return
        }
        const next = recordToState(simulation)
        setState(next)
        setLastGeneration(generation)
        skipAutoSave.current = false
        setSelectedPhaseId(simulation.generated?.phases[0]?.id ?? null)
        setSelectedEventId(
          simulation.generated?.events[1]?.id ?? simulation.generated?.events[0]?.id ?? null
        )
        setCurrentStep(3)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Document import failed'
        setGenerationError(message)
        console.error('Document generation failed:', err)
      } finally {
        setGenerating(false)
      }
    },
    [simulationId, state, generating]
  )

  const runManualSetup = useCallback(async () => {
    if (!state || generating) return
    setGenerationError(null)
    skipAutoSave.current = true

    const metaWithMode = { ...state.meta, contentMode: 'manual' as const }
    const generated = createManualTemplate(metaWithMode)

    try {
      const updated = await api.updateSimulation(simulationId, {
        meta: metaWithMode,
        generated,
        aiGenerationComplete: true,
        aiGenerationSource: undefined,
      })
      const next = recordToState(updated)
      setState(next)
      skipAutoSave.current = false
      setSelectedPhaseId(generated.phases[0]?.id ?? null)
      setSelectedEventId(generated.events[0]?.id ?? null)
      setCurrentStep(3)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start manual build'
      setGenerationError(message)
      console.error('Manual setup failed:', err)
    }
  }, [simulationId, state, generating])

  const updateEvent = useCallback((eventId: string, updates: Partial<Event>) => {
    updateLocal((s) => {
      if (!s.generated) return s
      return {
        ...s,
        generated: {
          ...s.generated,
          events: s.generated.events.map((e) =>
            e.id === eventId ? { ...e, ...updates } : e
          ),
        },
      }
    })
  }, [updateLocal])

  const addPhase = useCallback((name: string) => {
    const newPhaseId = `p${Date.now()}`
    updateLocal((s) => {
      if (!s.generated) return s
      const newPhase: Phase = {
        id: newPhaseId,
        name,
        order: s.generated.phases.length + 1,
      }
      return {
        ...s,
        generated: { ...s.generated, phases: [...s.generated.phases, newPhase] },
      }
    })
    setSelectedPhaseId(newPhaseId)
  }, [updateLocal])

  const addEvent = useCallback((phaseId: string, title: string) => {
    const newEventId = `e${Date.now()}`
    updateLocal((s) => {
      if (!s.generated) return s
      const newEvent: Event = {
        id: newEventId,
        phaseId,
        title,
        description: 'New event description...',
        impact: { cost: 'Low', budget: 'Neutral', risk: 'Low' },
        decisions: [
          { id: `d${Date.now()}_1`, text: 'Option A' },
          { id: `d${Date.now()}_2`, text: 'Option B' },
        ],
        assessment: defaultAssessment('mcq'),
      }
      return {
        ...s,
        generated: { ...s.generated, events: [...s.generated.events, newEvent] },
      }
    })
    setSelectedPhaseId(phaseId)
    setSelectedEventId(newEventId)
  }, [updateLocal])

  const refreshSimulation = useCallback(async () => {
    const record = await api.getSimulation(simulationId)
    setState(recordToState(record))
  }, [simulationId])

  const setAssetsFromServer = useCallback((assets: MediaAsset[]) => {
    updateLocal((s) => ({ ...s, assets }))
  }, [updateLocal])

  const updateMetric = useCallback((id: string, updates: Partial<ScoringMetric>) => {
    updateLocal((s) => {
      if (!s.generated) return s
      return {
        ...s,
        generated: {
          ...s.generated,
          metrics: s.generated.metrics.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        },
      }
    })
  }, [updateLocal])

  const setScoringType = useCallback((type: SimulationState['scoringType']) => {
    updateLocal((s) => ({ ...s, scoringType: type }))
  }, [updateLocal])

  const setVisibility = useCallback((visibility: SimulationState['visibility']) => {
    updateLocal((s) => ({ ...s, visibility }))
  }, [updateLocal])

  const publish = useCallback(async () => {
    const updated = await api.publishSimulation(simulationId, state?.visibility)
    setState(recordToState(updated))
    setCurrentStep(7)
  }, [simulationId, state?.visibility])

  const getOutputCounts = useCallback(() => {
    if (!state) {
      return { scenarios: 0, phases: 0, events: 0, decisions: 0, metrics: 0, assets: 0, simulations: 0 }
    }
    const g = state.generated
    return {
      scenarios: g ? 1 : 0,
      phases: g?.phases.length ?? 0,
      events: g?.events.length ?? 0,
      decisions: g?.events.reduce((sum, e) => sum + e.decisions.length, 0) ?? 0,
      metrics: g?.metrics.length ?? 0,
      assets: state.assets.length,
      simulations: state.isPublished ? 1 : 0,
    }
  }, [state])

  if (loading || !state) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-500">
        Loading simulation…
      </div>
    )
  }

  return (
    <SimulationContext.Provider
      value={{
        simulationId,
        state,
        loading,
        saving,
        currentStep,
        setCurrentStep,
        updateMeta,
        toggleObjective,
        runAIGeneration,
        runManualSetup,
        runDocumentGeneration,
        generating,
        generationError,
        updateEvent,
        addPhase,
        addEvent,
        setSelectedEventId,
        selectedEventId,
        selectedPhaseId,
        setSelectedPhaseId,
        refreshSimulation,
        setAssetsFromServer,
        updateMetric,
        setScoringType,
        setVisibility,
        publish,
        saveNow,
        reorderEvents,
        lastGeneration,
        getOutputCounts,
      }}
    >
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const ctx = useContext(SimulationContext)
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider')
  return ctx
}
