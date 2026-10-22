import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import BeforeAfterSlider from './BeforeAfterSlider'
import RoomScene from './RoomScene'
import { useOpenExample } from '../hooks/useOpenExample'

export default function LandingHero() {
  const openExample = useOpenExample()
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-6 pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:pt-16">
      <div>
        <p className="mb-4 text-sm font-medium text-sage-deep">Don&apos;t buy on guesswork. Try it first.</p>
        <h1 className="text-[2.6rem] font-medium leading-[1.05] sm:text-6xl">Your room. Your ideas. Before you buy.</h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
          Redesign your space, experiment with furniture layouts, and discover what works before spending money.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/create" className="inline-flex h-12 items-center gap-2 rounded-md bg-sage-deep px-6 text-[15px] font-medium text-ivory transition-colors hover:bg-[#2f3829]">
            Design My Room <FiArrowRight aria-hidden />
          </Link>
          <button type="button" onClick={() => openExample('bedroom')} className="inline-flex h-12 cursor-pointer items-center rounded-md border border-line bg-paper px-6 text-[15px] font-medium transition-colors hover:border-sage hover:bg-sage-wash">
            Explore Example
          </button>
        </div>
        <p className="mt-4 text-sm text-ink-soft">No account needed. Projects stay in your browser.</p>
      </div>
      <div>
        <BeforeAfterSlider
          className="aspect-[4/3] shadow-panel"
          initial={46}
          before={<RoomScene scene="before" className="h-full w-full" label="Living room before the redesign" />}
          after={<RoomScene scene="scandi" className="h-full w-full" label="Living room after the redesign" />}
        />
        <p className="mt-2 text-xs text-ink-soft">Illustration. Drag the handle to compare.</p>
      </div>
    </section>
  )
}
