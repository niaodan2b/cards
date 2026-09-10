import type { Editor } from '@tiptap/react'

let activeEditor: Editor | null = null

export function registerActiveEditor(editor: Editor | null) {
  activeEditor = editor
}

export function getActiveEditor() {
  return activeEditor
}
