import 'dotenv/config'
import { generateSimulationContent } from '../server/llm/generate.ts'

async function main() {
  console.log('Testing LLM generation…')
  const start = Date.now()
  const r = await generateSimulationContent({
    title: 'Business Analytics Test',
    domain: 'Business Strategy',
    industry: 'Retail',
    difficulty: 'Intermediate',
    duration: '30 Minutes',
    learningObjectives: ['Apply payoff matrices', 'Use EMV'],
  })
  console.log('Success in', Math.round((Date.now() - start) / 1000), 's')
  console.log('Source:', r.source, '| Events:', r.content.events.length, '| Fallback:', r.usedFallback)
}

main().catch((e) => {
  console.error('FAILED:', e instanceof Error ? e.message : e)
  process.exit(1)
})
