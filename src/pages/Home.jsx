import { PLAYAS } from '../data/playas.js'
import TarjetaPlaya from '../components/TarjetaPlaya.jsx'

export default function Home() {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold text-sky-900">Playas de Gran Canaria</h1>
      <div className="grid gap-3">
        {PLAYAS.map((p) => (
          <TarjetaPlaya key={p.id} playa={p} />
        ))}
      </div>
    </section>
  )
}
