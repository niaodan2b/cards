import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

const hashtagHighlightKey = new PluginKey<DecorationSet>('hashtagHighlight')

function buildDecorations(doc: ProseMirrorNode): DecorationSet {
  const re = /(?:^|(?<=\s))#[\p{L}\p{N}_-]+/gu
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    re.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = re.exec(node.text)) !== null) {
      if (match[0].length === 0) break
      const from = pos + match.index
      decorations.push(Decoration.inline(from, from + match[0].length, { class: 'hashtag' }))
    }
  })
  return DecorationSet.create(doc, decorations)
}

export const HashtagHighlight = Extension.create({
  name: 'hashtagHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: hashtagHighlightKey,
        state: {
          init(_, { doc }) {
            return buildDecorations(doc)
          },
          apply(tr, old, _oldState, newState) {
            if (tr.docChanged) return buildDecorations(newState.doc)
            return old
          },
        },
        props: {
          decorations(state) {
            return hashtagHighlightKey.getState(state)
          },
        },
      }),
    ]
  },
})
