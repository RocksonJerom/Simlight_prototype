import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import type { PlaySession, SimulationRecord } from '../types/simulation'
import { getSceneMedia } from '../utils/media'
import { ContentBlocksView } from '../components/content/ContentBlocksView'
import { SimulationHudFromSession } from '../components/player/SimulationHud'
import { MetricsSidebar } from '../components/player/MetricsSidebar'
import { SimulationScene } from '../components/player/SimulationScene'
import { AssessmentPanel, type AssessmentResponse } from '../components/assessment/AssessmentPanel'
import { AiFeedbackPanel } from '../components/player/AiFeedbackPanel'
import { CompletionReport } from '../components/player/CompletionReport'
import { PageContainer } from '../components/layout/PageContainer'
import { feedbackQualityScore, progressPercent } from '../utils/player'

function formatTimeLeft(expiresAt?: string): string {
  if (!expiresAt) return ''
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return '0:00'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function isSessionExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() <= Date.now()
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
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [introDone, setIntroDone] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

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
    setInfoOpen(false)
  }, [session?.currentEventIndex])

  useEffect(() => {
    if (!session?.expiresAt || session.completed) return
    const tick = () => setTimeLeft(formatTimeLeft(session.expiresAt))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session?.expiresAt, session?.completed])

  const handleAssessment = async (assessmentResponse: AssessmentResponse) => {
    if (!sessionId || submitting || !simulation?.generated) return
    if (isSessionExpired(session?.expiresAt)) {
      setSubmitError('Time limit exceeded. Start a new session to continue playing.')
      return
    }
    const currentEvent = simulation.generated.events[session!.currentEventIndex]
    if (!currentEvent) return

    const options =
      assessmentResponse.type === 'mcq' || assessmentResponse.type === 'chart'
        ? assessmentResponse.type === 'chart'
          ? currentEvent.assessment?.chartOptions ?? []
          : currentEvent.decisions
        : []
    const decisionIndex =
      assessmentResponse.type === 'mcq' || assessmentResponse.type === 'chart'
        ? options.findIndex((d) => d.id === assessmentResponse.decisionId)
        : 1

    let payload: { decisionId: string } | { response: { text?: string; value?: string; blanks?: Record<string, string> } }
    if (assessmentResponse.type === 'mcq' || assessmentResponse.type === 'chart') {
      payload = { decisionId: assessmentResponse.decisionId }
    } else if (assessmentResponse.type === 'text') {
      payload = { response: { text: assessmentResponse.text } }
    } else if (assessmentResponse.type === 'formula') {
      payload = { response: { value: assessmentResponse.value } }
    } else if (assessmentResponse.type === 'fill_blank') {
      payload = { response: { blanks: assessmentResponse.blanks } }
    } else {
      payload = { response: {} }
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const { session: s, simulation: sim, aiFeedback, metricDeltas } = await api.makeDecision(
        sessionId,
        payload
      )
      setSession(s)
      setSimulation(sim)
      if (aiFeedback) {
        setLastFeedback(aiFeedback)
        setLastMetricDeltas(metricDeltas ?? null)
        setLastFeedbackScore(
          feedbackQualityScore(decisionIndex >= 0 ? decisionIndex : 1, Math.max(options.length, 3), metricDeltas)
        )
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not submit your answer'
      setSubmitError(message)
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
  const timeExpired = isSessionExpired(session.expiresAt)

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
        <PageContainer className="flex-1 py-6 sm:py-10 grid md:grid-cols-2 gap-6 lg:gap-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Scenario</h2>
            <p className="text-base text-slate-600 leading-relaxed">{simulation.generated.scenario}</p>
            <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">Learning objectives</h3>
            <ul className="text-base text-slate-600 space-y-2 list-disc pl-5">
              {simulation.meta.learningObjectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Journey</h2>
            <ol className="space-y-3">
              {simulation.generated.phases.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl text-base font-semibold text-slate-700"
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
        </PageContainer>
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
    <div className="h-screen bg-[#0a1628] flex flex-col overflow-hidden">
      <SimulationHudFromSession
        session={session}
        timeLeft={session.expiresAt ? timeLeft || formatTimeLeft(session.expiresAt) : undefined}
        totalEvents={events.length}
        title={simulation.meta.title}
        onInfoClick={() => setInfoOpen((open) => !open)}
        infoActive={infoOpen}
      />

      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-0">
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <SimulationScene
            phaseName={currentPhase?.name}
            industry={simulation.meta.industry}
            sceneMedia={sceneMedia}
            event={currentEvent}
            eventIndex={displayEventIndex}
            showInfo={infoOpen}
            onCloseInfo={() => setInfoOpen(false)}
          >
            {lastFeedback && lastFeedbackScore !== null && (
              <AiFeedbackPanel
                score={lastFeedbackScore}
                feedback={lastFeedback}
                metricDeltas={lastMetricDeltas ?? undefined}
                metricNames={metricNames}
                onDismiss={dismissFeedback}
              />
            )}
          </SimulationScene>

          {currentEvent && !lastFeedback && (
            <div className="bg-white border-t border-slate-200 shrink-0 max-h-[42vh] overflow-y-auto">
              <div className="p-5 sm:p-8 w-full">
                {timeExpired && (
                  <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <strong>Time&apos;s up.</strong> This session can no longer accept decisions. Go back to the
                    simulation page and start a new run to finish.
                  </div>
                )}
                {submitError && !timeExpired && (
                  <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {submitError}
                  </div>
                )}
                <ContentBlocksView blocks={currentEvent.contentBlocks} className="mb-5" />
                <AssessmentPanel
                  event={currentEvent}
                  onSubmit={handleAssessment}
                  disabled={submitting || timeExpired}
                />
              </div>
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
