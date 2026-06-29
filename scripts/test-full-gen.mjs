import 'dotenv/config'
import { buildGenerationPrompt } from '../server/llm/prompt.js'
import { parseLlmResponseSafe } from '../server/llm/parser.js'
import { config } from '../server/config.js'

const meta = {
  title: 'Test Simulation',
  domain: 'Business Strategy',
  industry: 'Retail',
  difficulty: 'Intermediate',
  duration: '30 Minutes',
  learningObjectives: ['Make decisions', 'Analyze risk'],
}

const prompt = buildGenerationPrompt(meta)
console.log('Provider:', config.llmProvider, 'Model:', config.nvidiaModel)
console.log('Prompt chars:', prompt.length)

const start = Date.now()
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 180_000)

try {
  const res = await fetch(`${config.nvidiaBaseUrl}/chat/completions`, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${config.nvidiaApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.nvidiaModel,
      temperature: 0.7,
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content:
            'You generate educational business simulations. Always respond with valid JSON matching the requested schema.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  })
  clearTimeout(timer)
  console.log('HTTP', res.status, 'ms:', Date.now() - start)
  if (!res.ok) {
    console.log('Error body:', await res.text())
    process.exit(1)
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const raw = data.choices?.[0]?.message?.content ?? ''
  console.log('Raw length:', raw.length)
  const parsed = parseLlmResponseSafe(raw)
  console.log('Parsed OK:', parsed.phases.length, 'phases', parsed.events.length, 'events')
} catch (e) {
  clearTimeout(timer)
  console.log('FAILED after ms:', Date.now() - start)
  console.log('Error:', e instanceof Error ? e.message : e)
  process.exit(1)
}
