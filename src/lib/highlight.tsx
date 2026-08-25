import { type ReactNode } from 'react'

export function highlightText(text: string, keyword: string): ReactNode {
  const q = keyword.trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(re)
  if (parts.length === 1) return text
  const qLower = q.toLowerCase()
  return parts.map((part, i) => (part.toLowerCase() === qLower ? <mark key={i}>{part}</mark> : part))
}

export function contentSnippet(content: string, keyword: string): string {
  const plain = content.replace(/[#*_`>[\]()!-]/g, '').replace(/\s+/g, ' ').trim()
  if (!plain) return ''
  const q = keyword.trim()
  if (!q) return plain.slice(0, 60)
  const idx = plain.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return plain.slice(0, 60)
  const start = Math.max(0, idx - 20)
  const end = Math.min(plain.length, idx + q.length + 40)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < plain.length ? '…' : ''
  return `${prefix}${plain.slice(start, end)}${suffix}`
}
