import { useMemo } from 'react'
import { FiArrowRight, FiRotateCcw } from 'react-icons/fi'
import RoomScene from './RoomScene'
import PlanPreview from './PlanPreview'
import { Badge } from './ui'
import { fmtLen } from '../lib/units'
import { useOpenExample } from '../hooks/useOpenExample'
import { useApp } from '../context/AppContext'

const cache = new Map()
export function buildExample(ex) {
  if (!cache.has(ex.key)) cache.set(ex.key, ex.build())
  return cache.get(ex.key)
}

export default function ExampleCard({ ex, showPlan = false }) {
  const openExample = useOpenExample()
  const { getProject } = useApp()
  const project = useMemo(() => (showPlan ? buildExample(ex) : null), [ex, showPlan])
  const exists = !!getProject(`example-${ex.key}`)
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line bg-paper">
      <div className="relative aspect-[4/3] overflow-hidden bg-linen">
        {showPlan && project ? (
          <PlanPreview room={project.room} furniture={project.furniture} unit="m" labels className="h-full w-full p-3" label={`Floor plan of ${ex.title}`} />
        ) : (
          <RoomScene scene={ex.scene} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" label={`Illustration of ${ex.title}`} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-xl">{ex.title}</h3>
          <Badge tone="sage">{ex.style}</Badge>
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">{ex.blurb}</p>
        {showPlan && project && (
          <p className="mt-2 text-xs text-ink-soft">{fmtLen(project.room.length, 'm')} × {fmtLen(project.room.width, 'm')} · {project.furniture.length} items</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={() => openExample(ex.key)} className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-sage-deep hover:underline">
            Open in editor <FiArrowRight aria-hidden size={15} />
          </button>
          {exists && (
            <button type="button" onClick={() => openExample(ex.key, { reset: true })} className="ml-auto inline-flex cursor-pointer items-center gap-1 text-xs text-ink-soft hover:text-ink">
              <FiRotateCcw aria-hidden size={12} /> Start over
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
