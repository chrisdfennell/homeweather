import { iconUrl } from '../api/accuweather.js'

export default function CurrentConditions({ data }) {
  const temp = data.Temperature?.Imperial?.Value
  const feels = data.RealFeelTemperature?.Imperial?.Value
  const wind = data.Wind?.Speed?.Imperial
  const humidity = data.RelativeHumidity
  const pressure = data.Pressure?.Imperial
  const uv = data.UVIndex
  const visibility = data.Visibility?.Imperial

  return (
    <section className="card current">
      <div className="current-main">
        <img src={iconUrl(data.WeatherIcon)} alt={data.WeatherText} width="96" height="96" />
        <div>
          <div className="temp">{Math.round(temp)}°F</div>
          <div className="phrase">{data.WeatherText}</div>
          <div className="feels">Feels like {Math.round(feels)}°F</div>
        </div>
      </div>
      <dl className="stats">
        <div><dt>Wind</dt><dd>{wind?.Value} {wind?.Unit} {data.Wind?.Direction?.Localized}</dd></div>
        <div><dt>Humidity</dt><dd>{humidity}%</dd></div>
        <div><dt>Pressure</dt><dd>{pressure?.Value} {pressure?.Unit}</dd></div>
        <div><dt>UV</dt><dd>{uv} {data.UVIndexText}</dd></div>
        <div><dt>Visibility</dt><dd>{visibility?.Value} {visibility?.Unit}</dd></div>
        <div><dt>Cloud</dt><dd>{data.CloudCover}%</dd></div>
      </dl>
    </section>
  )
}
