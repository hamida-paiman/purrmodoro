// A countdown that stores the *end time* instead of counting ticks.
// Even if ticks arrive late, remaining time is always correct.
//
// Events:  'tick' -> { remaining, total }    'done' -> {}

export class Timer extends EventTarget {
  constructor() {
    super()
    this.total = 0 // ms
    this.remaining = 0 // ms, used while paused/idle
    this.endTime = null // timestamp while running
    this.status = 'idle' // 'idle' | 'running' | 'paused'
    this.#startTicking()
  }

  #startTicking() {
    try {
      const worker = new Worker(new URL('./tick-worker.js', import.meta.url), { type: 'module' })
      worker.onmessage = () => this.#tick()
    } catch {
      setInterval(() => this.#tick(), 250)
    }
    // Catch up immediately when the tab becomes visible again
    document.addEventListener('visibilitychange', () => this.#tick())
  }

  load(ms) {
    this.total = ms
    this.remaining = ms
    this.endTime = null
    this.status = 'idle'
    this.#emitTick()
  }

  start() {
    if (this.status === 'running' || this.remaining <= 0) return
    this.endTime = Date.now() + this.remaining
    this.status = 'running'
    this.#emitTick()
  }

  pause() {
    if (this.status !== 'running') return
    this.remaining = Math.max(0, this.endTime - Date.now())
    this.endTime = null
    this.status = 'paused'
    this.#emitTick()
  }

  reset() {
    this.load(this.total)
  }

  getRemaining() {
    return this.status === 'running' ? Math.max(0, this.endTime - Date.now()) : this.remaining
  }

  // Used to resume a timer after a page reload
  restore({ total, remaining, endTime, status }) {
    this.total = total
    if (status === 'running' && endTime) {
      this.endTime = endTime
      this.status = 'running'
      this.remaining = Math.max(0, endTime - Date.now())
    } else {
      this.remaining = remaining
      this.status = status === 'paused' ? 'paused' : 'idle'
    }
    this.#tick()
    this.#emitTick()
  }

  snapshot() {
    return { total: this.total, remaining: this.getRemaining(), endTime: this.endTime, status: this.status }
  }

  #tick() {
    if (this.status !== 'running') return
    const remaining = this.getRemaining()
    if (remaining <= 0) {
      this.remaining = 0
      this.endTime = null
      this.status = 'idle'
      this.#emitTick()
      this.dispatchEvent(new CustomEvent('done'))
    } else {
      this.#emitTick()
    }
  }

  #emitTick() {
    this.dispatchEvent(
      new CustomEvent('tick', { detail: { remaining: this.getRemaining(), total: this.total } }),
    )
  }
}

export function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
