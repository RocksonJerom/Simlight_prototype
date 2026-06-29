import multer from 'multer'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { UPLOADS_DIR } from './database.js'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = file.originalname.includes('.')
      ? file.originalname.slice(file.originalname.lastIndexOf('.'))
      : ''
    cb(null, `${randomUUID()}${ext}`)
  },
})

const ALLOWED = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
  ],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
}

export function assetTypeFromMime(mime: string): 'image' | 'document' | 'video' | null {
  if (ALLOWED.image.includes(mime)) return 'image'
  if (ALLOWED.document.includes(mime)) return 'document'
  if (ALLOWED.video.includes(mime)) return 'video'
  return null
}

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const type = assetTypeFromMime(file.mimetype)
    if (!type) {
      cb(new Error('Unsupported file type'))
      return
    }
    cb(null, true)
  },
})

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function publicUploadUrl(filename: string): string {
  return `/uploads/${filename}`
}

export function uploadFilePath(filename: string): string {
  return join(UPLOADS_DIR, filename)
}

const SOURCE_DOC_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'application/octet-stream',
]

export const sourceDocumentUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.includes('.')
      ? file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase()
      : ''
    const allowedExt = ['.pdf', '.docx', '.txt', '.md']
    const okMime = SOURCE_DOC_MIMES.includes(file.mimetype)
    const okExt = allowedExt.includes(ext)
    if (okMime && (okExt || file.mimetype !== 'application/octet-stream')) {
      cb(null, true)
      return
    }
    if (file.mimetype === 'application/octet-stream' && okExt) {
      cb(null, true)
      return
    }
    cb(new Error('Unsupported document type. Use .docx, .pdf, .txt, or .md'))
  },
})
