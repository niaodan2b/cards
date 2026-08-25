import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

const keywordHighlightKey = new PluginKey<DecorationSet>('keywordHighlight')

function buildDecorations(doc: ProseMirrorNode, keyword: string): DecorationSet {
  const q = keyword.trim()
  if (!q) return DecorationSet.empty
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(escaped, 'gi')
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    re.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = re.exec(node.text)) !== null) {
      if (match[0].length === 0) break
      const from = pos + match.index
      decorations.push(Decoration.inline(from, from + match[0].length, { nodeName: 'mark' }))
    }
  })
  return DecorationSet.create(doc, decorations)
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    keywordHighlight: {
      setKeyword: (keyword: string) => ReturnType
    }
  }
}

export const KeywordHighlight = Extension.create({
  name: 'keywordHighlight',

  addOptions() {
    return { keyword: '' }
  },

  addStorage() {
    return { keyword: this.options.keyword as string }
  },

  addCommands() {
    return {
      setKeyword:
        (keyword: string) =>
        ({ tr, dispatch }) => {
          this.storage.keyword = keyword
          dispatch?.(tr.setMeta(keywordHighlightKey, keyword))
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const extension = this
    return [
      new Plugin({
        key: keywordHighlightKey,
        state: {
          init(_, { doc }) {
            return buildDecorations(doc, extension.storage.keyword)
          },
          apply(tr, old, _oldState, newState) {
            const meta = tr.getMeta(keywordHighlightKey)
            if (typeof meta === 'string' || tr.docChanged) {
              const keyword = typeof meta === 'string' ? meta : extension.storage.keyword
              return buildDecorations(newState.doc, keyword)
            }
            return old
          },
        },
        props: {
          decorations(state) {
            return keywordHighlightKey.getState(state)
          },
        },
      }),
    ]
  },
})
