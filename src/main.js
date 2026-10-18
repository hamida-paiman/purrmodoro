import './styles/main.css'
import './styles/cat.css'
import { Timer, formatTime } from './timer.js'
import * as S from './sessions.js'
import { createCat } from './cat.js'
import { fireConfetti } from './celebrate.js'
import { playChime, playMew, playPop, setMuted, unlockAudio } from './sound.js'
import { miniSupported, toggleMini, isMiniOpen, syncMini } from './miniWindow.js'
import { initAnalytics, trackEvent } from './analytics.js'

const $ = (id) => document.getElementById(id)
const el = {
  home: $('stage-home'),
  stage: $('stage'),
  time: $('time'),
  label: $('label'),
  fill: $('progress-fill'),
  yarn: $('yarn'),
  start: $('start-btn'),
  skip: $('skip-btn'),
  reset: $('reset-btn'),
  list: $('session-list'),
  form: $('add-form'),
  autoplay: $('autoplay'),
  clear: $('clear-btn'),
  mute: $('mute-btn'),
  theme: $('theme-btn'),
  mini: $('mini-btn'),
  statToday: $('stat-today'),
  statMinutes: $('stat-minutes'),
  statStreak: $('stat-streak'),
  toast: $('toast'),
}

const { store } = S
const timer = new Timer()
const cat = createCat($('cat'))
let autoStartTimer = null

// ---------- timer <-> sessions ----------

function loadCurrent() {
  const session = S.currentSession()
  timer.load(session ? session.minutes * 60_000 : 0)
  persistTimer()
  render()
}

function persistTimer() {
  store.timer = { ...timer.snapshot(), sessionId: S.currentSession()?.id }
  S.save()
}

function advance() {
  if (store.sessions.length) store.current = (store.current + 1) % store.sessions.length
  loadCurrent()
}

function start() {
  clearTimeout(autoStartTimer)
  if (!S.currentSession()) {
    toast('Add a session first!')
    return
  }
  const fresh = timer.getRemaining() === timer.total
  timer.start()
  persistTimer()
  if (fresh) cat.say(S.currentSession().type === 'focus' ? "let's goooo!" : 'nap time~')
  render()
}

timer.addEventListener('tick', ({ detail }) => {
  const { remaining, total } = detail
  const progress = total ? 1 - remaining / total : 0
  el.time.textContent = formatTime(remaining)
  el.fill.style.width = `${progress * 100}%`
  el.yarn.style.left = `${progress * 100}%`
  el.yarn.style.transform = `translate(-50%, -50%) rotate(${progress * 1440}deg)`
  const session = S.currentSession()
  document.title =
    timer.status === 'running' && session ? `${formatTime(remaining)} · ${session.name}` : 'Purrmodoro'
})

timer.addEventListener('done', () => {
  const session = S.currentSession()
  if (!session) return
  const isLast = store.current >= store.sessions.length - 1

  if (session.type === 'focus') {
    S.recordFocus(session.minutes)
    trackEvent('focus-session-completed')
    cat.celebrate(isLast)
    playChime(isLast)
    if (!isMiniOpen()) fireConfetti(isLast)
    notify('Session done!', `"${session.name}" complete. Kitty is so proud of you!`)
  } else {
    cat.say("break's over! ready?", 3500)
    cat.burst(['sparkle', 'dot'], 8)
    playChime()
    notify('Break over', 'Time to get back to it, you got this!')
  }

  if (isLast) {
    trackEvent('all-sessions-completed')
    if (session.type !== 'focus') cat.celebrate(true)
  }

  advance()
  if (!isLast && store.autoplay) autoStartTimer = setTimeout(start, 4500)
})

// ---------- rendering ----------

function render() {
  const session = S.currentSession()
  const running = timer.status === 'running'

  el.start.textContent = running ? 'Pause' : timer.status === 'paused' ? 'Resume' : 'Start'
  el.start.classList.toggle('running', running)

  if (!session) el.label.textContent = 'Add a session below'
  else if (timer.status === 'paused') el.label.textContent = 'paused · kitty is waiting'
  else el.label.textContent = `${session.name} · ${store.current + 1}/${store.sessions.length}`

  cat.setState(running ? (session.type === 'focus' ? 'working' : 'break') : 'idle')
  el.stage.dataset.type = session?.type ?? 'focus'

  renderList()
  renderStats()
}

function renderList() {
  el.list.innerHTML = ''
  store.sessions.forEach((session, i) => {
    const li = document.createElement('li')
    li.className = `item ${session.type}`
    if (i === store.current) li.classList.add('current')
    if (i < store.current) li.classList.add('done')
    li.dataset.index = i
    li.innerHTML = `
      <button class="item-main" type="button" data-act="select" title="Jump to this session">
        <span class="item-dot"></span>
        <span class="item-name"></span>
        <span class="item-mins">${session.minutes}m</span>
      </button>
      <span class="item-actions">
        <button type="button" data-act="up" title="Move up">▲</button>
        <button type="button" data-act="down" title="Move down">▼</button>
        <button type="button" data-act="remove" title="Remove">✕</button>
      </span>`
    li.querySelector('.item-name').textContent = session.name // textContent = safe from HTML injection
    el.list.appendChild(li)
  })
  if (!store.sessions.length) el.list.innerHTML = '<li class="empty">No sessions yet. Add one above or pick a quick fill.</li>'
}

function renderStats() {
  const today = S.todayStats()
  el.statToday.textContent = today.sessions
  el.statMinutes.textContent = today.minutes
  el.statStreak.textContent = S.streak()
}

// Changing the list may change which session is current; reload the timer only if it did.
function changeSessions(mutate) {
  const before = S.currentSession()?.id
  mutate()
  if (S.currentSession()?.id !== before) {
    clearTimeout(autoStartTimer)
    loadCurrent()
  } else render()
}

// ---------- controls ----------

el.start.addEventListener('click', () => {
  unlockAudio()
  askNotificationPermission()
  playPop()
  if (timer.status === 'running') {
    timer.pause()
    persistTimer()
    render()
  } else start()
})

el.reset.addEventListener('click', () => {
  clearTimeout(autoStartTimer)
  timer.reset()
  persistTimer()
  render()
})

el.skip.addEventListener('click', () => {
  clearTimeout(autoStartTimer)
  advance()
  cat.say('skipped!', 1500)
})

el.list.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-act]')
  if (!button) return
  const index = Number(button.closest('li').dataset.index)
  const act = button.dataset.act
  changeSessions(() => {
    if (act === 'select') store.current = index
    if (act === 'up') S.moveSession(index, -1)
    if (act === 'down') S.moveSession(index, 1)
    if (act === 'remove') S.removeSession(index)
    S.save()
  })
})

el.form.addEventListener('submit', (e) => {
  e.preventDefault()
  const data = new FormData(el.form)
  const minutes = Math.min(240, Math.max(1, Math.round(Number(data.get('minutes')) || 25)))
  changeSessions(() => S.addSession(String(data.get('name')), minutes, data.get('type')))
  el.form.elements.name.value = ''
  cat.say('ooh, added!', 1400)
})

document.querySelectorAll('[data-preset]').forEach((button) =>
  button.addEventListener('click', () => {
    changeSessions(() => S.loadPreset(button.dataset.preset))
    toast(`Loaded ${button.textContent}`)
  }),
)

el.clear.addEventListener('click', () => changeSessions(S.clearSessions))

el.autoplay.checked = store.autoplay
el.autoplay.addEventListener('change', () => {
  store.autoplay = el.autoplay.checked
  S.save()
})

$('cat').addEventListener('click', () => playMew())

// Space bar = start/pause (when not typing)
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.target.closest('input, select, textarea, button')) {
    e.preventDefault()
    el.start.click()
  }
})

// ---------- settings: sound, theme, coat, mini window ----------

const icon = (inner) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`
const BELL = '<path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9z"/><path d="M10.2 20.5a2 2 0 0 0 3.6 0"/>'
const ICONS = {
  bell: icon(BELL),
  bellOff: icon(`${BELL}<path d="M3 3l18 18"/>`),
  moon: icon('<path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.5 6.5 0 0 0 10 10z"/>'),
  sun: icon(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  ),
}

function applyMute() {
  setMuted(store.muted)
  el.mute.innerHTML = store.muted ? ICONS.bellOff : ICONS.bell
}
el.mute.addEventListener('click', () => {
  store.muted = !store.muted
  S.save()
  applyMute()
})

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
function applyTheme() {
  const theme = store.theme ?? (systemDark.matches ? 'dark' : 'light')
  if (store.theme) document.documentElement.dataset.theme = store.theme
  else document.documentElement.removeAttribute('data-theme')
  if (store.theme) syncMini('data-theme', store.theme)
  el.theme.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon
}
el.theme.addEventListener('click', () => {
  const current = store.theme ?? (systemDark.matches ? 'dark' : 'light')
  store.theme = current === 'dark' ? 'light' : 'dark'
  S.save()
  applyTheme()
})
systemDark.addEventListener('change', applyTheme)

function applyCoat() {
  document.documentElement.dataset.coat = store.coat
  syncMini('data-coat', store.coat)
  document.querySelectorAll('[data-coat]').forEach((b) => b.classList.toggle('selected', b.dataset.coat === store.coat))
}
document.querySelectorAll('button[data-coat]').forEach((button) =>
  button.addEventListener('click', () => {
    store.coat = button.dataset.coat
    S.save()
    applyCoat()
    cat.pet()
  }),
)

el.mini.addEventListener('click', async () => {
  if (miniSupported) {
    await toggleMini(el.stage, el.home)
  } else {
    document.body.classList.toggle('compact')
    toast('Tip: in Safari use File → Add to Dock, then make the window tiny', 4500)
  }
})

// ---------- little helpers ----------

let toastTimer = null
function toast(text, ms = 2200) {
  el.toast.textContent = text
  el.toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), ms)
}

function askNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
}

function notify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (!document.hidden && document.hasFocus()) return
  try {
    new Notification(title, { body, icon: '/pwa-192x192.png' })
  } catch {
    // some browsers only allow notifications from a service worker
  }
}

// ---------- boot ----------

applyMute()
applyTheme()
applyCoat()

const saved = store.timer
if (saved && saved.sessionId && saved.sessionId === S.currentSession()?.id) timer.restore(saved)
else loadCurrent()
render()

initAnalytics()
setTimeout(() => cat.say(timer.status === 'running' ? 'welcome back!' : 'hi hi!', 2200), 600)
