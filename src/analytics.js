// Anonymous usage counting with GoatCounter (https://www.goatcounter.com).
// No cookies and no personal data. It only counts visits and a few events.
//
// 1. Sign up at goatcounter.com and pick a code (e.g. "purrmodoro")
// 2. Put that code below, commit, push. Done!

const GOATCOUNTER_CODE = 'paimanh' // <-- your code here, e.g. 'purrmodoro'

export function initAnalytics() {
  if (!GOATCOUNTER_CODE) return
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://gc.zgo.at/count.js'
  script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`
  document.head.appendChild(script)
}

// Shows up in your dashboard as e.g. "focus-session-completed"
export function trackEvent(name) {
  window.goatcounter?.count?.({ path: name, title: name, event: true })
}
// Counts each browser once, the first time it opens the app
export function trackFirstVisit() {
  try {
    if (localStorage.getItem('purrmodoro:counted')) return
  } catch {
    return
  }
  // count.js loads asynchronously, so wait until it's ready (give up after ~15s)
  let tries = 0
  const send = () => {
    if (window.goatcounter?.count) {
      trackEvent('new-user')
      localStorage.setItem('purrmodoro:counted', 'yes') // only mark after we actually sent it
    } else if (++tries < 30) {
      setTimeout(send, 500)
    }
  }
  setTimeout(send, 500)
}