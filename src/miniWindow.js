// "Mini mode": moves the cat + timer into a tiny window that floats above
// every other app, using the Document Picture-in-Picture API (Chrome & Edge).
// The same DOM elements are moved, so all buttons keep working.

export const miniSupported = 'documentPictureInPicture' in window

let pipWindow = null

export function isMiniOpen() {
  return pipWindow !== null
}

export async function toggleMini(stage, home) {
  if (pipWindow) {
    pipWindow.close()
    return
  }

  pipWindow = await window.documentPictureInPicture.requestWindow({ width: 300, height: 390 })
  const pipDoc = pipWindow.document

  // Copy every stylesheet (and the theme/coat attributes) into the new window
  for (const sheet of document.styleSheets) {
    try {
      const style = pipDoc.createElement('style')
      style.textContent = [...sheet.cssRules].map((r) => r.cssText).join('\n')
      pipDoc.head.appendChild(style)
    } catch {
      // Cross-origin sheets (Google Fonts) can't be read, so link them instead
      const link = pipDoc.createElement('link')
      link.rel = 'stylesheet'
      link.href = sheet.href
      pipDoc.head.appendChild(link)
    }
  }
  for (const attr of ['data-theme', 'data-coat']) {
    const value = document.documentElement.getAttribute(attr)
    if (value) pipDoc.documentElement.setAttribute(attr, value)
  }
  pipDoc.title = 'Purrmodoro'
  pipDoc.body.classList.add('pip')
  pipDoc.body.appendChild(stage)
  document.body.classList.add('mini-open')

  pipWindow.addEventListener('pagehide', () => {
    home.appendChild(stage)
    document.body.classList.remove('mini-open')
    pipWindow = null
  })
}

// Keep the mini window's theme/coat in sync when they change
export function syncMini(attr, value) {
  pipWindow?.document.documentElement.setAttribute(attr, value)
}
