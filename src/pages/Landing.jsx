import { Link } from 'react-router-dom'
import { FiGrid, FiMove, FiMaximize2, FiCpu, FiDollarSign, FiColumns, FiUpload, FiSliders, FiBookmark } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LandingHero from '../components/LandingHero'
import BeforeAfterSlider from '../components/BeforeAfterSlider'
import RoomScene from '../components/RoomScene'
import ExampleCard from '../components/ExampleCard'
import { EXAMPLES } from '../lib/demo'

const STEPS = [
  { icon: FiUpload, title: 'Upload a photo or create a room', text: 'Add a picture of your room, or just type in its length and width. Doors and windows go in too.' },
  { icon: FiSliders, title: 'Experiment with furniture and design ideas', text: 'Drag furniture around the plan. TryBefore flags overlaps, blocked doors and tight walkways as you go.' },
  { icon: FiBookmark, title: 'Compare your options and save your perfect layout', text: 'Keep several layouts, compare them side by side and export a plan to share.' },
]

const FEATURES = [
  { icon: FiGrid, title: 'Interactive room planner', text: 'A scaled 2D plan with a grid, zoom, snapping and undo.' },
  { icon: FiMove, title: 'Furniture placement', text: 'Move, rotate and resize 16 furniture types, or type exact dimensions.' },
  { icon: FiMaximize2, title: 'Room measurements', text: 'Floor area, open space and clearances are calculated from your layout.' },
  { icon: FiCpu, title: 'AI-assisted interior concepts', text: 'Describe your goals and get layout and style suggestions. Rule-based by default, AI when a backend is connected.' },
  { icon: FiDollarSign, title: 'Budget-conscious redesign', text: 'Mark what you own, enter your own estimates and see what a redesign would cost.' },
  { icon: FiColumns, title: 'Before-and-after comparisons', text: 'Switch between saved layouts or compare two side by side.' },
]

export default function Landing() {
  const showcase = EXAMPLES.filter((e) => e.key !== 'bedroom')
  return (
    <div className="min-h-full">
      <Navbar />
      <main>
        <LandingHero />

        <section className="mx-auto max-w-6xl px-5 pt-24" aria-labelledby="how">
          <h2 id="how" className="max-w-xl text-4xl">How it works</h2>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="bg-paper p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-wash font-display text-lg text-sage-deep">{i + 1}</span>
                  <s.icon aria-hidden className="text-sage" size={20} />
                </div>
                <h3 className="text-xl leading-snug">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto mt-24 grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-[1.2fr_0.8fr]" aria-labelledby="compare">
          <div>
            <BeforeAfterSlider
              className="aspect-[16/10] shadow-panel"
              initial={35}
              beforeLabel="Today"
              afterLabel="Japandi idea"
              before={<RoomScene scene="before" className="h-full w-full" label="Room as it is today" />}
              after={<RoomScene scene="japandi" className="h-full w-full" label="Room with a Japandi redesign" />}
            />
          </div>
          <div>
            <h2 id="compare" className="text-4xl">See the change before you commit</h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Upload your own photo in the editor to test colours and styles with an image service, or use the sample transformations to get a feel for it. Photo ideas show the look. The 2D plan checks that everything actually fits.
            </p>
            <Link to="/create" className="mt-6 inline-flex h-11 items-center rounded-md bg-sage-deep px-5 text-sm font-medium text-ivory hover:bg-[#2f3829]">Start with your room</Link>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="features">
          <h2 id="features" className="max-w-xl text-4xl">Tools for deciding, not just dreaming</h2>
          <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 border-t border-line pt-5">
                <f.icon aria-hidden size={22} className="mt-0.5 shrink-0 text-sage" />
                <div>
                  <dt className="text-lg font-medium font-sans">{f.title}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{f.text}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="examples">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="examples" className="max-w-xl text-4xl">Start from an example</h2>
            <Link to="/examples" className="text-sm font-medium text-sage-deep hover:underline">See all examples</Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {showcase.map((ex) => <ExampleCard key={ex.key} ex={ex} />)}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
