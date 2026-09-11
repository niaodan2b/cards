import { Extension } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeSelection, TextSelection, type EditorState, type Transaction } from '@tiptap/pm/state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineOperations: {
      moveLineUp: () => ReturnType
      moveLineDown: () => ReturnType
      duplicateLineDown: () => ReturnType
      deleteLine: () => ReturnType
      insertLineBelow: () => ReturnType
      insertLineAbove: () => ReturnType
      goToLineStart: () => ReturnType
      goToLineEnd: () => ReturnType
      selectToLineStart: () => ReturnType
      selectToLineEnd: () => ReturnType
    }
  }
}

function getBlockRange(state: EditorState): { from: number; to: number } | null {
  const { selection } = state
  const { $from } = selection

  if (selection instanceof NodeSelection && selection.node.isBlock) {
    return { from: selection.from, to: selection.to }
  }

  if ($from.depth === 0) {
    if ($from.nodeAfter?.isBlock) {
      return { from: $from.pos, to: $from.pos + $from.nodeAfter.nodeSize }
    }
    return null
  }

  for (let depth = $from.depth; depth > 0; depth--) {
    if ($from.node(depth).type.name === 'listItem') {
      return { from: $from.before(depth), to: $from.after(depth) }
    }
  }

  return { from: $from.before(1), to: $from.after(1) }
}

function emptySibling(state: EditorState, node: ProseMirrorNode) {
  if (node.type.name === 'listItem') {
    const paragraph = state.schema.nodes.paragraph?.create()
    if (!paragraph) return null
    return node.type.create(node.attrs, paragraph)
  }
  return state.schema.nodes.paragraph?.create() ?? null
}

function selectInNode(tr: Transaction, pos: number) {
  const $pos = tr.doc.resolve(Math.min(pos + 1, tr.doc.content.size))
  tr.setSelection(TextSelection.near($pos))
  return tr.scrollIntoView()
}

function moveBlock(state: EditorState, direction: -1 | 1): Transaction | null {
  const range = getBlockRange(state)
  if (!range) return null
  const { from, to } = range
  const $block = state.doc.resolve(from)
  const index = $block.index()
  const parent = $block.parent
  const swapIndex = index + direction
  if (swapIndex < 0 || swapIndex >= parent.childCount) return null

  const node = parent.child(index)
  const tr = state.tr
  if (direction === 1) {
    const nextNode = parent.child(swapIndex)
    const insertAt = to + nextNode.nodeSize
    tr.delete(from, to)
    const mapped = insertAt - (to - from)
    tr.insert(mapped, node)
    return selectInNode(tr, mapped)
  }

  const prevNode = parent.child(swapIndex)
  const insertAt = from - prevNode.nodeSize
  tr.delete(from, to)
  tr.insert(insertAt, node)
  return selectInNode(tr, insertAt)
}

function duplicateBlock(state: EditorState): Transaction | null {
  const range = getBlockRange(state)
  if (!range) return null
  const node = state.doc.nodeAt(range.from)
  if (!node) return null
  const copy = node.copy(node.content)
  const tr = state.tr.insert(range.to, copy)
  return selectInNode(tr, range.to)
}

function deleteBlock(state: EditorState): Transaction | null {
  const range = getBlockRange(state)
  if (!range) return null
  const { from, to } = range
  const $block = state.doc.resolve(from)
  const parent = $block.parent
  const paragraph = state.schema.nodes.paragraph?.create()
  if (!paragraph) return null

  if (parent.childCount === 1) {
    if (parent.type.name === 'doc') {
      const tr = state.tr.replaceWith(from, to, paragraph)
      return selectInNode(tr, from)
    }
    const listFrom = $block.before()
    const listTo = $block.after($block.depth)
    const tr = state.tr.replaceWith(listFrom, listTo, paragraph)
    return selectInNode(tr, listFrom)
  }

  const tr = state.tr.delete(from, to)
  const pos = Math.min(from, tr.doc.content.size)
  tr.setSelection(TextSelection.near(tr.doc.resolve(pos)))
  return tr.scrollIntoView()
}

function setLineEdge(state: EditorState, side: 'start' | 'end', extend: boolean): Transaction | null {
  const { $head, anchor } = state.selection
  if (!$head.parent.isTextblock) return null
  const target = side === 'start' ? $head.start() : $head.end()
  const nextAnchor = extend ? anchor : target
  if (nextAnchor === $head.pos && target === $head.pos) return null
  const tr = state.tr.setSelection(TextSelection.create(state.doc, nextAnchor, target))
  return tr.scrollIntoView()
}

function insertBlock(state: EditorState, where: 'before' | 'after'): Transaction | null {
  const range = getBlockRange(state)
  if (!range) return null
  const node = state.doc.nodeAt(range.from)
  if (!node) return null
  const inserted = emptySibling(state, node)
  if (!inserted) return null
  const pos = where === 'before' ? range.from : range.to
  const tr = state.tr.insert(pos, inserted)
  return selectInNode(tr, pos)
}

export const LineOperations = Extension.create({
  name: 'lineOperations',

  addCommands() {
    return {
      moveLineUp:
        () =>
        ({ state, dispatch }) => {
          const tr = moveBlock(state, -1)
          if (!tr) return false
          dispatch?.(tr)
          return true
        },
      moveLineDown:
        () =>
        ({ state, dispatch }) => {
          const tr = moveBlock(state, 1)
          if (!tr) return false
          dispatch?.(tr)
          return true
        },
      duplicateLineDown:
        () =>
        ({ state, dispatch }) => {
          const tr = duplicateBlock(state)
          if (!tr) return false
          dispatch?.(tr)
          return true
        },
      deleteLine:
        () =>
        ({ state, dispatch }) => {
          const tr = deleteBlock(state)
          if (!tr) return false
          dispatch?.(tr)
          return true
        },
      insertLineBelow:
        () =>
        ({ state, dispatch }) => {
          const tr = insertBlock(state, 'after')
          if (!tr) return false
          dispatch?.(tr)
          return true
        },
      insertLineAbove:
        () =>
        ({ state, dispatch }) => {
          const tr = insertBlock(state, 'before')
          if (!tr) return false
          dispatch?.(tr)
          return true
        },
      goToLineStart:
        () =>
        ({ state, dispatch }) => {
          const tr = setLineEdge(state, 'start', false)
          if (!tr) return false
          dispatch?.(tr)
          return true
        },
      goToLineEnd:
        () =>
        ({ state, dispatch }) => {
          const tr = setLineEdge(state, 'end', false)
          if (!tr) return false
          dispatch?.(tr)
          return true
        },
      selectToLineStart:
        () =>
        ({ state, dispatch }) => {
          const tr = setLineEdge(state, 'start', true)
          if (!tr) return false
          dispatch?.(tr)
          return true
        },
      selectToLineEnd:
        () =>
        ({ state, dispatch }) => {
          const tr = setLineEdge(state, 'end', true)
          if (!tr) return false
          dispatch?.(tr)
          return true
        },
    }
  },
})
