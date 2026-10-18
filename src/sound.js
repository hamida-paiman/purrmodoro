// Tiny synthesized sounds with the Web Audio API, so there are no audio files to load.

let ctx = null
let muted = false

export function setMuted(value) {
  muted = value
}

// Browsers only allow audio after a click, so call this from a button handler.
export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  } catch {
    ctx = null
  }
}

function note(freq, start, duration, { type = 'sine', gain = 0.16, slideTo } = {}) {
  const t = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const vol = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration * 0.6)
  vol.gain.setValueAtTime(0.0001, t)
  vol.gain.exponentialRampToValueAtTime(gain, t + 0.02)
  vol.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(vol).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

function play(fn) {
  if (muted) return
  unlockAudio()
  if (ctx) fn()
}

// Sparkly "ta-da" arpeggio when a session ends
export function playChime(big = false) {
  play(() => {
    const notes = big ? [784, 988, 1175, 1568, 1976, 2349] : [1047, 1319, 1568, 2093]
    notes.forEach((f, i) => note(f, i * 0.11, 0.7))
    notes.forEach((f, i) => note(f * 2, i * 0.11 + 0.03, 0.25, { type: 'triangle', gain: 0.03 }))
  })
}

// A little "mew" when you pet the cat
export function playMew() {
  play(() => {
    note(620, 0, 0.32, { type: 'triangle', gain: 0.09, slideTo: 980 })
    note(900, 0.16, 0.22, { type: 'sine', gain: 0.05, slideTo: 640 })
  })
}

// Soft blip for buttons
export function playPop() {
  play(() => note(880, 0, 0.12, { gain: 0.06, slideTo: 1320 }))
}
