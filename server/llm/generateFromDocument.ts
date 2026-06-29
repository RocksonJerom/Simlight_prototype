import type { SimulationMeta, GeneratedContent } from '../../src/types/simulation.js'
import type { AiGenerationSource } from '../config.js'
import { config, resolveProvider } from '../config.js'
import { generateMockContent } from '../aiGenerator.js'
import { callLlmPrompt } from './providers.js'
import { parseLlmResponseSafe } from './parser.js'
import { buildDocumentGenerationPrompt } from './documentPrompt.js'

export interface GenerationResult {
  content: GeneratedContent
  source: AiGenerationSource
  usedFallback: boolean
  error?: string
}

function isExplicitLlmProvider(): boolean {
  return config.llmProvider !== 'auto' && config.llmProvider !== 'mock'
}

export async function generateSimulationFromDocument(
  meta: SimulationMeta,
  documentText: string
): Promise<GenerationResult> {
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
    const prompt = buildDocumentGenerationPrompt(meta, documentText)
    const raw = await callLlmPrompt(prompt, provider, { maxTokens: 8192 })
    const content = parseLlmResponseSafe(raw)
    return { content, source: provider, usedFallback: false }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Document generation failed'
    if (isExplicitLlmProvider()) {
      throw new Error(message)
    }
    console.warn(`[LLM] ${provider} document import failed, falling back to mock:`, message)
    return {
      content: generateMockContent(meta),
      source: 'mock',
      usedFallback: true,
      error: message,
    }
  }
}
