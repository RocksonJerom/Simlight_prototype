import { useState } from 'react'
import type { Event } from '../../types/simulation'
import {
  assessmentOptionsForEvent,
  getAssessmentPrompt,
  getAssessmentType,
} from '../../utils/assessment'
import { DecisionCards } from '../player/DecisionCards'
import { ContentBlocksView } from '../content/ContentBlocksView'

export type AssessmentResponse =
  | { type: 'mcq' | 'chart'; decisionId: string }
  | { type: 'text'; text: string }
  | { type: 'formula'; value: string }
  | { type: 'fill_blank'; blanks: Record<string, string> }

export function AssessmentPanel({
  event,
  onSubmit,
  disabled,
}: {
  event: Event
  onSubmit: (response: AssessmentResponse) => void
  disabled?: boolean
}) {
  const type = getAssessmentType(event)
  const prompt = getAssessmentPrompt(event)
  const assessment = event.assessment

  const [textValue, setTextValue] = useState('')
  const [formulaValue, setFormulaValue] = useState('')
  const [blankValues, setBlankValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const b of assessment?.blanks ?? []) init[b.id] = ''
    return init
  })

  if (type === 'mcq') {
    return (
      <div>
        <h4 className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider mb-4">{prompt}</h4>
        <DecisionCards
          decisions={event.decisions}
          onSelect={(id) => onSubmit({ type: 'mcq', decisionId: id })}
          disabled={disabled}
        />
      </div>
    )
  }

  if (type === 'chart' && assessment?.chart) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider mb-4">{prompt}</h4>
        <ContentBlocksView
          blocks={[{ id: 'chart_preview', type: 'chart', chart: assessment.chart }]}
        />
        <DecisionCards
          decisions={assessmentOptionsForEvent(event)}
          onSelect={(id) => onSubmit({ type: 'chart', decisionId: id })}
          disabled={disabled}
        />
      </div>
    )
  }

  if (type === 'text') {
    return (
      <div className="space-y-3">
        <h4 className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider mb-4">{prompt}</h4>
        <textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          rows={5}
          placeholder={assessment?.placeholder ?? 'Type your response…'}
          disabled={disabled}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#005b7f] outline-none resize-none disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled || !textValue.trim()}
          onClick={() => onSubmit({ type: 'text', text: textValue.trim() })}
          className="px-5 py-2.5 bg-[#005b7f] text-white text-sm font-semibold rounded-lg hover:bg-[#004a66] disabled:opacity-50"
        >
          Submit response
        </button>
      </div>
    )
  }

  if (type === 'formula') {
    return (
      <div className="space-y-4">
        <h4 className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider mb-4">{prompt}</h4>
        {assessment?.formula && (
          <p className="text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800">
            {assessment.formula}
          </p>
        )}
        {(assessment?.variables ?? []).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(assessment?.variables ?? []).map((v) => (
              <div key={v.name} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                <p className="text-[10px] uppercase text-slate-500 font-semibold">{v.name}</p>
                <p className="text-sm font-medium text-slate-800">{v.value}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-slate-500 mb-1 block">Your calculated answer</label>
            <input
              type="text"
              value={formulaValue}
              onChange={(e) => setFormulaValue(e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005b7f] outline-none disabled:opacity-50"
              placeholder="Enter numeric result"
            />
          </div>
          <button
            type="button"
            disabled={disabled || !formulaValue.trim()}
            onClick={() => onSubmit({ type: 'formula', value: formulaValue.trim() })}
            className="px-5 py-2.5 bg-[#005b7f] text-white text-sm font-semibold rounded-lg hover:bg-[#004a66] disabled:opacity-50"
          >
            Submit answer
          </button>
        </div>
      </div>
    )
  }

  if (type === 'fill_blank') {
    const template = assessment?.fillTemplate ?? ''
    const parts = template.split('___')
    const blanks = assessment?.blanks ?? []

    return (
      <div className="space-y-4">
        <h4 className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider mb-4">{prompt}</h4>
        <div className="text-sm text-slate-800 leading-loose flex flex-wrap items-center gap-1">
          {parts.map((part, i) => (
            <span key={i} className="contents">
              <span>{part}</span>
              {i < blanks.length && (
                <input
                  type="text"
                  value={blankValues[blanks[i].id] ?? ''}
                  onChange={(e) =>
                    setBlankValues((prev) => ({ ...prev, [blanks[i].id]: e.target.value }))
                  }
                  placeholder={blanks[i].placeholder ?? '…'}
                  disabled={disabled}
                  className="inline-block w-32 px-2 py-1 border-b-2 border-teal-400 bg-teal-50/50 text-sm outline-none focus:border-teal-600 disabled:opacity-50"
                />
              )}
            </span>
          ))}
        </div>
        <button
          type="button"
          disabled={
            disabled ||
            blanks.some((b) => !(blankValues[b.id] ?? '').trim())
          }
          onClick={() => onSubmit({ type: 'fill_blank', blanks: blankValues })}
          className="px-5 py-2.5 bg-[#005b7f] text-white text-sm font-semibold rounded-lg hover:bg-[#004a66] disabled:opacity-50"
        >
          Submit answers
        </button>
      </div>
    )
  }

  return null
}
