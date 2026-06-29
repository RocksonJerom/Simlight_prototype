import { useState } from 'react'
import type { ContentBlock, ContentBlockType, ChartType } from '../../types/simulation'
import { api } from '../../api/client'
import { ContentBlocksView } from './ContentBlocksView'

function newBlock(type: ContentBlockType): ContentBlock {
  const id = `cb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  if (type === 'text') {
    return { id, type: 'text', title: 'New section', text: 'Enter your text here…' }
  }
  if (type === 'table') {
    return {
      id,
      type: 'table',
      title: 'Data table',
      table: {
        headers: ['Column A', 'Column B', 'Column C'],
        rows: [
          ['', '', ''],
          ['', '', ''],
        ],
      },
    }
  }
  return {
    id,
    type: 'chart',
    title: 'Chart',
    chart: {
      type: 'pie',
      title: 'Chart',
      labels: ['Q1', 'Q2', 'Q3'],
      values: [30, 45, 25],
    },
  }
}

export function ContentBlockEditor({
  simulationId,
  eventId,
  blocks,
  onChange,
}: {
  simulationId: string
  eventId: string
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(blocks[0]?.id ?? null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const updateBlock = (id: string, patch: Partial<ContentBlock>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  const removeBlock = (id: string) => {
    if (!window.confirm('Delete this content block?')) return
    onChange(blocks.filter((b) => b.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const clearAll = () => {
    if (!window.confirm('Remove all text, table, and chart blocks from this event?')) return
    onChange([])
    setExpandedId(null)
  }

  const addBlock = (type: ContentBlockType) => {
    const block = newBlock(type)
    onChange([...blocks, block])
    setExpandedId(block.id)
  }

  const runAi = async (mode: 'all' | ContentBlockType, replace = false) => {
    setAiLoading(mode)
    setAiError(null)
    try {
      const { contentBlocks } = await api.generateContentBlocks(simulationId, eventId, { mode, replace })
      onChange(contentBlocks)
      if (contentBlocks[0]) setExpandedId(contentBlocks[0].id)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI generation failed')
    } finally {
      setAiLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-slate-500 uppercase">Event content blocks</h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => runAi('all', blocks.length > 0)}
            disabled={!!aiLoading}
            className="text-xs px-2.5 py-1 rounded-lg bg-violet-100 text-violet-800 hover:bg-violet-200 font-medium disabled:opacity-50"
          >
            {aiLoading === 'all' ? '⏳ AI…' : '✨ AI generate blocks'}
          </button>
          <button
            type="button"
            onClick={() => addBlock('text')}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
          >
            + Text
          </button>
          <button
            type="button"
            onClick={() => addBlock('table')}
            className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
          >
            + Table
          </button>
          <button
            type="button"
            onClick={() => addBlock('chart')}
            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
          >
            + Chart
          </button>
          {blocks.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Add or delete text, tables, and charts. Use <strong>AI generate blocks</strong> to auto-create from the event title.
      </p>

      {aiError && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{aiError}</p>
      )}

      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
          No blocks yet. Upload a document in Step 1, click <strong>AI generate blocks</strong>, or add manually.
        </div>
      ) : (
        <ul className="space-y-2">
          {blocks.map((block) => (
            <li key={block.id} className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === block.id ? null : block.id)}
                  className="flex-1 flex items-center justify-between text-left hover:text-teal-700 min-w-0"
                >
                  <span className="text-sm font-medium text-slate-800 truncate">
                    {block.type === 'text' && '📝'}
                    {block.type === 'table' && '📊'}
                    {block.type === 'chart' && '📈'}{' '}
                    {block.title || block.type}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0 ml-2">
                    {expandedId === block.id ? '▲' : '▼'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  title="Delete block"
                  className="shrink-0 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                >
                  🗑 Delete
                </button>
              </div>

              {expandedId === block.id && (
                <div className="p-4 space-y-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => runAi(block.type, true)}
                    disabled={!!aiLoading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                  >
                    {aiLoading === block.type ? '⏳ Generating…' : `✨ AI regenerate ${block.type}`}
                  </button>

                  <input
                    type="text"
                    value={block.title ?? ''}
                    onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Block title"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />

                  {block.type === 'text' && (
                    <textarea
                      value={block.text ?? ''}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      rows={6}
                      placeholder="Write case text, instructions, bullet points…"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm leading-relaxed resize-y min-h-[120px]"
                    />
                  )}

                  {block.type === 'table' && block.table && (
                    <div className="overflow-x-auto space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        {block.table.headers.map((h, ci) => (
                          <div key={ci} className="flex gap-1 items-center">
                            <input
                              value={h}
                              onChange={(e) => {
                                const headers = [...block.table!.headers]
                                headers[ci] = e.target.value
                                updateBlock(block.id, { table: { ...block.table!, headers } })
                              }}
                              className="w-24 px-2 py-1 border border-slate-200 rounded text-xs font-semibold"
                            />
                            {block.table!.headers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const headers = block.table!.headers.filter((_, i) => i !== ci)
                                  const rows = block.table!.rows.map((r) => r.filter((_, i) => i !== ci))
                                  updateBlock(block.id, { table: { headers, rows } })
                                }}
                                className="text-red-500 text-xs"
                                title="Remove column"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            updateBlock(block.id, {
                              table: {
                                headers: [...block.table!.headers, 'Col'],
                                rows: block.table!.rows.map((r) => [...r, '']),
                              },
                            })
                          }
                          className="text-xs px-2 text-blue-600"
                        >
                          + Col
                        </button>
                      </div>
                      {block.table.rows.map((row, ri) => (
                        <div key={ri} className="flex gap-2 items-center">
                          {row.map((cell, ci) => (
                            <input
                              key={ci}
                              value={cell}
                              onChange={(e) => {
                                const rows = block.table!.rows.map((r) => [...r])
                                rows[ri][ci] = e.target.value
                                updateBlock(block.id, { table: { ...block.table!, rows } })
                              }}
                              className="w-24 px-2 py-1 border border-slate-200 rounded text-xs"
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const rows = block.table!.rows.filter((_, i) => i !== ri)
                              updateBlock(block.id, { table: { ...block.table!, rows } })
                            }}
                            className="text-red-500 text-xs"
                          >
                            × row
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updateBlock(block.id, {
                            table: {
                              ...block.table!,
                              rows: [...block.table!.rows, block.table!.headers.map(() => '')],
                            },
                          })
                        }
                        className="text-xs text-blue-600"
                      >
                        + Row
                      </button>
                    </div>
                  )}

                  {block.type === 'chart' && block.chart && (
                    <div className="space-y-2">
                      <select
                        value={block.chart.type}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            chart: { ...block.chart!, type: e.target.value as ChartType },
                          })
                        }
                        className="px-2 py-1 border border-slate-200 rounded text-sm"
                      >
                        <option value="pie">Pie chart</option>
                        <option value="bar">Bar chart</option>
                        <option value="line">Line chart</option>
                      </select>
                      {(block.chart.labels ?? []).map((label, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            value={label}
                            onChange={(e) => {
                              const labels = [...block.chart!.labels]
                              labels[i] = e.target.value
                              updateBlock(block.id, { chart: { ...block.chart!, labels } })
                            }}
                            placeholder="Label"
                            className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                          <input
                            type="number"
                            value={block.chart!.values[i] ?? 0}
                            onChange={(e) => {
                              const values = [...block.chart!.values]
                              values[i] = Number(e.target.value) || 0
                              updateBlock(block.id, { chart: { ...block.chart!, values } })
                            }}
                            className="w-20 px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const labels = block.chart!.labels.filter((_, j) => j !== i)
                              const values = block.chart!.values.filter((_, j) => j !== i)
                              updateBlock(block.id, { chart: { ...block.chart!, labels, values } })
                            }}
                            className="text-red-500 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updateBlock(block.id, {
                            chart: {
                              ...block.chart!,
                              labels: [...block.chart!.labels, `Item ${block.chart!.labels.length + 1}`],
                              values: [...block.chart!.values, 10],
                            },
                          })
                        }
                        className="text-xs text-violet-600"
                      >
                        + Data point
                      </button>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase mb-2">Preview</p>
                    <ContentBlocksView blocks={[block]} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
