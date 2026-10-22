import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import RoomCreationWizard from '../components/RoomCreationWizard'

export default function Create() {
  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-10">
        <h1 className="text-4xl">Create your room</h1>
        <p className="mb-10 mt-2 text-ink-soft">Three short steps. You can change everything in the editor afterwards.</p>
        <RoomCreationWizard />
      </main>
      <Footer />
    </div>
  )
}
