import { useEffect, useRef, useState } from 'react'
import { FiImage, FiLoader, FiRefreshCw, FiSave, FiTrash2, FiX } from 'react-icons/fi'
import { Badge, Button, Field, IconButton, Notice } from './ui'
import BeforeAfterSlider from './BeforeAfterSlider'
import RoomScene from './RoomScene'
import { getServiceStatus, requestVisualization } from '../lib/aiClient'
import { downscaleToDataUrl, validateImageFile } from '../lib/image'
import { uid } from '../lib/units'

export const SAMPLES = [
  { id: 'wall', label: 'Sage wall colour', prompt: 'Paint the walls a soft sage green.', after: 'sage' },
  { id: 'style', label: 'Japandi style', prompt: 'Restyle the room as Japandi.', after: 'japandi' },
  { id: 'furniture', label: 'Alternative furniture', prompt: 'Replace the sofa and add a wooden coffee table.', after: 'furniture' },
  { id: 'decor', label: 'Rug, lamp, plant and art', prompt: 'Add a rug, a floor lamp, a plant and wall art.', after: 'decor' },
  { id: 'spacious', label: 'More spacious look', prompt: 'Make the room feel lighter and more spacious.', after: 'minimal' },
]
const PRESETS = ['Paint the walls a warm white.', 'Make it a Scandinavian style room.', 'Replace the sofa with a light green one.', 'Add plants and soft lighting.', 'Make the room look more spacious.']

function Saved({ items, photo, onView, onDelete }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="saved-viz">
      <h3 id="saved-viz" className="mb-2 text-lg">Saved visualisations</h3>
      <ul className="grid grid-cols-2 gap-2">
        {items.map((v) => (
          <li key={v.id} className="overflow-hidden rounded-md border border-line bg-paper">
            <button type="button" onClick={() => onView(v)} className="block aspect-[4/3] w-full cursor-pointer overflow-hidden bg-linen" aria-label={`View ${v.label || 'visualisation'}`}>
              {v.kind === 'generated' && v.image ? <img src={v.image} alt="" className="h-full w-full object-cover" /> : <RoomScene scene={SAMPLES.find((s) => s.id === v.sampleId)?.after || 'scandi'} className="h-full w-full" label="" />}
            </button>
            <div className="flex items-center gap-1 p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{v.label || v.prompt}</p>
                <Badge tone={v.kind === 'generated' ? 'sage' : 'ochre'}>{v.kind === 'generated' ? 'From your photo' : 'Sample'}</Badge>
              </div>
              <IconButton label="Delete visualisation" icon={FiTrash2} onClick={() => onDelete(v.id)} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function VisualizationPanel({ photo, onPhoto, visualizations, onSave, onDelete, toast }) {
  const [status, setStatus] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(null) // {image, prompt}
  const [sample, setSample] = useState(null)
  const [viewing, setViewing] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => { getServiceStatus().then(setStatus) }, [])
  useEffect(() => {
    if (!busy) return undefined
    setElapsed(0)
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [busy])

  const imageReady = !!status?.image

  const upload = async (file) => {
    const problem = validateImageFile(file)
    if (problem) { setError(problem); return }
    setError('')
    try { onPhoto(await downscaleToDataUrl(file)); setGenerated(null) } catch (e) { setError(e.message) }
  }

  const generate = async () => {
    if (!prompt.trim()) { setError('Describe the change you want to see first.'); return }
    setBusy(true); setError(''); setGenerated(null); setSample(null); setViewing(null)
    try {
      const data = await requestVisualization({ image: photo, prompt: prompt.trim() })
      if (typeof data.image !== 'string' || !data.image.startsWith('data:image/')) throw new Error('The image service did not return a picture.')
      setGenerated({ image: await downscaleToDataUrl(data.image, 1024), prompt: prompt.trim() })
    } catch (e) {
      setError(e.message || 'The picture could not be generated.')
    } finally {
      setBusy(false)
    }
  }

  const shown = viewing || (generated ? { kind: 'generated', ...generated } : sample ? { kind: 'sample', ...sample } : null)

  return (
    <div className="space-y-5">
      <Notice>Visualisations show a possible look only. They have no real-world dimensions and never change your 2D plan. Use the plan to check what fits.</Notice>

      <section aria-labelledby="orig">
        <h3 id="orig" className="mb-2 text-lg">Your photo</h3>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose a room photo" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }} />
        {photo ? (
          <div className="overflow-hidden rounded-md border border-line">
            <img src={photo} alt="Original room photo" className="max-h-52 w-full object-cover" />
            <div className="flex gap-2 bg-paper p-2">
              <Button size="sm" icon={FiRefreshCw} onClick={() => fileRef.current?.click()}>Replace</Button>
              <Button size="sm" icon={FiX} onClick={() => { onPhoto(null); setGenerated(null) }}>Remove</Button>
              <span className="ml-auto self-center text-xs text-ink-soft">Original is never changed</span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line p-6 text-center">
            <FiImage aria-hidden size={24} className="mx-auto text-sage" />
            <p className="mt-2 text-sm text-ink-soft">No photo yet. Add one to describe changes to your own room.</p>
            <Button className="mt-3" onClick={() => fileRef.current?.click()}>Add a photo</Button>
          </div>
        )}
      </section>

      <section aria-labelledby="gen">
        <h3 id="gen" className="mb-2 text-lg">Try a change</h3>
        <Field label="What should change?">
          {(id) => <textarea id={id} rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="For example: paint the walls sage green and add a plant." className="w-full rounded-md border border-line bg-paper p-3 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25" />}
        </Field>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => <button key={p} type="button" onClick={() => setPrompt(p)} className="cursor-pointer rounded-full border border-line bg-paper px-2.5 py-1 text-xs hover:border-sage">{p}</button>)}
        </div>

        {imageReady ? (
          <Button className="mt-3" variant="primary" icon={busy ? FiLoader : FiImage} disabled={busy || !photo} onClick={generate}>{busy ? 'Generating…' : 'Generate from my photo'}</Button>
        ) : (
          <Notice tone="warn" className="mt-3">
            {status === null ? 'Checking for an image service…' : 'No image-editing service is connected, so your photo cannot be transformed here. Demo mode below shows prepared sample illustrations, which are not made from your photo.'}
          </Notice>
        )}
        {busy && (
          <div className="mt-3" role="status" aria-live="polite">
            <div className="h-1.5 overflow-hidden rounded bg-linen"><div className="h-full w-1/3 animate-[slide_1.4s_ease-in-out_infinite] rounded bg-sage" style={{ animationName: 'slide' }} /></div>
            <p className="mt-1 text-xs text-ink-soft">Working on your picture… {elapsed}s. This can take up to a minute.</p>
          </div>
        )}
        {error && <Notice tone="error" className="mt-3">{error}</Notice>}
      </section>

      {!imageReady && (
        <section aria-labelledby="demo">
          <h3 id="demo" className="mb-2 text-lg">Demo mode: sample transformations</h3>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLES.map((s) => (
              <button key={s.id} type="button" aria-pressed={sample?.sampleId === s.id} onClick={() => { setSample({ sampleId: s.id, label: s.label, prompt: s.prompt, after: s.after }); setViewing(null); setGenerated(null) }}
                className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs ${sample?.sampleId === s.id ? 'border-sage-deep bg-sage-deep text-ivory' : 'border-line bg-paper hover:border-sage'}`}>{s.label}</button>
            ))}
          </div>
        </section>
      )}

      {shown && (
        <section aria-labelledby="result" className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 id="result" className="text-lg">Before and after</h3>
            <Badge tone={shown.kind === 'generated' ? 'sage' : 'ochre'}>{shown.kind === 'generated' ? 'Generated from your photo' : 'Sample illustration'}</Badge>
          </div>
          {shown.kind === 'generated' ? (
            <>
              <BeforeAfterSlider className="aspect-[4/3]" before={<img src={photo || shown.original} alt="Original photo" className="h-full w-full object-cover" />} after={<img src={shown.image} alt="Generated visualisation" className="h-full w-full object-cover" />} />
              {!viewing && <div className="grid grid-cols-2 gap-2"><img src={photo} alt="Original" className="rounded border border-line" /><img src={shown.image} alt="Generated" className="rounded border border-line" /></div>}
            </>
          ) : (
            <>
              <BeforeAfterSlider className="aspect-[4/3]" before={<RoomScene scene="before" className="h-full w-full" label="Sample room before" />} after={<RoomScene scene={shown.after || SAMPLES.find((s) => s.id === shown.sampleId)?.after || 'scandi'} className="h-full w-full" label="Sample room after" />} />
              <p className="text-xs text-ink-soft">“{shown.prompt}” — this is a prepared sample of a different room, not your photo.</p>
            </>
          )}
          {!viewing && (
            <Button icon={FiSave} onClick={() => {
              onSave(shown.kind === 'generated'
                ? { id: uid('v'), kind: 'generated', prompt: shown.prompt, label: shown.prompt.slice(0, 40), image: shown.image, sampleId: null, createdAt: Date.now() }
                : { id: uid('v'), kind: 'sample', prompt: shown.prompt, label: shown.label, image: null, sampleId: shown.sampleId, createdAt: Date.now() })
              toast('Visualisation saved to this project.', 'success')
            }}>Save visualisation</Button>
          )}
          {viewing && <Button size="sm" onClick={() => setViewing(null)}>Close preview</Button>}
        </section>
      )}

      <Saved items={visualizations} photo={photo} onView={(v) => { setViewing(v); setGenerated(null); setSample(null) }} onDelete={onDelete} />
    </div>
  )
}
