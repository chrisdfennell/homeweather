function severity(level = '') {
  const l = level.toLowerCase()
  if (l.includes('extreme') || l.includes('warning')) return 'severe'
  if (l.includes('watch') || l.includes('moderate')) return 'moderate'
  return 'minor'
}

function fmtRange(area) {
  if (!area) return null
  const start = area.StartTime ? new Date(area.StartTime) : null
  const end = area.EndTime ? new Date(area.EndTime) : null
  const opts = { weekday: 'short', hour: 'numeric', minute: '2-digit' }
  const fmt = (d) => d?.toLocaleString([], opts)
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (end) return `until ${fmt(end)}`
  return null
}

export default function Alerts({ data }) {
  if (!data?.length) return null
  return (
    <section className="alerts">
      {data.map((a) => {
        const area = a.Area?.[0]
        const range = fmtRange(area)
        const sev = severity(a.Level || a.Category)
        return (
          <a
            key={a.AlertID}
            className={`alert alert-${sev}`}
            href={a.MobileLink || a.Link || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="alert-icon">⚠</div>
            <div className="alert-body">
              <div className="alert-title">
                {a.Description?.Localized || a.Description?.English || 'Weather Alert'}
              </div>
              {range && <div className="alert-time">{range}</div>}
              {a.Source && <div className="alert-source">{a.Source}</div>}
            </div>
          </a>
        )
      })}
    </section>
  )
}
