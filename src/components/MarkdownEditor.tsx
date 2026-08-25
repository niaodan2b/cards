import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'

type MarkdownEditorProps = {
  initialContent: string
  onChange: (markdown: string) => void
  autoFocus?: boolean
}

// 仅保留加粗 / 小标题(2-4级) / 无序列表，其余 StarterKit 扩展全部禁用
export function MarkdownEditor({ initialContent, onChange, autoFocus = false }: MarkdownEditorProps) {
  const editor = useEditor({
    autofocus: autoFocus ? 'end' : false,
    extensions: [
      StarterKit.configure({
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
      }),
      Markdown,
    ],
    content: initialContent,
    contentType: 'markdown',
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getMarkdown())
    },
  })

  return (
    <EditorContent
      editor={editor}
      className="markdown-body h-full text-sm leading-6 break-words"
    />
  )
}
