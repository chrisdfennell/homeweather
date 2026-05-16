import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { connectBlitzortung } from '../lightning/blitzortung.js'

const RAINVIEWER_INDEX = 'https://api.rainviewer.com/public/weather-maps.json'

function Recenter({ lat, lon }) {
  const map = useMap()
  useEffect(() => {
    if (typeof lat === 'number' && typeof lon === 'number') {
      map.setView([lat, lon], map.getZoom())
    }
  }, [lat, lon, map])
  return null
}

export default function RadarMap({ lat, lon }) {
  const [frames, setFrames] = useState([])
  const [host, setHost] = useState('')
  const [frameIndex, setFrameIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [strikes, setStrikes] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetch(RAINVIEWER_INDEX)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const past = data.radar?.past ?? []
        const nowcast = data.radar?.nowcast ?? []
        const all = [...past, ...nowcast]
        setHost(data.host)
        setFrames(all)
        setFrameIndex(Math.max(0, past.length - 1))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    clearInterval(timerRef.current)
    if (!playing || frames.length === 0) return
    timerRef.current = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames.length)
    }, 600)
    return () => clearInterval(timerRef.current)
  }, [playing, frames.length])

  useEffect(() => {
    if (typeof lat !== 'number' || typeof lon !== 'number') return
    const conn = connectBlitzortung((strike) => {
      setStrikes((prev) => {
        const next = [...prev, strike]
        const cutoff = Date.now() - 15 * 60 * 1000
        return next.filter((s) => s.time >= cutoff).slice(-500)
      })
    })
    const cleaner = setInterval(() => {
      const cutoff = Date.now() - 15 * 60 * 1000
      setStrikes((prev) => prev.filter((s) => s.time >= cutoff))
    }, 30000)
    return () => {
      conn.close()
      clearInterval(cleaner)
    }
  }, [lat, lon])

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return null
  }

  const frame = frames[frameIndex]
  const radarUrl = frame && host ? `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png` : null
  const frameTime = frame ? new Date(frame.time * 1000) : null

  return (
    <section className="card map">
      <div className="map-header">
        <h2>Radar + Lightning</h2>
        <div className="map-controls">
          <button onClick={() => setPlaying((p) => !p)}>{playing ? '⏸' : '▶'}</button>
          <span className="frame-time">
            {frameTime ? frameTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}
          </span>
          <span className="strike-count">⚡ {strikes.length}</span>
        </div>
      </div>
      <MapContainer
        center={[lat, lon]}
        zoom={8}
        style={{ height: '420px', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {radarUrl && (
          <TileLayer
            key={frame.path}
            url={radarUrl}
            opacity={0.6}
            attribution='Radar &copy; RainViewer'
          />
        )}
        <CircleMarker
          center={[lat, lon]}
          radius={6}
          pathOptions={{ color: '#1e88e5', fillColor: '#1e88e5', fillOpacity: 0.9 }}
        />
        {strikes.map((s) => {
          const ageMin = (Date.now() - s.time) / 60000
          const opacity = Math.max(0.15, 1 - ageMin / 15)
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lon]}
              radius={5}
              pathOptions={{
                color: '#ffeb3b',
                fillColor: '#ffeb3b',
                fillOpacity: opacity,
                weight: 1
              }}
            >
              <Tooltip>{new Date(s.time).toLocaleTimeString()}</Tooltip>
            </CircleMarker>
          )
        })}
        <Recenter lat={lat} lon={lon} />
      </MapContainer>
    </section>
  )
}
