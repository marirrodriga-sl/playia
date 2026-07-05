export default function Navbar() {
  return (
    <nav className="relative z-20 bg-sky-500 text-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <span className="text-xl font-bold tracking-tight">
          🏖️ Play<span className="text-yellow-300">IA</span>
        </span>
        <p className="text-xs">
          <span className="italic text-slate-200">Creado por: </span>
          <a
            href="https://www.marirrodriga-ia.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white underline decoration-yellow-300 underline-offset-2 transition hover:text-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-100 active:text-yellow-300"
          >
            Marirrodriga.IA
          </a>
        </p>
      </div>
    </nav>
  )
}
