import { createElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import { highlightNodes } from '@/lib/highlight'

const HIGHLIGHT_TAGS = ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'td', 'th', 'pre'] as const

function markdownComponents(keyword: string): Components | undefined {
  if (!keyword.trim()) return undefined
  return Object.fromEntries(
    HIGHLIGHT_TAGS.map((tag) => [
      tag,
      ({ children, node: _node, ...props }: { children?: ReactNode; node?: unknown }) =>
        createElement(tag, props, highlightNodes(children, keyword)),
    ]),
  ) as Components
}

export function MarkdownView({ content, keyword = '' }: { content: string; keyword?: string }) {
  if (!content.trim()) {
    return <p className="text-sm text-muted-foreground/60">暂无正文</p>
  }
  return (
    <div className="markdown-body text-sm leading-6 break-words">
      <ReactMarkdown components={markdownComponents(keyword)}>{content}</ReactMarkdown>
    </div>
  )
}
