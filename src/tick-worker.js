// Runs in a Web Worker. Browsers heavily throttle timers in background tabs,
// but worker timers keep ticking, so the session ends on time.
setInterval(() => postMessage('tick'), 250)
