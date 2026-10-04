import { describe, it, expect } from 'vitest'
import { urlProxy } from './proxyMeteo.js'

describe('urlProxy (la que arma la función del servidor)', () => {
  it('manda al endpoint de cliente con la clave del servidor', () => {
    const url = urlProxy('forecast', { latitude: '27.7', longitude: '-15.6' }, 'CLAVE123')
    expect(url).toContain('https://customer-api.open-meteo.com/v1/forecast?')
    expect(url).toContain('latitude=27.7')
    expect(url).toContain('apikey=CLAVE123')
  })

  it('deja pasar solo los parámetros de consulta conocidos', () => {
    const url = urlProxy(
      'marine',
      { latitude: '27.7', forecast_days: '10', apikey: 'INTENTO_DE_COLARLA', url: 'http://malo' },
      'CLAVE123',
    )
    expect(url).toContain('forecast_days=10')
    expect(url).not.toContain('INTENTO_DE_COLARLA')
    expect(url).not.toContain('malo')
    expect(url).toContain('apikey=CLAVE123')
  })

  it('no es un relé abierto: solo conoce forecast y marine', () => {
    expect(urlProxy('cualquier-cosa', { latitude: '27.7' }, 'CLAVE123')).toBeNull()
  })
})
