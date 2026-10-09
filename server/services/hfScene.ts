import { writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { InferenceClient } from '@huggingface/inference'
import { config } from '../config.js'
import { UPLOADS_DIR } from '../database.js'
import type { SimulationMeta } from '../../src/types/simulation.js'
import type { MediaAsset } from '../../src/types/simulation.js'

function buildScenePrompt(meta: SimulationMeta, customPrompt?: string): string {
  if (customPrompt?.trim()) return customPrompt.trim()
  return [
    `Cinematic business simulation scene for ${meta.industry} industry`,
    `Theme: ${meta.domain}`,
    `Simulation: ${meta.title}`,
    'isometric corporate environment, supply chain activity, professional training game aesthetic',
    'smooth camera motion, vibrant lighting, wide 16:9 framing',
    'no text, no watermark, no logos',
  ].join(', ')
}

function extensionForMime(mime: string): { ext: string; mimetype: string } {
  if (mime.includes('webm')) return { ext: 'webm', mimetype: 'video/webm' }
  if (mime.includes('quicktime')) return { ext: 'mov', mimetype: 'video/quicktime' }
  return { ext: 'mp4', mimetype: 'video/mp4' }
}

export async function generateSceneVideoWithHf(
  meta: SimulationMeta,
  customPrompt?: string
): Promise<{
  path: string
  originalname: string
  size: number
  mimetype: string
  prompt: string
  assetType: MediaAsset['type']
}> {
  const token = config.hfToken
  if (!token) throw new Error('HF_TOKEN is not set in .env')

  const prompt = buildScenePrompt(meta, customPrompt)
  const client = new InferenceClient(token)

  const video = await client.textToVideo({
    model: config.hfVideoModel,
    inputs: prompt,
    provider: config.hfVideoProvider,
  })

  const buffer = Buffer.from(await video.arrayBuffer())
  const { ext, mimetype } = extensionForMime(video.type || 'video/mp4')
  const filename = `${randomUUID()}.${ext}`
  const path = join(UPLOADS_DIR, filename)
  writeFileSync(path, buffer)

  return {
    path,
    originalname: `AI scene video — ${meta.title}.${ext}`,
    size: buffer.length,
    mimetype,
    prompt,
    assetType: 'video',
  }
}

export function isHfSceneConfigured(): boolean {
  return Boolean(config.hfToken)
}
