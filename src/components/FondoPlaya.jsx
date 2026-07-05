// Fondo dinámico de la ficha: el cielo refleja el veredicto (sol / sol y nubes /
// nublado) y el agua sube o baja según la marea real de la playa.
// Es el elemento-firma de PlayIA. Va detrás del contenido (que vive en tarjetas
// legibles por encima).

const CIELOS = {
  verde: 'linear-gradient(180deg,#38bdf8 0%,#7dd3fc 42%,#e0f7ff 100%)',
  ambar: 'linear-gradient(180deg,#8aa6bd 0%,#bccbd8 46%,#e9eff4 100%)',
  rojo: 'linear-gradient(180deg,#6b7688 0%,#9aa7b6 52%,#ccd5df 100%)',
}

const NUBES = {
  verde: [{ top: '16%', left: '12%', w: 150, h: 46, o: 0.75 }],
  ambar: [
    { top: '12%', left: '8%', w: 190, h: 58, o: 0.9 },
    { top: '24%', left: '58%', w: 150, h: 48, o: 0.8 },
  ],
  rojo: [
    { top: '9%', left: '4%', w: 230, h: 66, o: 0.92 },
    { top: '20%', left: '46%', w: 210, h: 60, o: 0.88 },
    { top: '32%', left: '20%', w: 180, h: 52, o: 0.8 },
  ],
}

function Sol({ nivel }) {
  if (nivel === 'rojo') return null
  return (
    <div
      className="sol-anim pointer-events-none absolute"
      style={{
        top: '8%',
        right: '14%',
        width: 130,
        height: 130,
        borderRadius: '9999px',
        background:
          'radial-gradient(circle,#fffbe6 0%,#fde68a 46%,rgba(253,224,71,0) 72%)',
        opacity: nivel === 'verde' ? 1 : 0.7,
      }}
      aria-hidden="true"
    />
  )
}

export default function FondoPlaya({ nivel = 'ambar', fraccionAgua = 0.5 }) {
  const cielo = CIELOS[nivel] ?? CIELOS.ambar
  const nubes = NUBES[nivel] ?? NUBES.ambar
  const tonoNube = nivel === 'rojo' ? 'rgba(226,232,240,0.92)' : 'rgba(255,255,255,0.85)'
  const alturaAgua = 16 + fraccionAgua * 66 // % del alto de pantalla

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ background: cielo }}
      aria-hidden="true"
    >
      <Sol nivel={nivel} />

      {nubes.map((n, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-2xl"
          style={{
            top: n.top,
            left: n.left,
            width: n.w,
            height: n.h,
            opacity: n.o,
            background: tonoNube,
          }}
        />
      ))}

      {/* Agua: sube o baja con la marea. Superficie de espuma visible para que
          se distinga claramente el nivel del mar sobre el cielo. */}
      <div
        className="absolute inset-x-0 bottom-0 overflow-visible transition-[height] duration-1000 ease-out"
        style={{ height: `${alturaAgua}%` }}
      >
        {/* cresta con espuma (encima del borde del agua) */}
        <svg
          className="ola-anim absolute left-0 h-8 w-[200%]"
          style={{ top: '-14px' }}
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 Q90,6 180,20 T360,20 T540,20 T720,20 T900,20 T1080,20 T1260,20 T1440,20 V40 H0 Z"
            fill="rgba(224,247,255,0.9)"
          />
          <path
            d="M0,24 Q90,10 180,24 T360,24 T540,24 T720,24 T900,24 T1080,24 T1260,24 T1440,24 V40 H0 Z"
            fill="rgba(56,189,248,0.85)"
          />
        </svg>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg,rgba(45,170,205,0.82) 0%,rgba(9,95,125,0.93) 100%)',
          }}
        />
      </div>
    </div>
  )
}
