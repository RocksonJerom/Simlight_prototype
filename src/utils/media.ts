import type { MediaAsset } from '../types/simulation'

export interface SceneMedia {
  type: 'image' | 'video'
  url: string
  name: string
}

/** Scene media for PiP in the animated world — video preferred, then image. */
export function getSceneMedia(assets: MediaAsset[]): SceneMedia | null {
  const video = assets.find((a) => a.type === 'video' && a.url)
  if (video?.url) return { type: 'video', url: video.url, name: video.name }

  const image = assets.find((a) => a.type === 'image' && a.url)
  if (image?.url) return { type: 'image', url: image.url, name: image.name }

  return null
}

export function getReferenceAssets(assets: MediaAsset[]) {
  return {
    images: assets.filter((a) => a.type === 'image' && a.url),
    videos: assets.filter((a) => a.type === 'video' && a.url),
    documents: assets.filter((a) => a.type === 'document' && a.url),
  }
}
