import type { SimulationMeta, GeneratedContent } from '../../src/types/simulation.js'
import type { AiGenerationSource } from '../config.js'
import { config, resolveProvider } from '../config.js'
import { generateMockContent } from '../aiGenerator.js'
import { callLlm } from './providers.js'
import { parseLlmResponseSafe } from './parser.js'

export interface GenerationResult {
  content: GeneratedContent
  source: AiGenerationSource
  usedFallback: boolean
  error?: string
}

function isExplicitLlmProvider(): boolean {
  return config.llmProvider !== 'auto' && config.llmProvider !== 'mock'
}

export async function generateSimulationContent(meta: SimulationMeta): Promise<GenerationResult> {
  const provider = resolveProvider()

  if (provider === 'mock') {
    if (isExplicitLlmProvider()) {
      throw new Error(
        `LLM_PROVIDER=${config.llmProvider} but no valid API key found. Check GROQ_API_KEY (or other provider key) in .env and restart the server.`
      )
    }
    return {
      content: generateMockContent(meta),
      source: 'mock',
      usedFallback: false,
    }
  }

  try {
    const raw = await callLlm(meta, provider)
    const content = parseLlmResponseSafe(raw)
    return { content, source: provider, usedFallback: false }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'LLM generation failed'
    if (isExplicitLlmProvider()) {
      throw new Error(message)
    }
    console.warn(`[LLM] ${provider} failed, falling back to mock:`, message)
    return {
      content: generateMockContent(meta),
      source: 'mock',
      usedFallback: true,
      error: message,
    }
  }
}
