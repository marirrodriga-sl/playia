export default function Navbar() {
  return (
    <nav className="bg-sky-500 text-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <span className="text-lg font-bold">🏖️ Semáforo de Playa</span>
        <a
          href="https://www.marirrodriga-ia.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-yellow-300 px-3 py-1 text-sm font-semibold text-sky-900 transition hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-100 active:bg-yellow-400"
        >
          Marirrodriga.IA
        </a>
      </div>
    </nav>
  )
}
