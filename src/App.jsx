import { useCallback, useEffect, useRef, useState } from 'react'
import {
  currentConditions as fetchCurrent,
  hourlyForecast as fetchHourly,
  dailyForecast as fetchDaily,
  alerts as fetchAlerts,
  locationByGeoposition
} from './api/accuweather.js'
import LocationSearch from './components/LocationSearch.jsx'
import CurrentConditions from './components/CurrentConditions.jsx'
import HourlyForecast from './components/HourlyForecast.jsx'
import DailyForecast from './components/DailyForecast.jsx'
import RadarMap from './components/RadarMap.jsx'
import Alerts from './components/Alerts.jsx'

const STORAGE_KEY = 'homeweather.location'
const REFRESH_MS = 15 * 60 * 1000

function loadSavedLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveLocation(loc) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
}

function relativeTime(d) {
  if (!d) return '—'
  const secs = Math.round((Date.now() - d.getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  return `${hrs}h ago`
}

export default function App() {
  const [location, setLocation] = useState(loadSavedLocation)
  const [current, setCurrent] = useState(null)
  const [hourly, setHourly] = useState(null)
  const [daily, setDaily] = useState(null)
  const [alertList, setAlertList] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [, setNowTick] = useState(0)
  const lastFetchRef = useRef(0)

  const requestGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported by this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setLoading(true)
          const data = await locationByGeoposition(pos.coords.latitude, pos.coords.longitude)
          const loc = {
            key: data.Key,
            name: data.LocalizedName,
            region: data.AdministrativeArea?.ID,
            country: data.Country?.ID,
            lat: data.GeoPosition?.Latitude ?? pos.coords.latitude,
            lon: data.GeoPosition?.Longitude ?? pos.coords.longitude
          }
          setLocation(loc)
          saveLocation(loc)
        } catch (e) {
          setError(e.message)
        } finally {
          setLoading(false)
        }
      },
      (err) => setError(`Geolocation failed: ${err.message}`),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    )
  }, [])

  const fetchAll = useCallback(async (key) => {
    if (!key) return
    if (Date.now() - lastFetchRef.current < 30 * 1000) return
    lastFetchRef.current = Date.now()
    setLoading(true)
    setError(null)
    try {
      const [c, h, d, a] = await Promise.all([
        fetchCurrent(key),
        fetchHourly(key),
        fetchDaily(key),
        fetchAlerts(key)
      ])
      setCurrent(c)
      setHourly(h)
      setDaily(d)
      setAlertList(a)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!location) requestGeolocation()
  }, [location, requestGeolocation])

  useEffect(() => {
    if (!location?.key) return
    fetchAll(location.key)
  }, [location?.key, fetchAll])

  useEffect(() => {
    if (!location?.key) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchAll(location.key)
    }, REFRESH_MS)
    return () => clearInterval(id)
  }, [location?.key, fetchAll])

  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 30 * 1000)
    return () => clearInterval(id)
  }, [])

  const onPickLocation = (loc) => {
    setLocation(loc)
    saveLocation(loc)
  }

  const sun = daily?.DailyForecasts?.[0]?.Sun

  return (
    <div className="app">
      <header className="topbar">
        <h1>Home Weather</h1>
        <div className="topbar-controls">
          <LocationSearch onPick={onPickLocation} />
          <button onClick={requestGeolocation} title="Use my location">📍</button>
          <button
            onClick={() => location?.key && fetchAll(location.key)}
            title={`Last updated ${relativeTime(lastUpdated)}`}
            disabled={loading}
          >
            {loading ? '…' : '↻'}
          </button>
        </div>
      </header>

      {location && (
        <div className="place">
          <span className="place-name">{location.name}</span>
          {location.region && <span className="place-region">, {location.region}</span>}
          {location.country && <span className="place-country"> · {location.country}</span>}
          {lastUpdated && <span className="place-updated"> · updated {relativeTime(lastUpdated)}</span>}
        </div>
      )}

      <Alerts data={alertList} />

      {error && <div className="error">{error}</div>}

      {current && <CurrentConditions data={current} sun={sun} />}

      <div className="grid">
        {hourly && <HourlyForecast data={hourly} />}
        {daily && <DailyForecast data={daily} />}
      </div>

      {location && <RadarMap lat={location.lat} lon={location.lon} />}

      <footer className="footer">
        Weather © AccuWeather · Radar © RainViewer · Lightning © Blitzortung.org
      </footer>
    </div>
  )
}
