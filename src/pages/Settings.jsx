import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Field, Input, Notice, Segmented, Toggle } from '../components/ui'
import { useApp } from '../context/AppContext'
import { UNITS, fromCm, toCm, parseNumber } from '../lib/units'

export default function Settings() {
  const { settings, setSettings } = useApp()
  const { unit } = settings
  const cmField = (key, label, hint, min, max) => (
    <Field label={`${label} (${UNITS[unit].label})`} hint={hint}>
      {(id) => (
        <Input
          id={id}
          type="number"
          step="any"
          key={`${key}-${unit}`}
          defaultValue={fromCm(settings[key], unit)}
          onBlur={(e) => {
            const v = toCm(parseNumber(e.target.value), unit)
            if (Number.isFinite(v)) setSettings({ [key]: Math.min(max, Math.max(min, v)) })
            e.target.value = fromCm(Math.min(max, Math.max(min, Number.isFinite(v) ? v : settings[key])), unit)
          }}
        />
      )}
    </Field>
  )
  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pt-10">
        <h1 className="text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">Stored in this browser. New projects start with these values.</p>

        <section className="mt-8">
          <h2 className="text-2xl">Measurements</h2>
          <div className="mt-4"><Segmented label="Measurement units" value={unit} onChange={(u) => setSettings({ unit: u })} options={Object.entries(UNITS).map(([v, u]) => ({ value: v, label: u.name }))} /></div>
          <p className="mt-2 text-xs text-ink-soft">Plans are stored in centimetres internally, so switching units never changes a room&apos;s real size.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl">Layout checks</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {cmField('minPassage', 'Minimum passage', 'Gaps narrower than this are flagged.', 10, 200)}
            {cmField('doorClearance', 'Door clearance', 'Space kept free in front of doors.', 30, 200)}
            {cmField('grid', 'Snap grid', 'Furniture snaps to this step.', 1, 50)}
          </div>
          <Notice className="mt-4">Changing these here does not affect existing projects. Each project has its own copy in the editor&apos;s Check tab.</Notice>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl">Saving</h2>
          <div className="mt-4"><Toggle checked={settings.autosave} onChange={(v) => setSettings({ autosave: v })} label="Save changes automatically while editing" /></div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
