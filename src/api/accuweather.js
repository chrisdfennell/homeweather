const BASE = 'https://dataservice.accuweather.com'
const KEY = import.meta.env.VITE_ACCUWEATHER_KEY

function requireKey() {
  if (!KEY) {
    throw new Error('Missing VITE_ACCUWEATHER_KEY. Add it to .env and restart the dev server.')
  }
}

async function get(path, params = {}) {
  requireKey()
  const url = new URL(BASE + path)
  url.searchParams.set('apikey', KEY)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`AccuWeather ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json()
}

export function locationByGeoposition(lat, lon) {
  return get('/locations/v1/cities/geoposition/search', { q: `${lat},${lon}` })
}

export function autocompleteLocation(query) {
  if (!query || query.length < 2) return Promise.resolve([])
  return get('/locations/v1/cities/autocomplete', { q: query })
}

export function locationByKey(locationKey) {
  return get(`/locations/v1/${locationKey}`, { details: 'false' })
}

export async function currentConditions(locationKey) {
  const data = await get(`/currentconditions/v1/${locationKey}`, { details: 'true' })
  return data[0]
}

export function hourlyForecast(locationKey, metric = false) {
  return get(`/forecasts/v1/hourly/12hour/${locationKey}`, { details: 'true', metric })
}

export function dailyForecast(locationKey, metric = false) {
  return get(`/forecasts/v1/daily/5day/${locationKey}`, { details: 'true', metric })
}

export function iconUrl(iconNumber) {
  const n = String(iconNumber).padStart(2, '0')
  return `https://developer.accuweather.com/sites/default/files/${n}-s.png`
}
