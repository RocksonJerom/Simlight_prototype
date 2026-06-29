import type { SimulationMeta } from '../../src/types/simulation.js'
import { getLlmCredentials } from '../config.js'
import { buildGenerationPrompt } from './prompt.js'
import { fetchWithTimeout, withRetry } from './fetch.js'

async function callOpenAiCompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  jsonMode: boolean,
  maxTokens = 4096
): Promise<string> {
  const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        {
          role: 'system',
          content:
            'You generate educational business simulations. Always respond with valid JSON only matching the requested schema. No markdown fences.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LLM API error (${res.status}): ${err}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM returned empty response')
  return content
}

async function callAnthropic(prompt: string, apiKey: string, model: string): Promise<string> {
  const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.7,
      system:
        'You generate educational business simulations. Respond with valid JSON only — no markdown fences or commentary.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API error (${res.status}): ${err}`)
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[]
  }
  const text = data.content?.find((c) => c.type === 'text')?.text
  if (!text) throw new Error('Anthropic returned empty response')
  return text
}

export async function callLlm(
  meta: SimulationMeta,
  provider: 'openai' | 'anthropic' | 'nvidia' | 'groq'
): Promise<string> {
  const prompt = buildGenerationPrompt(meta)
  return callLlmPrompt(prompt, provider)
}

export async function callLlmPrompt(
  prompt: string,
  provider: 'openai' | 'anthropic' | 'nvidia' | 'groq',
  opts?: { maxTokens?: number }
): Promise<string> {
  const maxTokens = opts?.maxTokens ?? 4096
  return withRetry(async () => {
    if (provider === 'anthropic') {
      const creds = getLlmCredentials('anthropic')
      if (!creds) throw new Error('Anthropic API key not configured')
      return callAnthropic(prompt, creds.apiKey, creds.model)
    }
    const creds = getLlmCredentials(provider)
    if (!creds) throw new Error(`${provider} API key not configured`)
    const jsonMode = provider === 'openai' || provider === 'groq'
    return callOpenAiCompatible(creds.baseUrl, creds.apiKey, creds.model, prompt, jsonMode, maxTokens)
  })
}
