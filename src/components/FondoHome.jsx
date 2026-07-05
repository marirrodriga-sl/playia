// Fondo ambiental del Home: cielo luminoso con sol y una franja de mar abajo.
// Comparte el lenguaje visual de la ficha (sol, olas, espuma) pero es estático:
// el Home es un listado de muchas playas, no una playa concreta.

export default function FondoHome() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#7dd3fc 0%,#bae6fd 44%,#eaf8ff 100%)' }}
      aria-hidden="true"
    >
      {/* sol suave */}
      <div
        className="sol-anim absolute"
        style={{
          top: '5%',
          right: '9%',
          width: 110,
          height: 110,
          borderRadius: '9999px',
          background:
            'radial-gradient(circle,#fffbe6 0%,#fde68a 48%,rgba(253,224,71,0) 72%)',
          opacity: 0.9,
        }}
      />
      {/* nubecilla */}
      <div
        className="absolute rounded-full bg-white/70 blur-2xl"
        style={{ top: '14%', left: '12%', width: 150, height: 44 }}
      />

      {/* mar al fondo */}
      <div className="absolute inset-x-0 bottom-0 overflow-visible" style={{ height: '24%' }}>
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
