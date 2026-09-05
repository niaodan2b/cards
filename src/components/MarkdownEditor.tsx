import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { KeywordHighlight } from '@/lib/keywordHighlight'

type MarkdownEditorProps = {
  content: string
  onChange: (markdown: string) => void
  onBlur?: (markdown: string) => void
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
  onBlur,
  keyword = '',
  autoFocus = false,
}: MarkdownEditorProps) {
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)
  onChangeRef.current = onChange
  onBlurRef.current = onBlur

  const extensions = useRef([
    starterKit,
    Markdown,
    KeywordHighlight.configure({ keyword }),
  ]).current

  const editor = useEditor({
    autofocus: autoFocus ? 'end' : false,
    editable: true,
    extensions,
    content,
    contentType: 'markdown',
    onUpdate: ({ editor: instance }) => {
      onChangeRef.current(instance.getMarkdown())
    },
    onBlur: ({ editor: instance }) => {
      onBlurRef.current?.(instance.getMarkdown())
    },
  })

  useEffect(() => {
    if (!editor || !autoFocus) return
    editor.commands.focus('end')
  }, [editor, autoFocus])

  useEffect(() => {
    if (!editor) return
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
  }, [editor])

  useEffect(() => {
    if (!editor) return
    editor.commands.setKeyword(keyword)
  }, [editor, keyword])

  return (
    <EditorContent
      editor={editor}
      className="markdown-body is-editable h-full text-sm leading-6 break-words"
    />
  )
}
