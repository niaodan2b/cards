import ReactMarkdown from 'react-markdown'

export function MarkdownView({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-sm text-muted-foreground/60">暂无正文</p>
  }
  return (
    <div className="markdown-body text-sm leading-6 break-words">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
