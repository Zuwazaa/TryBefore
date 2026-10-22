import { useMemo } from 'react'
import { planSvg } from '../lib/planSvg'

export default function PlanPreview({ room, furniture, unit, issues, className = '', labels = false, dims = false, label = 'Floor plan preview' }) {
  const svg = useMemo(
    () => planSvg({ room, furniture, unit, issues, labels, dims, pad: dims ? 80 : 24 }),
    [room, furniture, unit, issues, labels, dims],
  )
  return <div role="img" aria-label={label} className={`[&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />
}
