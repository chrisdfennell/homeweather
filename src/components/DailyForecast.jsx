import { iconUrl } from '../api/accuweather.js'

function dayLabel(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short' })
}

export default function DailyForecast({ data }) {
  return (
    <section className="card daily">
      <h2>Next 5 days</h2>
      <div className="daily-list">
        {data.DailyForecasts?.map((d) => (
          <div className="daily-row" key={d.EpochDate}>
            <div className="daily-day">{dayLabel(d.Date)}</div>
            <img src={iconUrl(d.Day?.Icon)} alt={d.Day?.IconPhrase} width="40" height="40" />
            <div className="daily-phrase">{d.Day?.IconPhrase}</div>
            <div className="daily-temps">
              <span className="hi">{Math.round(d.Temperature?.Maximum?.Value)}°</span>
              <span className="lo">{Math.round(d.Temperature?.Minimum?.Value)}°</span>
            </div>
            <div className="daily-precip">{d.Day?.PrecipitationProbability ?? 0}%</div>
          </div>
        ))}
      </div>
      {data.Headline?.Text && (
        <p className="daily-headline">{data.Headline.Text}</p>
      )}
    </section>
  )
}
