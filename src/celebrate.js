import confetti from 'canvas-confetti'

const PASTELS = ['#ffb5c8', '#ffd6a5', '#cdb4f6', '#a8e6cf', '#fff1a8', '#ffffff']

// Pastel confetti cannons from both bottom corners of the main window.
export function fireConfetti(big = false) {
  const base = { colors: PASTELS, scalar: 1.1, ticks: 220, gravity: 0.9, disableForReducedMotion: true }
  const rounds = big ? 3 : 1
  for (let i = 0; i < rounds; i++) {
    setTimeout(() => {
      confetti({ ...base, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.9 } })
      confetti({ ...base, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.9 } })
      confetti({ ...base, particleCount: 30, spread: 100, startVelocity: 25, shapes: ['circle'], origin: { y: 0.4 } })
    }, i * 450)
  }
}
