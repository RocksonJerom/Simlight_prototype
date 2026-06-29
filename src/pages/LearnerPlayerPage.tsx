import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import type { PlaySession, SimulationRecord } from '../types/simulation'
import { getSceneMedia } from '../utils/media'
import { ContentBlocksView } from '../components/content/ContentBlocksView'
import { SimulationHudFromSession } from '../components/player/SimulationHud'
import { MetricsSidebar } from '../components/player/MetricsSidebar'
import { SimulationScene } from '../components/player/SimulationScene'
import { DecisionCards } from '../components/player/DecisionCards'
import { AiFeedbackPanel } from '../components/player/AiFeedbackPanel'
import { CompletionReport } from '../components/player/CompletionReport'
import { feedbackQualityScore, progressPercent } from '../utils/player'

function formatTimeLeft(expiresAt?: string): string {
  if (!expiresAt) return ''
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return '0:00'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LearnerPlayerPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<PlaySession | null>(null)
  const [simulation, setSimulation] = useState<SimulationRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lastFeedback, setLastFeedback] = useState<string | null>(null)
  const [lastMetricDeltas, setLastMetricDeltas] = useState<Record<string, number> | null>(null)
  const [lastFeedbackScore, setLastFeedbackScore] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [introDone, setIntroDone] = useState(false)

  const load = useCallback(() => {
    if (!sessionId) return
    api
      .getSession(sessionId)
      .then(({ session: s, simulation: sim }) => {
        setSession(s)
        setSimulation(sim)
        if (sessionId) localStorage.setItem(`simlight-session-${sim.id}`, sessionId)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(load, [load])

  useEffect(() => {
    if (!session?.expiresAt || session.completed) return
    const tick = () => setTimeLeft(formatTimeLeft(session.expiresAt))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session?.expiresAt, session?.completed])

  const handleDecision = async (decisionId: string) => {
    if (!sessionId || submitting || !simulation?.generated) return
    const currentEvent = simulation.generated.events[session!.currentEventIndex]
    if (!currentEvent) return

    const decisionIndex = currentEvent.decisions.findIndex((d) => d.id === decisionId)
    setSubmitting(true)

    try {
      const { session: s, simulation: sim, aiFeedback, metricDeltas } = await api.makeDecision(
        sessionId,
        decisionId
      )
      setSession(s)
      setSimulation(sim)
      if (aiFeedback) {
        setLastFeedback(aiFeedback)
        setLastMetricDeltas(metricDeltas ?? null)
        setLastFeedbackScore(
          feedbackQualityScore(decisionIndex, currentEvent.decisions.length, metricDeltas)
        )
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const dismissFeedback = () => {
    setLastFeedback(null)
    setLastMetricDeltas(null)
    setLastFeedbackScore(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center text-white">
        Loading simulation…
      </div>
    )
  }

  if (!session || !simulation?.generated) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center text-white gap-4">
        <p>Session not found.</p>
        <Link to="/teach" className="text-cyan-400">Back to dashboard</Link>
      </div>
    )
  }

  const events = simulation.generated.events
  const displayEventIndex = lastFeedback
    ? Math.max(0, session.currentEventIndex - 1)
    : session.currentEventIndex
  const currentEvent = events[displayEventIndex]
  const currentPhase = currentEvent
    ? simulation.generated.phases.find((p) => p.id === currentEvent.phaseId)
    : null
  const sceneMedia = getSceneMedia(simulation.assets)
  const metricNames = Object.fromEntries(simulation.generated.metrics.map((m) => [m.id, m.name]))
  const progressPct = lastFeedback
    ? progressPercent({ ...session, currentEventIndex: session.currentEventIndex }, events.length)
    : progressPercent(session, events.length)

  const showIntro =
    !introDone && session.currentEventIndex === 0 && session.decisionsMade.length === 0

  if (showIntro) {
    return (
      <div className="min-h-screen bg-[#f3f5f9] flex flex-col">
        <header className="bg-[#005b7f] text-white px-8 py-5">
          <p className="text-xs text-cyan-200 uppercase tracking-wider">SimLight 2.0</p>
          <h1 className="text-2xl font-bold">{simulation.meta.title}</h1>
          <p className="text-sm text-cyan-100/80 mt-1">
            AI-Powered Interactive Simulation · {simulation.meta.duration}
          </p>
        </header>
        <div className="flex-1 max-w-5xl mx-auto w-full p-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-2">Scenario</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{simulation.generated.scenario}</p>
            <h3 className="font-bold text-slate-900 mt-6 mb-2">Learning objectives</h3>
            <ul className="text-sm text-slate-600 space-y-1 list-disc pl-5">
              {simulation.meta.learningObjectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">Journey</h2>
            <ol className="space-y-2">
              {simulation.generated.phases.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700"
                >
                  <span className="w-8 h-8 rounded-full bg-[#eef7fc] text-[#005b7f] flex items-center justify-center text-xs font-bold">
                    {p.order}
                  </span>
                  {p.name}
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setIntroDone(true)}
              className="mt-6 w-full py-3.5 bg-[#005b7f] text-white font-semibold rounded-xl hover:bg-[#004d6b] shadow-lg shadow-[#005b7f]/20"
            >
              Begin Simulation →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (session.completed) {
    return (
      <CompletionReport
        session={session}
        metrics={simulation.generated.metrics}
        eventCount={events.length}
        lastFeedback={lastFeedback}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      <SimulationHudFromSession
        session={session}
        timeLeft={session.expiresAt ? timeLeft || formatTimeLeft(session.expiresAt) : undefined}
        totalEvents={events.length}
        title={simulation.meta.title}
      />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col min-w-0">
          <SimulationScene phaseName={currentPhase?.name} sceneMedia={sceneMedia} event={currentEvent}>
            {lastFeedback && lastFeedbackScore !== null && (
              <div className="mt-4">
                <AiFeedbackPanel
                  score={lastFeedbackScore}
                  feedback={lastFeedback}
                  metricDeltas={lastMetricDeltas ?? undefined}
                  metricNames={metricNames}
                  onDismiss={dismissFeedback}
                />
              </div>
            )}
          </SimulationScene>

          {currentEvent && !lastFeedback && (
            <div className="bg-white p-6 border-t border-slate-200">
              <ContentBlocksView blocks={currentEvent.contentBlocks} className="mb-5" />
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                What will you do?
              </h4>
              <DecisionCards
                decisions={currentEvent.decisions}
                onSelect={handleDecision}
                disabled={submitting}
              />
            </div>
          )}
        </div>

        <MetricsSidebar
          metrics={simulation.generated.metrics}
          metricScores={session.metricScores ?? {}}
          phases={simulation.generated.phases}
          currentPhaseId={currentPhase?.id}
          progressPct={progressPct}
          budget={session.budget}
          risk={session.risk}
          score={session.score}
        />
      </div>
    </div>
  )
}
