// Sessions, settings and stats, saved in this browser's localStorage.
// Nothing here ever leaves the user's computer.

const KEY = 'purrmodoro:v1'

const PRESETS = {
  classic: { focus: 25, rest: 5, rounds: 4, longRest: 15 },
  deep: { focus: 50, rest: 10, rounds: 2, longRest: 20 },
  quick: { focus: 15, rest: 3, rounds: 4, longRest: 10 },
}

let nextId = 1
const makeSession = (name, minutes, type) => ({ id: `${Date.now()}-${nextId++}`, name, minutes, type })

function buildPreset(key) {
  const p = PRESETS[key]
  const list = []
  for (let i = 1; i <= p.rounds; i++) {
    list.push(makeSession(`Focus #${i}`, p.focus, 'focus'))
    const last = i === p.rounds
    list.push(makeSession(last ? 'Long nap' : 'Little break', last ? p.longRest : p.rest, 'break'))
  }
  return list
}

function defaults() {
  return {
    sessions: buildPreset('classic'),
    current: 0,
    autoplay: true,
    muted: false,
    theme: null, // null = follow the system
    coat: 'ginger',
    timer: null, // saved timer so a reload doesn't lose progress
    stats: { days: {}, totalSessions: 0, totalMinutes: 0 },
  }
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved && Array.isArray(saved.sessions)) return { ...defaults(), ...saved }
  } catch {
    // corrupted or blocked storage, start fresh
  }
  return defaults()
}

export const store = load()

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // private mode or storage full, the app still works for this visit
  }
}

export function currentSession() {
  return store.sessions[store.current] ?? null
}

export function addSession(name, minutes, type) {
  const fallback = type === 'focus' ? 'Focus time' : 'Break'
  store.sessions.push(makeSession(name.trim() || fallback, minutes, type))
  save()
}

export function removeSession(index) {
  store.sessions.splice(index, 1)
  if (index < store.current) store.current--
  store.current = Math.min(store.current, Math.max(0, store.sessions.length - 1))
  save()
}

export function moveSession(index, delta) {
  const to = index + delta
  if (to < 0 || to >= store.sessions.length) return
  const [item] = store.sessions.splice(index, 1)
  store.sessions.splice(to, 0, item)
  if (store.current === index) store.current = to
  else if (store.current === to) store.current = index
  save()
}

export function loadPreset(key) {
  store.sessions = buildPreset(key)
  store.current = 0
  save()
}

export function clearSessions() {
  store.sessions = []
  store.current = 0
  save()
}

// ---- stats ----

const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function recordFocus(minutes) {
  const key = dayKey()
  const day = (store.stats.days[key] ??= { sessions: 0, minutes: 0 })
  day.sessions++
  day.minutes += minutes
  store.stats.totalSessions++
  store.stats.totalMinutes += minutes
  save()
}

export function todayStats() {
  return store.stats.days[dayKey()] ?? { sessions: 0, minutes: 0 }
}

// Consecutive days with at least one focus session, counting back from today
// (or from yesterday, so the streak doesn't look broken first thing in the morning).
export function streak() {
  const date = new Date()
  if (!store.stats.days[dayKey(date)]) date.setDate(date.getDate() - 1)
  let count = 0
  while (store.stats.days[dayKey(date)]) {
    count++
    date.setDate(date.getDate() - 1)
  }
  return count
}
