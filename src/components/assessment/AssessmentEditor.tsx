import type { AssessmentType, Event, EventAssessment } from '../../types/simulation'
import {
  ASSESSMENT_TYPE_LABELS,
  defaultAssessment,
  ensureAssessment,
  newDecision,
  newFormulaVariable,
  syncBlanksFromTemplate,
} from '../../utils/assessment'

const TYPE_OPTIONS: AssessmentType[] = ['mcq', 'text', 'chart', 'formula', 'fill_blank']

export function AssessmentEditor({
  event,
  onChange,
  onAiSuggest,
  aiLoading,
  aiError,
}: {
  event: Event
  onChange: (patch: Partial<Event>) => void
  onAiSuggest?: () => void
  aiLoading?: boolean
  aiError?: string | null
}) {
  const assessment = ensureAssessment(event)

  const setAssessment = (patch: Partial<EventAssessment>) => {
    onChange({ assessment: { ...assessment, ...patch } })
  }

  const setType = (type: AssessmentType) => {
    const next = defaultAssessment(type)
    const patch: Partial<Event> = {
      assessment: { ...next, prompt: assessment.prompt || next.prompt },
    }
    if (type === 'mcq' && event.decisions.length === 0) {
      patch.decisions = [newDecision('Option A'), newDecision('Option B')]
    }
    onChange(patch)
  }

  const updateDecision = (id: string, text: string) => {
    onChange({
      decisions: event.decisions.map((d) => (d.id === id ? { ...d, text } : d)),
    })
  }

  const addDecision = () => {
    onChange({ decisions: [...event.decisions, newDecision()] })
  }

  const removeDecision = (id: string) => {
    if (event.decisions.length <= 1) return
    onChange({ decisions: event.decisions.filter((d) => d.id !== id) })
  }

  const updateChartOption = (id: string, text: string) => {
    setAssessment({
      chartOptions: (assessment.chartOptions ?? []).map((o) => (o.id === id ? { ...o, text } : o)),
    })
  }

  const addChartOption = () => {
    setAssessment({ chartOptions: [...(assessment.chartOptions ?? []), newDecision()] })
  }

  const removeChartOption = (id: string) => {
    const opts = assessment.chartOptions ?? []
    if (opts.length <= 1) return
    setAssessment({ chartOptions: opts.filter((o) => o.id !== id) })
  }

  const updateVariable = (index: number, field: 'name' | 'value', value: string) => {
    const variables = [...(assessment.variables ?? [])]
    variables[index] = { ...variables[index], [field]: value }
    setAssessment({ variables })
  }

  const updateBlank = (id: string, field: 'answer' | 'placeholder', value: string) => {
    setAssessment({
      blanks: (assessment.blanks ?? []).map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    })
  }

  const handleTemplateChange = (fillTemplate: string) => {
    setAssessment({
      fillTemplate,
      blanks: syncBlanksFromTemplate(fillTemplate, assessment.blanks),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-slate-500 uppercase">Learner Assessment</h4>
        {assessment.type === 'mcq' && onAiSuggest && (
          <button
            type="button"
            onClick={onAiSuggest}
            disabled={aiLoading}
            className="text-xs px-2 py-1 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50"
          >
            {aiLoading ? 'Generating…' : '✨ AI suggest options'}
          </button>
        )}
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">Assessment type</label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                assessment.type === t
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
              }`}
            >
              {ASSESSMENT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">Question prompt</label>
        <input
          type="text"
          value={assessment.prompt}
          onChange={(e) => setAssessment({ prompt: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
        />
      </div>

      {aiError && <p className="text-xs text-red-600">{aiError}</p>}

      {assessment.type === 'mcq' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-500">Answer options</label>
            <button
              type="button"
              onClick={addDecision}
              className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              + Add option
            </button>
          </div>
          <ol className="space-y-2">
            {event.decisions.map((d, i) => (
              <li key={d.id} className="flex items-center gap-2">
                <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={d.text}
                  onChange={(e) => updateDecision(d.id, e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeDecision(d.id)}
                  className="text-slate-400 hover:text-red-500 text-sm px-1"
                  title="Remove option"
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {assessment.type === 'text' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Input placeholder</label>
            <input
              type="text"
              value={assessment.placeholder ?? ''}
              onChange={(e) => setAssessment({ placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Min. characters for full credit</label>
            <input
              type="number"
              min={0}
              value={assessment.minLength ?? 30}
              onChange={(e) => setAssessment({ minLength: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>
      )}

      {assessment.type === 'chart' && assessment.chart && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Chart type</label>
              <select
                value={assessment.chart.type}
                onChange={(e) =>
                  setAssessment({
                    chart: { ...assessment.chart!, type: e.target.value as typeof assessment.chart.type },
                  })
                }
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
              >
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="pie">Pie</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Chart title</label>
              <input
                type="text"
                value={assessment.chart.title}
                onChange={(e) =>
                  setAssessment({ chart: { ...assessment.chart!, title: e.target.value } })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Labels (comma-separated)</label>
            <input
              type="text"
              value={assessment.chart.labels.join(', ')}
              onChange={(e) =>
                setAssessment({
                  chart: {
                    ...assessment.chart!,
                    labels: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Values (comma-separated)</label>
            <input
              type="text"
              value={assessment.chart.values.join(', ')}
              onChange={(e) =>
                setAssessment({
                  chart: {
                    ...assessment.chart!,
                    values: e.target.value
                      .split(',')
                      .map((s) => parseFloat(s.trim()))
                      .filter((n) => !Number.isNaN(n)),
                  },
                })
              }
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-500">Chart answer options</label>
              <button
                type="button"
                onClick={addChartOption}
                className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                + Add option
              </button>
            </div>
            <ol className="space-y-2">
              {(assessment.chartOptions ?? []).map((o, i) => (
                <li key={o.id} className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={o.text}
                    onChange={(e) => updateChartOption(o.id, e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeChartOption(o.id)}
                    className="text-slate-400 hover:text-red-500 text-sm px-1"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {assessment.type === 'formula' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Formula / expression</label>
            <input
              type="text"
              value={assessment.formula ?? ''}
              onChange={(e) => setAssessment({ formula: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              placeholder="e.g. NPV = CF₀ + CF₁/(1+r)"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-500">Given values</label>
              <button
                type="button"
                onClick={() =>
                  setAssessment({ variables: [...(assessment.variables ?? []), newFormulaVariable()] })
                }
                className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                + Add variable
              </button>
            </div>
            <div className="space-y-2">
              {(assessment.variables ?? []).map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => updateVariable(i, 'name', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={v.value}
                    onChange={(e) => updateVariable(i, 'value', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                    placeholder="Value"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Expected answer</label>
              <input
                type="text"
                value={assessment.expectedAnswer ?? ''}
                onChange={(e) => setAssessment({ expectedAnswer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tolerance (0–1)</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={assessment.tolerance ?? 0.05}
                onChange={(e) => setAssessment({ tolerance: parseFloat(e.target.value) || 0.05 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {assessment.type === 'fill_blank' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              Template (use <code className="text-teal-700">___</code> for each blank)
            </label>
            <textarea
              value={assessment.fillTemplate ?? ''}
              onChange={(e) => handleTemplateChange(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
            />
          </div>
          {(assessment.blanks ?? []).length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-slate-500 block">Correct answers per blank</label>
              {(assessment.blanks ?? []).map((b, i) => (
                <div key={b.id} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-16 shrink-0">Blank {i + 1}</span>
                  <input
                    type="text"
                    value={b.answer}
                    onChange={(e) => updateBlank(b.id, 'answer', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                    placeholder="Correct answer"
                  />
                  <input
                    type="text"
                    value={b.placeholder ?? ''}
                    onChange={(e) => updateBlank(b.id, 'placeholder', e.target.value)}
                    className="w-28 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                    placeholder="Hint"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
