import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCamera, FiEdit3, FiImage, FiPlus, FiTrash2, FiUploadCloud, FiRefreshCw, FiX } from 'react-icons/fi'
import { Button, Field, Input, Notice, Select, Segmented } from './ui'
import { useApp } from '../context/AppContext'
import { UNITS, fromCm, toCm, parseNumber, uid } from '../lib/units'
import { downscaleToDataUrl, validateImageFile } from '../lib/image'
import { blankProject } from '../lib/demo'

const ROOM_TYPES = ['Bedroom', 'Living room', 'Studio', 'Dining room', 'Home office', 'Kids room', 'Other']
const WALL_LABELS = { top: 'Top wall', right: 'Right wall', bottom: 'Bottom wall', left: 'Left wall' }
const SOURCES = [
  { id: 'upload', icon: FiImage, title: 'Upload a photograph', text: 'Use a photo of your room for visual ideas.' },
  { id: 'camera', icon: FiCamera, title: 'Use the camera', text: 'Take a photo now. Asks for permission first.' },
  { id: 'manual', icon: FiEdit3, title: 'Enter dimensions', text: 'Start from measurements only.' },
]

function UploadPane({ photo, setPhoto }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)

  const take = async (file) => {
    const problem = validateImageFile(file)
    if (problem) { setError(problem); return }
    setError('')
    setBusy(true)
    try { setPhoto(await downscaleToDataUrl(file)) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  if (photo) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-line">
        <img src={photo} alt="Your room" className="max-h-80 w-full object-cover" />
        <div className="absolute right-2 top-2 flex gap-2">
          <Button size="sm" icon={FiRefreshCw} onClick={() => inputRef.current?.click()}>Replace</Button>
          <Button size="sm" icon={FiX} onClick={() => setPhoto(null)}>Remove</Button>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Replace photo" onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} />
        {error && <Notice tone="error" className="m-2">{error}</Notice>}
      </div>
    )
  }
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]) }}
        className={`flex flex-col items-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${over ? 'border-sage bg-sage-wash' : 'border-line bg-paper'}`}
      >
        <FiUploadCloud aria-hidden size={28} className="text-sage" />
        <p className="mt-3 text-sm">{busy ? 'Preparing your photo…' : 'Drag a photo here, or'}</p>
        <Button className="mt-3" disabled={busy} onClick={() => inputRef.current?.click()}>Choose a photo</Button>
        <p className="mt-3 text-xs text-ink-soft">JPG, PNG or WebP, up to 15 MB. It is resized and stored only in this browser.</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose a photo" onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {error && <Notice tone="error" className="mt-2">{error}</Notice>}
    </div>
  )
}

function CameraPane({ photo, setPhoto }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [state, setState] = useState('idle') // idle | asking | live | error
  const [error, setError] = useState('')
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => stop, [stop])

  const start = async () => {
    setError('')
    setState('asking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      setState('live')
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}) } })
    } catch (e) {
      setState('error')
      setError(e.name === 'NotAllowedError' ? 'Camera access was blocked. Allow it in your browser settings and try again, or upload a photo instead.'
        : e.name === 'NotFoundError' ? 'No camera was found on this device. Upload a photo instead.'
        : 'The camera could not be started. Upload a photo instead.')
    }
  }

  const capture = async () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    canvas.getContext('2d').drawImage(v, 0, 0)
    stop()
    setState('idle')
    setPhoto(await downscaleToDataUrl(canvas.toDataURL('image/jpeg', 0.9)))
  }

  if (!supported) return <Notice tone="warn">This browser does not support camera capture. Choose “Upload a photograph” instead.</Notice>
  if (photo) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-line">
        <img src={photo} alt="Captured room" className="max-h-80 w-full object-cover" />
        <div className="absolute right-2 top-2 flex gap-2">
          <Button size="sm" icon={FiRefreshCw} onClick={() => { setPhoto(null); start() }}>Retake</Button>
          <Button size="sm" icon={FiX} onClick={() => setPhoto(null)}>Remove</Button>
        </div>
      </div>
    )
  }
  return (
    <div>
      {state === 'live' ? (
        <div className="overflow-hidden rounded-lg border border-line bg-ink">
          <video ref={videoRef} playsInline muted className="max-h-80 w-full object-cover" aria-label="Live camera preview" />
          <div className="flex justify-center gap-2 bg-paper p-3">
            <Button variant="primary" icon={FiCamera} onClick={capture}>Capture photo</Button>
            <Button onClick={() => { stop(); setState('idle') }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-lg border border-line bg-paper px-6 py-10 text-center">
          <FiCamera aria-hidden size={28} className="text-sage" />
          <p className="mt-3 max-w-sm text-sm text-ink-soft">Your browser will ask for permission when you start the camera. Nothing is recorded or uploaded.</p>
          <Button className="mt-4" variant="primary" disabled={state === 'asking'} onClick={start}>{state === 'asking' ? 'Waiting for permission…' : 'Start camera'}</Button>
        </div>
      )}
      {error && <Notice tone="error" className="mt-2">{error}</Notice>}
    </div>
  )
}

const toForm = (cm, unit) => String(fromCm(cm, unit))

export default function RoomCreationWizard() {
  const { settings, saveProject, toast } = useApp()
  const navigate = useNavigate()
  const [source, setSource] = useState('manual')
  const [photo, setPhoto] = useState(null)
  const [unit, setUnit] = useState(settings.unit)
  const [form, setForm] = useState({
    name: '', type: 'Bedroom', length: toForm(420, settings.unit), width: toForm(360, settings.unit), height: toForm(250, settings.unit), wallColor: '#e9e4d6',
  })
  const [openings, setOpenings] = useState([
    { id: uid('o'), kind: 'door', wall: 'bottom', offset: toForm(40, settings.unit), width: toForm(90, settings.unit) },
    { id: uid('o'), kind: 'window', wall: 'top', offset: toForm(130, settings.unit), width: toForm(160, settings.unit) },
  ])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const changeUnit = (next) => {
    const conv = (v) => { const n = parseNumber(v); return Number.isFinite(n) ? toForm(toCm(n, unit), next) : v }
    setForm((f) => ({ ...f, length: conv(f.length), width: conv(f.width), height: f.height === '' ? '' : conv(f.height) }))
    setOpenings((o) => o.map((x) => ({ ...x, offset: conv(x.offset), width: conv(x.width) })))
    setUnit(next)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setOp = (id, patch) => setOpenings((o) => o.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const validate = () => {
    const err = {}
    const L = toCm(parseNumber(form.length), unit)
    const W = toCm(parseNumber(form.width), unit)
    if (!Number.isFinite(L) || L < 100 || L > 3000) err.length = `Enter a length between ${fromCm(100, unit)} and ${fromCm(3000, unit)} ${UNITS[unit].label}.`
    if (!Number.isFinite(W) || W < 100 || W > 3000) err.width = `Enter a width between ${fromCm(100, unit)} and ${fromCm(3000, unit)} ${UNITS[unit].label}.`
    if (form.height !== '') {
      const H = toCm(parseNumber(form.height), unit)
      if (!Number.isFinite(H) || H < 150 || H > 600) err.height = `Ceiling height should be between ${fromCm(150, unit)} and ${fromCm(600, unit)} ${UNITS[unit].label}, or left empty.`
    }
    openings.forEach((o) => {
      const wallLen = o.wall === 'top' || o.wall === 'bottom' ? L : W
      const off = toCm(parseNumber(o.offset), unit)
      const wid = toCm(parseNumber(o.width), unit)
      if (!Number.isFinite(off) || !Number.isFinite(wid)) err[o.id] = 'Enter numbers for position and width.'
      else if (wid < 40) err[o.id] = `Width must be at least ${fromCm(40, unit)} ${UNITS[unit].label}.`
      else if (off < 0 || (Number.isFinite(wallLen) && off + wid > wallLen + 0.5)) err[o.id] = `It must fit on the ${o.wall} wall (${fromCm(wallLen, unit)} ${UNITS[unit].label} long).`
    })
    if ((source === 'upload' || source === 'camera') && !photo) err.photo = source === 'camera' ? 'Take a photo first, or switch to “Enter dimensions”.' : 'Add a photo first, or switch to “Enter dimensions”.'
    return err
  }

  const submit = (e) => {
    e.preventDefault()
    const err = validate()
    setErrors(err)
    if (Object.keys(err).length) { toast('Please fix the highlighted fields.', 'error'); return }
    setSaving(true)
    const L = toCm(parseNumber(form.length), unit)
    const W = toCm(parseNumber(form.width), unit)
    const project = blankProject({
      name: form.name.trim() || `${form.type} — ${fromCm(L, unit)} × ${fromCm(W, unit)} ${UNITS[unit].label}`,
      type: form.type,
      length: L,
      width: W,
      height: form.height === '' ? 250 : toCm(parseNumber(form.height), unit),
      wallColor: form.wallColor,
      unit,
      photo: source === 'manual' ? null : photo,
      rules: { minPassage: settings.minPassage, doorClearance: settings.doorClearance, grid: settings.grid },
      openings: openings.map((o) => ({ id: o.id, kind: o.kind, wall: o.wall, offset: toCm(parseNumber(o.offset), unit), width: toCm(parseNumber(o.width), unit) })),
    })
    const saved = saveProject(project)
    setSaving(false)
    if (saved) navigate(`/editor/${saved.id}`)
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-10">
      <section aria-labelledby="src">
        <h2 id="src" className="text-2xl">1. How do you want to start?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Starting point">
          {SOURCES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={source === s.id} onClick={() => setSource(s.id)}
              className={`cursor-pointer rounded-lg border p-4 text-left transition-colors ${source === s.id ? 'border-sage bg-sage-wash' : 'border-line bg-paper hover:border-sage/60'}`}>
              <s.icon aria-hidden size={22} className="text-sage-deep" />
              <p className="mt-3 font-medium">{s.title}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{s.text}</p>
            </button>
          ))}
        </div>
        <div className="mt-4">
          {source === 'upload' && <UploadPane photo={photo} setPhoto={setPhoto} />}
          {source === 'camera' && <CameraPane photo={photo} setPhoto={setPhoto} />}
          {source === 'manual' && <Notice>You can add a photo later in the editor&apos;s Photo tab. The plan only needs the measurements below.</Notice>}
          {errors.photo && <p role="alert" className="mt-2 text-sm text-brick">{errors.photo}</p>}
          {source !== 'manual' && <p className="mt-2 text-xs text-ink-soft">A photo can&apos;t give exact dimensions, so enter the real measurements below. The photo is used for visual ideas only.</p>}
        </div>
      </section>

      <section aria-labelledby="room">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="room" className="text-2xl">2. Describe the room</h2>
          <Segmented label="Units" value={unit} onChange={changeUnit} options={Object.entries(UNITS).map(([v, u]) => ({ value: v, label: u.name }))} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Room name" hint="Optional. We will name it from the size if you leave it empty.">{(id) => <Input id={id} value={form.name} maxLength={80} onChange={set('name')} placeholder="e.g. My bedroom" />}</Field>
          <Field label="Room type">{(id) => <Select id={id} value={form.type} onChange={set('type')}>{ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>}</Field>
          <Field label={`Length (${UNITS[unit].label})`} error={errors.length} hint="Left to right on the plan.">{(id) => <Input id={id} inputMode="decimal" value={form.length} onChange={set('length')} aria-invalid={!!errors.length} />}</Field>
          <Field label={`Width (${UNITS[unit].label})`} error={errors.width} hint="Top to bottom on the plan.">{(id) => <Input id={id} inputMode="decimal" value={form.width} onChange={set('width')} aria-invalid={!!errors.width} />}</Field>
          <Field label={`Ceiling height (${UNITS[unit].label}), optional`} error={errors.height}>{(id) => <Input id={id} inputMode="decimal" value={form.height} onChange={set('height')} aria-invalid={!!errors.height} />}</Field>
          <Field label="Wall colour">{(id) => (
            <div className="flex items-center gap-3">
              <input id={id} type="color" value={form.wallColor} onChange={set('wallColor')} className="h-10 w-14 cursor-pointer rounded border border-line bg-paper p-1" />
              <span className="text-sm text-ink-soft">{form.wallColor}</span>
            </div>
          )}</Field>
        </div>
      </section>

      <section aria-labelledby="open">
        <h2 id="open" className="text-2xl">3. Doors and windows</h2>
        <p className="mt-1 text-sm text-ink-soft">Position is the distance from the top-left corner along the chosen wall, to the start of the opening.</p>
        <ul className="mt-4 space-y-3">
          {openings.map((o, i) => (
            <li key={o.id} className="rounded-lg border border-line bg-paper p-3">
              <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                <Field label="Type">{(id) => <Select id={id} value={o.kind} onChange={(e) => setOp(o.id, { kind: e.target.value })}><option value="door">Door</option><option value="window">Window</option></Select>}</Field>
                <Field label="Wall">{(id) => <Select id={id} value={o.wall} onChange={(e) => setOp(o.id, { wall: e.target.value })}>{Object.entries(WALL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>}</Field>
                <Field label={`Position (${UNITS[unit].label})`}>{(id) => <Input id={id} inputMode="decimal" value={o.offset} onChange={(e) => setOp(o.id, { offset: e.target.value })} />}</Field>
                <Field label={`Width (${UNITS[unit].label})`}>{(id) => <Input id={id} inputMode="decimal" value={o.width} onChange={(e) => setOp(o.id, { width: e.target.value })} />}</Field>
                <Button aria-label={`Remove opening ${i + 1}`} icon={FiTrash2} onClick={() => setOpenings((l) => l.filter((x) => x.id !== o.id))} className="col-span-2 sm:col-span-1" />
              </div>
              {errors[o.id] && <p role="alert" className="mt-2 text-xs text-brick">{errors[o.id]}</p>}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <Button size="sm" icon={FiPlus} onClick={() => setOpenings((l) => [...l, { id: uid('o'), kind: 'door', wall: 'left', offset: toForm(100, unit), width: toForm(90, unit) }])}>Add door</Button>
          <Button size="sm" icon={FiPlus} onClick={() => setOpenings((l) => [...l, { id: uid('o'), kind: 'window', wall: 'right', offset: toForm(100, unit), width: toForm(120, unit) }])}>Add window</Button>
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-line pt-6">
        <Button type="submit" variant="primary" size="lg" disabled={saving}>Create room and open editor</Button>
      </div>
    </form>
  )
}
