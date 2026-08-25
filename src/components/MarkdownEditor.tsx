import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { KeywordHighlight } from '@/lib/keywordHighlight'
import { cn } from '@/lib/utils'

type MarkdownEditorProps = {
  content: string
  onChange: (markdown: string) => void
  editable?: boolean
  keyword?: string
  autoFocus?: boolean
}

const starterKit = StarterKit.configure({
  blockquote: false,
  code: false,
  codeBlock: false,
  horizontalRule: false,
  italic: false,
  link: false,
  orderedList: false,
  strike: false,
  trailingNode: false,
  underline: false,
  heading: { levels: [2, 3, 4] },
})

// 仅保留加粗 / 小标题(2-4级) / 无序列表，其余 StarterKit 扩展全部禁用
export function MarkdownEditor({
  content,
  onChange,
  editable = true,
  keyword = '',
  autoFocus = false,
}: MarkdownEditorProps) {
  const extensions = useRef([
    starterKit,
    Markdown,
    KeywordHighlight.configure({ keyword }),
  ]).current

  const editor = useEditor({
    autofocus: autoFocus ? 'end' : false,
    editable,
    extensions,
    content,
    contentType: 'markdown',
    onUpdate: ({ editor: instance }) => {
      if (!instance.isEditable) return
      onChange(instance.getMarkdown())
    },
  })

  useEffect(() => {
    if (!editor) return
    if (editor.isEditable !== editable) {
      editor.setEditable(editable)
    }
    if (editable && autoFocus) {
      editor.commands.focus('end')
    }
  }, [editor, editable, autoFocus])

  useEffect(() => {
    if (!editor || !editable) return
    const revealCaret = () => {
      editor.commands.scrollIntoView()
    }
    editor.on('focus', revealCaret)
    editor.on('selectionUpdate', revealCaret)
    const viewport = window.visualViewport
    viewport?.addEventListener('resize', revealCaret)
    return () => {
      editor.off('focus', revealCaret)
      editor.off('selectionUpdate', revealCaret)
      viewport?.removeEventListener('resize', revealCaret)
    }
  }, [editor, editable])

  useEffect(() => {
    if (!editor || editable) return
    if (editor.getMarkdown() === content) return
    editor.commands.setContent(content, { contentType: 'markdown', emitUpdate: false })
  }, [editor, editable, content])

  useEffect(() => {
    if (!editor) return
    editor.commands.setKeyword(keyword)
  }, [editor, keyword])

  if (!editable && !content.trim()) {
    return <p className="text-sm text-muted-foreground/60">暂无正文</p>
  }

  return (
    <EditorContent
      editor={editor}
      className={cn('markdown-body h-full text-sm leading-6 break-words', editable && 'is-editable')}
    />
  )
}
