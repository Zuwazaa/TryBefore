import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ExampleCard from '../components/ExampleCard'
import { EXAMPLES } from '../lib/demo'

export default function Examples() {
  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pt-10">
        <h1 className="text-4xl">Example rooms</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Each example opens as a copy in the editor, so you can move things around freely. The first one has deliberate mistakes to fix.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((ex) => <ExampleCard key={ex.key} ex={ex} showPlan />)}
        </div>
      </main>
      <Footer />
    </div>
  )
}
