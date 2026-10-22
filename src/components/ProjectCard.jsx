import { Link } from 'react-router-dom'
import { FiCopy, FiDownload, FiEdit2, FiTrash2 } from 'react-icons/fi'
import PlanPreview from './PlanPreview'
import { IconButton } from './ui'
import { fmtLen } from '../lib/units'

export default function ProjectCard({ project, onRename, onDuplicate, onDelete, onExport }) {
  const { room, furniture, unit } = project
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-line bg-paper">
      <Link to={`/editor/${project.id}`} className="block aspect-[4/3] bg-linen" aria-label={`Open ${project.name}`}>
        <PlanPreview room={room} furniture={furniture} unit={unit} className="h-full w-full p-2" label={`Plan of ${project.name}`} />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link to={`/editor/${project.id}`} className="text-lg font-medium leading-snug hover:text-sage-deep"><span className="font-display">{project.name}</span></Link>
        <p className="mt-1 text-xs text-ink-soft">
          {fmtLen(room.length, unit)} × {fmtLen(room.width, unit)} · {furniture.length} items · {project.layouts.length} layout{project.layouts.length === 1 ? '' : 's'}
        </p>
        <p className="text-xs text-ink-soft">Edited {new Date(project.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        <div className="-mb-1 -ml-2 mt-3 flex gap-0.5">
          <IconButton label={`Rename ${project.name}`} icon={FiEdit2} onClick={() => onRename(project)} />
          <IconButton label={`Duplicate ${project.name}`} icon={FiCopy} onClick={() => onDuplicate(project)} />
          <IconButton label={`Export ${project.name} as JSON`} icon={FiDownload} onClick={() => onExport(project)} />
          <IconButton label={`Delete ${project.name}`} icon={FiTrash2} className="ml-auto hover:!bg-brick-wash hover:text-brick" onClick={() => onDelete(project)} />
        </div>
      </div>
    </article>
  )
}
