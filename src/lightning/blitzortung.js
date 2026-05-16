// Best-effort live lightning feed from the public Blitzortung WebSocket.
// The wire format is LZW-compressed JSON; the decoder below is the
// widely-circulated community implementation.
function lzwDecode(b) {
  if (!b) return ''
  const e = {}
  const d = b.split('')
  let c = d[0]
  let f = c
  const g = [c]
  const h = 256
  let o = h
  for (let n = 1; n < d.length; n++) {
    const code = d[n].charCodeAt(0)
    const a = h > code ? d[n] : (e[code] ? e[code] : f + c)
    g.push(a)
    c = a.charAt(0)
    e[o] = f + c
    o++
    f = a
  }
  return g.join('')
}

const HOSTS = [
  'wss://ws1.blitzortung.org/',
  'wss://ws7.blitzortung.org/',
  'wss://ws8.blitzortung.org/'
]

export function connectBlitzortung(onStrike) {
  let ws
  let closed = false
  let hostIdx = 0
  let reconnectTimer

  const open = () => {
    if (closed) return
    const url = HOSTS[hostIdx % HOSTS.length]
    hostIdx++
    try {
      ws = new WebSocket(url)
    } catch {
      scheduleReconnect()
      return
    }
    ws.onopen = () => {
      try {
        ws.send(JSON.stringify({ a: 111 }))
      } catch {}
    }
    ws.onmessage = (ev) => {
      try {
        const raw = typeof ev.data === 'string' ? ev.data : ''
        const decoded = lzwDecode(raw)
        const obj = JSON.parse(decoded)
        if (typeof obj.lat !== 'number' || typeof obj.lon !== 'number') return
        const timeMs =
          typeof obj.time === 'number'
            ? obj.time > 1e15
              ? Math.floor(obj.time / 1e6) // nanoseconds → ms
              : obj.time > 1e12
                ? obj.time // already ms
                : obj.time * 1000 // seconds → ms
            : Date.now()
        onStrike({
          id: `${obj.time}-${obj.lat}-${obj.lon}`,
          lat: obj.lat,
          lon: obj.lon,
          time: timeMs
        })
      } catch {
        // ignore unparseable frames
      }
    }
    ws.onclose = scheduleReconnect
    ws.onerror = () => {
      try { ws.close() } catch {}
    }
  }

  const scheduleReconnect = () => {
    if (closed) return
    clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(open, 3000)
  }

  open()

  return {
    close() {
      closed = true
      clearTimeout(reconnectTimer)
      try { ws?.close() } catch {}
    }
  }
}
