import { useState } from 'react'
import { useSimulation } from '../../context/SimulationContext'
import { api } from '../../api/client'
import { ContentBlocksView } from '../content/ContentBlocksView'
import { ContentBlockEditor } from '../content/ContentBlockEditor'

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
      updateEvent(selectedEvent.id, { decisions: newDecisions })
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI suggestion failed')
    } finally {
      setAiLoading(false)
    }
  }

  const addDecision = () => {
    if (!selectedEvent) return
    const decisions = [
      ...selectedEvent.decisions,
      { id: `d${Date.now()}`, text: 'New option' },
    ]
    updateEvent(selectedEvent.id, { decisions })
  }

  return (
    <div className="rounded-2xl border-2 border-teal-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-teal-600 px-6 py-3 flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
          3
        </span>
        <h2 className="text-white font-semibold">Review & Customize</h2>
        {saving && <span className="ml-auto text-xs text-white/80">Auto-saving…</span>}
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
                <li
                  key={p.id}
                  className="px-2 py-1.5 text-sm text-slate-700 rounded hover:bg-white"
                >
                  {p.order}. {p.name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Events</h3>
              <button
                type="button"
                onClick={() => addEvent(g.phases[0]?.id ?? 'p1', 'New Event')}
                className="text-xs text-teal-600 hover:text-teal-800 font-medium"
              >
                + Add
              </button>
            </div>
            <ul className="space-y-1">
              {g.events.map((e, i) => (
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
              ))}
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

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase">Decision Points</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addDecision}
                    className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                  >
                    + Add option
                  </button>
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={aiLoading}
                    className="text-xs px-2 py-1 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50"
                  >
                    {aiLoading ? 'Generating…' : '✨ AI suggest questions'}
                  </button>
                </div>
              </div>
              {aiError && <p className="text-xs text-red-600 mb-2">{aiError}</p>}
              <ol className="space-y-2">
                {selectedEvent.decisions.map((d, i) => (
                  <li key={d.id} className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={d.text}
                      onChange={(e) => {
                        const decisions = selectedEvent.decisions.map((dec) =>
                          dec.id === d.id ? { ...dec, text: e.target.value } : dec
                        )
                        updateEvent(selectedEvent.id, { decisions })
                      }}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </li>
                ))}
              </ol>
            </div>

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
