const COLORES = {
  verde: { bg: 'bg-green-500', texto: 'Buen día' },
  ambar: { bg: 'bg-amber-400', texto: 'Regular' },
  rojo: { bg: 'bg-red-500', texto: 'Evitar' },
}

export default function Semaforo({ nivel }) {
  const c = COLORES[nivel] ?? COLORES.ambar
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-block h-4 w-4 rounded-full ${c.bg}`}
        role="img"
        aria-label={`Estado: ${c.texto}`}
      />
      <span className="text-sm font-medium text-sky-900">{c.texto}</span>
    </span>
  )
}
