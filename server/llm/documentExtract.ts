import { readFileSync } from 'fs'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

const MAX_CHARS = 80_000

function truncate(text: string): string {
  const trimmed = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (trimmed.length <= MAX_CHARS) return trimmed
  return `${trimmed.slice(0, MAX_CHARS)}\n\n[Document truncated for processing…]`
}

async function extractPdf(filePath: string): Promise<string> {
  const buffer = readFileSync(filePath)
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    return result.text ?? ''
  } finally {
    await parser.destroy()
  }
}

export async function extractTextFromDocument(
  filePath: string,
  mimetype: string,
  originalName: string
): Promise<string> {
  const ext = originalName.includes('.')
    ? originalName.slice(originalName.lastIndexOf('.') + 1).toLowerCase()
    : ''

  let text = ''

  if (
    mimetype === 'text/plain' ||
    mimetype === 'text/markdown' ||
    ext === 'txt' ||
    ext === 'md'
  ) {
    text = readFileSync(filePath, 'utf-8')
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/octet-stream' && ext === 'docx' ||
    ext === 'docx'
  ) {
    const result = await mammoth.extractRawText({ path: filePath })
    text = result.value
  } else if (
    mimetype === 'application/pdf' ||
    (mimetype === 'application/octet-stream' && ext === 'pdf') ||
    ext === 'pdf'
  ) {
    text = await extractPdf(filePath)
  } else {
    throw new Error(
      `Unsupported file type "${mimetype}" (${originalName}). Use .docx, .pdf, .txt, or .md`
    )
  }

  if (!text.trim()) {
    throw new Error('No readable text found in the document. Try exporting as .docx or .txt')
  }

  return truncate(text)
}
