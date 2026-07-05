import { describe, it, expect } from 'vitest'
import { zonaActiva, ESCALA_TEMP, ESCALA_VIENTO } from './escalas.js'

describe('zonaActiva', () => {
  it('27° cae en "Genial"', () => {
    expect(zonaActiva(27, ESCALA_TEMP.zonas).etiqueta).toBe('Genial')
  })

  it('15° cae en "Frío"', () => {
    expect(zonaActiva(15, ESCALA_TEMP.zonas).etiqueta).toBe('Frío')
  })

  it('38° cae en "Mucho calor" (última zona)', () => {
    expect(zonaActiva(38, ESCALA_TEMP.zonas).etiqueta).toBe('Mucho calor')
  })

  it('viento 16 km/h es "Ideal"', () => {
    expect(zonaActiva(16, ESCALA_VIENTO.zonas).etiqueta).toBe('Ideal')
  })

  it('viento 25 km/h es "Molesto"', () => {
    expect(zonaActiva(25, ESCALA_VIENTO.zonas).etiqueta).toBe('Molesto')
  })

  it('viento 42 km/h es "Mucho viento"', () => {
    expect(zonaActiva(42, ESCALA_VIENTO.zonas).etiqueta).toBe('Mucho viento')
  })
})
