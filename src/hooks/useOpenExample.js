import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { exampleByKey } from '../lib/demo'

export function useOpenExample() {
  const { getProject, saveProject, toast } = useApp()
  const navigate = useNavigate()
  return (key = 'bedroom', { reset = false } = {}) => {
    const spec = exampleByKey[key]
    if (!spec) return
    const id = `example-${key}`
    if (reset || !getProject(id)) {
      const saved = saveProject(spec.build())
      if (!saved) { toast('Could not open the example because browser storage is full.', 'error'); return }
    }
    navigate(`/editor/${id}`)
  }
}
