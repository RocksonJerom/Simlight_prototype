import { useState } from 'react'
import { useSimulation } from '../../context/SimulationContext'
import { api } from '../../api/client'
import { ContentBlocksView } from '../content/ContentBlocksView'
import { ContentBlockEditor } from '../content/ContentBlockEditor'
import { AssessmentEditor } from '../assessment/AssessmentEditor'

const impactColors = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-red-100 text-red-700',
  Up: 'bg-green-100 text-green-700',
  Down: 'bg-red-100 text-red-700',
  Neutral: 'bg-slate-100 text-slate-600',
}

export function ReviewCustomizeStep() {
  const {
    simulationId,
    state,
    saving,
    selectedEventId,
    setSelectedEventId,
    selectedPhaseId,
    setSelectedPhaseId,
    updateEvent,
    addPhase,
    addEvent,
    reorderEvents,
    setCurrentStep,
    saveNow,
  } = useSimulation()
  const [newPhaseName, setNewPhaseName] = useState('')
  const [saved, setSaved] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const g = state.generated
  if (!g) {
    return (
      <div className="rounded-2xl border-2 border-teal-200 bg-white p-8 text-center text-slate-500">
        {state.meta.contentMode === 'manual'
          ? 'Go to Step 1 and click Build manually to start editing events and questions.'
          : state.meta.contentMode === 'document'
            ? 'Upload a document in Step 1 and click Create from document.'
            : 'Complete AI generation first to review content.'}
      </div>
    )
  }

  const selectedEvent = g.events.find((e) => e.id === selectedEventId) ?? g.events[0]
  const visibleEvents = selectedPhaseId
    ? g.events.filter((e) => e.phaseId === selectedPhaseId)
    : g.events

  const handlePhaseSelect = (phaseId: string) => {
    setSelectedPhaseId(phaseId)
    const phaseEvents = g.events.filter((e) => e.phaseId === phaseId)
    if (phaseEvents.length > 0) {
      const stillVisible = phaseEvents.some((e) => e.id === selectedEventId)
      if (!stillVisible) setSelectedEventId(phaseEvents[0].id)
    }
  }

  const handleSave = async () => {
    await saveNow()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAiSuggest = async () => {
    if (!selectedEvent || !simulationId) return
    setAiLoading(true)
    setAiError(null)
    try {
      const { decisions } = await api.generateEventQuestions(simulationId, selectedEvent.id)
      const newDecisions = decisions.map((text, i) => ({
        id: `d${Date.now()}_${i}`,
        text,
      }))
      updateEvent(selectedEvent.id, {
        decisions: newDecisions,
        assessment: { ...(selectedEvent.assessment ?? { type: 'mcq', prompt: 'What is your decision?' }), type: 'mcq' },
      })
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI suggestion failed')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-teal-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-teal-600 px-6 py-3 flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
          3
        </span>
        <h2 className="text-white font-semibold">Review & Customize</h2>
        <span
          className={`ml-auto text-xs text-white/80 transition-opacity ${saving ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={!saving}
        >
          Auto-saving…
        </span>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[420px]">
        <aside className="lg:w-64 border-r border-slate-200 bg-slate-50 p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Phases</h3>
              <button
                type="button"
                onClick={() => {
                  const name = newPhaseName || `Phase ${g.phases.length + 1}`
                  addPhase(name)
                  setNewPhaseName('')
                }}
                className="text-xs text-teal-600 hover:text-teal-800 font-medium"
              >
                + Add
              </button>
            </div>
            <ul className="space-y-1">
              {g.phases.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handlePhaseSelect(p.id)}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                      selectedPhaseId === p.id
                        ? 'bg-teal-100 text-teal-800 font-medium'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    {p.order}. {p.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Events</h3>
              <button
                type="button"
                onClick={() =>
                  addEvent(selectedPhaseId ?? g.phases[0]?.id ?? 'p1', 'New Event')
                }
                className="text-xs text-teal-600 hover:text-teal-800 font-medium"
              >
                + Add
              </button>
            </div>
            <ul className="space-y-1">
              {visibleEvents.length === 0 ? (
                <li className="px-2 py-1.5 text-xs text-slate-400 italic">No events in this phase</li>
              ) : (
                visibleEvents.map((e) => {
                  const i = g.events.findIndex((ev) => ev.id === e.id)
                  return (
                <li key={e.id}>
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(ev) => ev.preventDefault()}
                    onDrop={() => {
                      if (dragIndex !== null && dragIndex !== i) reorderEvents(dragIndex, i)
                      setDragIndex(null)
                    }}
                    onClick={() => setSelectedEventId(e.id)}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors cursor-grab active:cursor-grabbing ${
                      selectedEvent?.id === e.id
                        ? 'bg-teal-100 text-teal-800 font-medium'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    ⋮⋮ {e.title}
                  </button>
                </li>
                  )
                })
              )}
            </ul>
          </div>
        </aside>

        {selectedEvent && (
          <div className="flex-1 p-6 space-y-4">
            <input
              type="text"
              value={selectedEvent.title}
              onChange={(e) => updateEvent(selectedEvent.id, { title: e.target.value })}
              className="w-full text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2 outline-none focus:border-teal-500"
            />

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
              <textarea
                value={selectedEvent.description}
                onChange={(e) => updateEvent(selectedEvent.id, { description: e.target.value })}
                rows={4}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              />
            </div>

            {simulationId && (
            <ContentBlockEditor
              simulationId={simulationId}
              eventId={selectedEvent.id}
              blocks={selectedEvent.contentBlocks ?? []}
              onChange={(contentBlocks) => updateEvent(selectedEvent.id, { contentBlocks })}
            />
            )}

            {selectedEvent.contentBlocks && selectedEvent.contentBlocks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Learner preview</h4>
                <ContentBlocksView blocks={selectedEvent.contentBlocks} />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${impactColors[selectedEvent.impact.cost]}`}>
                Cost: {selectedEvent.impact.cost}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${impactColors[selectedEvent.impact.budget]}`}>
                Budget: {selectedEvent.impact.budget}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${impactColors[selectedEvent.impact.risk]}`}>
                Risk: {selectedEvent.impact.risk}
              </span>
            </div>

            <AssessmentEditor
              event={selectedEvent}
              onChange={(patch) => updateEvent(selectedEvent.id, patch)}
              onAiSuggest={handleAiSuggest}
              aiLoading={aiLoading}
              aiError={aiError}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700"
              >
                {saved ? '✓ Saved' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
              >
                Next: Add Media →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
