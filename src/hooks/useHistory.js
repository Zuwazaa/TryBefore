import { useCallback, useState } from 'react'

const LIMIT = 100

// Undo/redo over a single document value (the room + furniture).
export function useHistory(initial) {
  const [state, setState] = useState({ past: [], present: initial, future: [] })

  const set = useCallback((next) => {
    setState((s) => {
      const value = typeof next === 'function' ? next(s.present) : next
      if (value === s.present) return s
      return { past: [...s.past.slice(-(LIMIT - 1)), s.present], present: value, future: [] }
    })
  }, [])

  // Update without creating an undo step (used while dragging).
  const replace = useCallback((next) => {
    setState((s) => {
      const value = typeof next === 'function' ? next(s.present) : next
      return value === s.present ? s : { ...s, present: value }
    })
  }, [])

  // Remember the current value as one undo step before a series of replace() calls.
  const checkpoint = useCallback(() => {
    setState((s) => ({ past: [...s.past.slice(-(LIMIT - 1)), s.present], present: s.present, future: [] }))
  }, [])

  const undo = useCallback(() => {
    setState((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s))
  }, [])

  const redo = useCallback(() => {
    setState((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s))
  }, [])

  const reset = useCallback((value) => setState({ past: [], present: value, future: [] }), [])

  return {
    doc: state.present,
    set,
    replace,
    checkpoint,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}
