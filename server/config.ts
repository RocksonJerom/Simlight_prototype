import 'dotenv/config'

export type LlmProvider = 'openai' | 'anthropic' | 'nvidia' | 'groq' | 'mock'
export type AiGenerationSource = LlmProvider

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
  nvidiaApiKey: process.env.NVIDIA_API_KEY ?? '',
  nvidiaModel: process.env.NVIDIA_MODEL ?? 'meta/llama-3.3-70b-instruct',
  nvidiaBaseUrl: process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1',
  groqApiKey: process.env.GROQ_API_KEY ?? '',
  groqModel: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
  groqBaseUrl: process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1',
  llmProvider: (process.env.LLM_PROVIDER ?? 'auto') as 'auto' | LlmProvider,
  jwtSecret: process.env.JWT_SECRET ?? 'simlight-dev-secret-change-in-production',
  databaseUrl: process.env.DATABASE_URL ?? '',
}

export function getDatabaseKind(): 'postgres' | 'sqlite' {
  return config.databaseUrl ? 'postgres' : 'sqlite'
}

export function getLlmCredentials(provider: LlmProvider): {
  apiKey: string
  baseUrl: string
  model: string
} | null {
  if (provider === 'groq' && config.groqApiKey) {
    return { apiKey: config.groqApiKey, baseUrl: config.groqBaseUrl, model: config.groqModel }
  }
  if (provider === 'nvidia' && config.nvidiaApiKey) {
    return { apiKey: config.nvidiaApiKey, baseUrl: config.nvidiaBaseUrl, model: config.nvidiaModel }
  }
  if (provider === 'openai' && config.openaiApiKey) {
    return { apiKey: config.openaiApiKey, baseUrl: 'https://api.openai.com/v1', model: config.openaiModel }
  }
  if (provider === 'anthropic' && config.anthropicApiKey) {
    return { apiKey: config.anthropicApiKey, baseUrl: 'https://api.anthropic.com/v1', model: config.anthropicModel }
  }
  return null
}

export function resolveProvider(): LlmProvider {
  const { llmProvider, openaiApiKey, anthropicApiKey, nvidiaApiKey, groqApiKey } = config
  if (llmProvider === 'mock') return 'mock'
  if (llmProvider === 'openai') return openaiApiKey ? 'openai' : 'mock'
  if (llmProvider === 'anthropic') return anthropicApiKey ? 'anthropic' : 'mock'
  if (llmProvider === 'nvidia') return nvidiaApiKey ? 'nvidia' : 'mock'
  if (llmProvider === 'groq') return groqApiKey ? 'groq' : 'mock'
  if (groqApiKey) return 'groq'
  if (nvidiaApiKey) return 'nvidia'
  if (openaiApiKey) return 'openai'
  if (anthropicApiKey) return 'anthropic'
  return 'mock'
}

export function getAiStatus() {
  const activeProvider = resolveProvider()
  const creds = getLlmCredentials(activeProvider)
  const model = creds?.model ?? null
  return {
    provider: activeProvider,
    configured: activeProvider !== 'mock',
    openai: Boolean(config.openaiApiKey),
    anthropic: Boolean(config.anthropicApiKey),
    nvidia: Boolean(config.nvidiaApiKey),
    groq: Boolean(config.groqApiKey),
    model,
    message:
      activeProvider === 'mock'
        ? 'No API key configured — using demo mock generator. Set GROQ_API_KEY, NVIDIA_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in .env'
        : `Using ${activeProvider} (${model})`,
  }
}
