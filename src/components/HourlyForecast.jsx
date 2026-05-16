import { iconUrl } from '../api/accuweather.js'

function hour(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric' })
}

export default function HourlyForecast({ data }) {
  return (
    <section className="card hourly">
      <h2>Next 12 hours</h2>
      <div className="hourly-row">
        {data.map((h) => (
          <div className="hourly-cell" key={h.EpochDateTime}>
            <div className="hourly-time">{hour(h.DateTime)}</div>
            <img src={iconUrl(h.WeatherIcon)} alt={h.IconPhrase} width="40" height="40" />
            <div className="hourly-temp">{Math.round(h.Temperature?.Value)}°</div>
            <div className="hourly-precip">{h.PrecipitationProbability}%</div>
          </div>
        ))}
      </div>
    </section>
  )
}
