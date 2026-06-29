import 'dotenv/config'

const key = process.env.NVIDIA_API_KEY
const model = process.env.NVIDIA_MODEL ?? 'meta/llama-3.3-70b-instruct'
const url = `${process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'}/chat/completions`

console.log('Key set:', Boolean(key), '| length:', key?.length ?? 0)
console.log('Model:', model)

const start = Date.now()
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 120_000)

try {
  const res = await fetch(url, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Say hello in one word.' }],
    }),
  })
  clearTimeout(timer)
  console.log('Status:', res.status, '| ms:', Date.now() - start)
  const text = await res.text()
  console.log('Response:', text.slice(0, 400))
} catch (e) {
  clearTimeout(timer)
  console.log('Failed after ms:', Date.now() - start)
  console.log('Error:', e instanceof Error ? e.message : e)
}
