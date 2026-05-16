import { useCallback, useEffect, useState } from 'react'
import {
  currentConditions as fetchCurrent,
  hourlyForecast as fetchHourly,
  dailyForecast as fetchDaily,
  locationByGeoposition
} from './api/accuweather.js'
import LocationSearch from './components/LocationSearch.jsx'
import CurrentConditions from './components/CurrentConditions.jsx'
import HourlyForecast from './components/HourlyForecast.jsx'
import DailyForecast from './components/DailyForecast.jsx'
import RadarMap from './components/RadarMap.jsx'

const STORAGE_KEY = 'homeweather.location'

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

export default function App() {
  const [location, setLocation] = useState(loadSavedLocation)
  const [current, setCurrent] = useState(null)
  const [hourly, setHourly] = useState(null)
  const [daily, setDaily] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    if (!location) requestGeolocation()
  }, [location, requestGeolocation])

  useEffect(() => {
    if (!location?.key) return
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      fetchCurrent(location.key),
      fetchHourly(location.key),
      fetchDaily(location.key)
    ])
      .then(([c, h, d]) => {
        if (cancelled) return
        setCurrent(c)
        setHourly(h)
        setDaily(d)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [location?.key])

  const onPickLocation = (loc) => {
    setLocation(loc)
    saveLocation(loc)
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Home Weather</h1>
        <div className="topbar-controls">
          <LocationSearch onPick={onPickLocation} />
          <button onClick={requestGeolocation} title="Use my location">📍</button>
        </div>
      </header>

      {location && (
        <div className="place">
          <span className="place-name">{location.name}</span>
          {location.region && <span className="place-region">, {location.region}</span>}
          {location.country && <span className="place-country"> · {location.country}</span>}
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading…</div>}

      {current && <CurrentConditions data={current} />}

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
