import type { Event, SimulationMeta } from '../../src/types/simulation.js'
import { resolveProvider, getLlmCredentials, config } from '../config.js'
import { fetchWithTimeout, withRetry } from './fetch.js'

export async function generateEventDecisions(
  meta: SimulationMeta,
  event: Event
): Promise<string[]> {
  const prompt = `Generate exactly 3 distinct decision options for this business simulation event.
Simulation: ${meta.title} (${meta.domain})
Event: ${event.title}
Description: ${event.description}
Return ONLY a JSON array of 3 strings, e.g. ["Option 1 text", "Option 2 text", "Option 3 text"]. No markdown.`

  const provider = resolveProvider()
  if (provider === 'mock') {
    if (config.llmProvider !== 'auto' && config.llmProvider !== 'mock') {
      throw new Error('LLM API key not configured')
    }
    return [
      `Proceed cautiously with ${event.title.toLowerCase()}`,
      `Take an aggressive approach to ${event.title.toLowerCase()}`,
      `Gather more data before deciding on ${event.title.toLowerCase()}`,
    ]
  }

  const raw = await withRetry(async () => {
    if (provider === 'anthropic') {
      const creds = getLlmCredentials('anthropic')
      if (!creds) throw new Error('Anthropic API key not configured')
      const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': creds.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: creds.model,
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) throw new Error(`Anthropic API error (${res.status}): ${await res.text()}`)
      const data = (await res.json()) as { content?: { text?: string }[] }
      return data.content?.[0]?.text ?? ''
    }

    const creds = getLlmCredentials(provider)
    if (!creds) throw new Error(`${provider} API key not configured`)
    const res = await fetchWithTimeout(`${creds.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: creds.model,
        temperature: 0.7,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`LLM API error (${res.status}): ${await res.text()}`)
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content ?? ''
  })

  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('Invalid AI response — expected JSON array')
  const parsed = JSON.parse(raw.slice(start, end + 1)) as string[]
  return parsed.filter((s) => typeof s === 'string' && s.trim()).slice(0, 4)
}
