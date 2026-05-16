import { useEffect, useRef, useState } from 'react'
import { autocompleteLocation, locationByKey } from '../api/accuweather.js'

export default function LocationSearch({ onPick }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const timer = useRef(null)
  const boxRef = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    timer.current = setTimeout(async () => {
      try {
        const r = await autocompleteLocation(query.trim())
        setResults(r)
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 250)
    return () => clearTimeout(timer.current)
  }, [query])

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = async (r) => {
    setQuery('')
    setResults([])
    setOpen(false)
    let lat, lon
    try {
      const full = await locationByKey(r.Key)
      lat = full.GeoPosition?.Latitude
      lon = full.GeoPosition?.Longitude
    } catch {
      // fall through with undefined coords; radar map will be hidden until coords resolve
    }
    onPick({
      key: r.Key,
      name: r.LocalizedName,
      region: r.AdministrativeArea?.ID,
      country: r.Country?.ID,
      lat,
      lon
    })
  }

  return (
    <div className="search" ref={boxRef}>
      <input
        type="text"
        placeholder="Search city…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
      />
      {open && results.length > 0 && (
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.Key} onClick={() => pick(r)}>
              <strong>{r.LocalizedName}</strong>
              <span>
                {r.AdministrativeArea?.LocalizedName
                  ? `, ${r.AdministrativeArea.LocalizedName}`
                  : ''}{' '}
                · {r.Country?.LocalizedName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
