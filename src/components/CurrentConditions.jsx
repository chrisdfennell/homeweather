import { iconUrl } from '../api/accuweather.js'
import WindCompass from './WindCompass.jsx'

function fmtTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function CurrentConditions({ data, sun }) {
  const temp = data.Temperature?.Imperial?.Value
  const feels = data.RealFeelTemperature?.Imperial?.Value
  const wind = data.Wind?.Speed?.Imperial
  const humidity = data.RelativeHumidity
  const pressure = data.Pressure?.Imperial
  const uv = data.UVIndex
  const visibility = data.Visibility?.Imperial
  const sunrise = fmtTime(sun?.Rise)
  const sunset = fmtTime(sun?.Set)

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
        <div className="stat-wind">
          <dt>Wind</dt>
          <dd>
            <WindCompass
              degrees={data.Wind?.Direction?.Degrees}
              label={data.Wind?.Direction?.Localized}
              speed={wind?.Value}
              unit={wind?.Unit}
            />
          </dd>
        </div>
        <div><dt>Humidity</dt><dd>{humidity}%</dd></div>
        <div><dt>Pressure</dt><dd>{pressure?.Value} {pressure?.Unit}</dd></div>
        <div><dt>UV</dt><dd>{uv} {data.UVIndexText}</dd></div>
        <div><dt>Visibility</dt><dd>{visibility?.Value} {visibility?.Unit}</dd></div>
        <div><dt>Cloud</dt><dd>{data.CloudCover}%</dd></div>
        {sunrise && <div><dt>Sunrise</dt><dd>{sunrise}</dd></div>}
        {sunset && <div><dt>Sunset</dt><dd>{sunset}</dd></div>}
      </dl>
    </section>
  )
}
