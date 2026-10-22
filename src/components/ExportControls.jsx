import { useMemo, useState } from 'react'
import { FiDownload, FiFileText, FiImage } from 'react-icons/fi'
import { Button, Modal, Notice } from './ui'
import PlanPreview from './PlanPreview'
import { planSvg, svgToPngDataUrl } from '../lib/planSvg'
import { exportProjectJSON } from '../lib/storage'
import { downloadDataUrl, downloadText, slug } from '../lib/image'
import { fmtLen } from '../lib/units'

export default function ExportControls({ open, onClose, project, toast }) {
  const [busy, setBusy] = useState(false)
  const svg = useMemo(
    () => open ? planSvg({
      room: project.room, furniture: project.furniture, unit: project.unit,
      title: project.name, subtitle: `${project.room.type} · ${fmtLen(project.room.length, project.unit)} × ${fmtLen(project.room.width, project.unit)}`,
      labels: true, dims: true, grid: true, legend: true,
    }) : '',
    [open, project],
  )
  const png = async () => {
    setBusy(true)
    try { downloadDataUrl(await svgToPngDataUrl(svg, 2000), `${slug(project.name)}-plan.png`); toast('Plan image downloaded.', 'success') }
    catch (e) { toast(e.message || 'Could not create the image.', 'error') }
    finally { setBusy(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Export" wide>
      <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
        <div className="rounded-md border border-line bg-paper p-1">
          <PlanPreview room={project.room} furniture={project.furniture} unit={project.unit} labels dims className="aspect-[4/3] w-full" label="Plan export preview" />
        </div>
        <div className="space-y-3">
          <Button variant="primary" className="w-full" icon={FiImage} disabled={busy} onClick={png}>{busy ? 'Creating image…' : 'Download plan image (PNG)'}</Button>
          <Button className="w-full" icon={FiFileText} onClick={() => { downloadText(svg, `${slug(project.name)}-plan.svg`, 'image/svg+xml'); toast('Plan SVG downloaded.', 'success') }}>Download plan as SVG</Button>
          <Button className="w-full" icon={FiDownload} onClick={() => { downloadText(exportProjectJSON(project), `${slug(project.name)}.trybefore.json`); toast('Project file downloaded.', 'success') }}>Download project data (JSON)</Button>
          <Notice>The plan image shows your room to scale with dimensions, furniture and doors. It is meant for sharing with family or an interior designer. Import the JSON on the My projects page to restore everything.</Notice>
        </div>
      </div>
    </Modal>
  )
}
