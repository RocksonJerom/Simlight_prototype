const LLM_TIMEOUT_MS = 300_000 // 5 min — 70B full sim generation can take 2–3 min

export async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const msg = err instanceof Error ? err.message : String(err)
      const retryable =
        msg.includes('aborted') ||
        msg.includes('ECONNRESET') ||
        msg.includes('fetch failed') ||
        msg.includes('503') ||
        msg.includes('429')
      if (!retryable || i === attempts - 1) throw err
      console.warn(`[LLM] Attempt ${i + 1} failed (${msg}), retrying…`)
      await new Promise((r) => setTimeout(r, 3000))
    }
  }
  throw lastError
}
