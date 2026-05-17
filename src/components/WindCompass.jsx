export default function WindCompass({ degrees, label, speed, unit }) {
  // AccuWeather Direction.Degrees = bearing the wind is coming FROM.
  // Rotate the arrow by +180° so it points where the wind is going TO.
  const rotation = typeof degrees === 'number' ? (degrees + 180) % 360 : 0
  return (
    <div className="wind">
      <svg viewBox="0 0 32 32" width="28" height="28" className="wind-arrow"
        style={{ transform: `rotate(${rotation}deg)` }}
        aria-hidden="true"
      >
        <circle cx="16" cy="16" r="14" className="wind-ring" />
        <path d="M16 4 L22 22 L16 18 L10 22 Z" className="wind-needle" />
      </svg>
      <div className="wind-text">
        <div className="wind-speed">{speed} {unit}</div>
        <div className="wind-dir">{label}</div>
      </div>
    </div>
  )
}
