// The cat! An SVG drawing whose parts are animated by styles/cat.css.
// States (set as data-state on the root): idle | working | break
// Extra moods layered on top (classes): is-celebrating, is-petting

const CAT_SVG = /* html */ `
<svg class="cat-svg" viewBox="0 0 200 200" aria-hidden="true">
  <defs>
    <clipPath id="cat-head-clip"><ellipse cx="100" cy="88" rx="52" ry="44" /></clipPath>
    <clipPath id="cat-body-clip"><ellipse cx="100" cy="150" rx="48" ry="38" /></clipPath>
  </defs>

  <ellipse class="cushion" cx="100" cy="187" rx="74" ry="12" />
  <ellipse class="cat-shadow" cx="100" cy="187" rx="46" ry="6" />

  <g class="cat">
    <g class="tail">
      <path class="tail-line" d="M136 170 C 182 168, 192 124, 170 100" />
      <path class="tail-fill" d="M136 170 C 182 168, 192 124, 170 100" />
    </g>

    <ellipse class="fur" cx="100" cy="150" rx="48" ry="38" />
    <g clip-path="url(#cat-body-clip)"><circle class="patch patch-dark" cx="140" cy="146" r="24" /></g>
    <ellipse class="belly" cx="100" cy="160" rx="28" ry="23" />
    <ellipse class="fur paw" cx="80" cy="184" rx="13" ry="8" />
    <ellipse class="fur paw" cx="120" cy="184" rx="13" ry="8" />
    <path class="collar" d="M62 131 Q100 150 138 131" />
    <circle class="bell" cx="100" cy="143" r="5.5" />

    <g class="cat-head">
      <g class="ear ear-l">
        <path class="fur" d="M54 76 L60 30 L94 56 Z" />
        <path class="ear-in" d="M63 65 L65 43 L82 56 Z" />
      </g>
      <g class="ear ear-r">
        <path class="fur" d="M146 76 L140 30 L106 56 Z" />
        <path class="ear-in" d="M137 65 L135 43 L118 56 Z" />
      </g>

      <ellipse class="fur" cx="100" cy="88" rx="52" ry="44" />
      <g clip-path="url(#cat-head-clip)"><circle class="patch patch-orange" cx="66" cy="58" r="28" /></g>
      <g class="stripes">
        <path d="M89 50 Q90.5 56 92 61" />
        <path d="M100 47 L100 59" />
        <path d="M111 50 Q109.5 56 108 61" />
      </g>
      <ellipse class="muzzle" cx="100" cy="106" rx="20" ry="13" />

      <g class="eyes eyes-open">
        <ellipse class="eye" cx="78" cy="88" rx="7.5" ry="9.5" />
        <ellipse class="eye" cx="122" cy="88" rx="7.5" ry="9.5" />
        <circle class="shine" cx="80.8" cy="84.4" r="2.8" />
        <circle class="shine" cx="124.8" cy="84.4" r="2.8" />
        <circle class="shine" cx="75.6" cy="92" r="1.3" />
        <circle class="shine" cx="119.6" cy="92" r="1.3" />
      </g>
      <g class="eyes eyes-happy">
        <path d="M70 91 Q78 79 86 91" />
        <path d="M114 91 Q122 79 130 91" />
      </g>
      <g class="eyes eyes-sleep">
        <path d="M70 88 Q78 96 86 88" />
        <path d="M114 88 Q122 96 130 88" />
      </g>

      <ellipse class="blush" cx="63" cy="104" rx="9" ry="5.5" />
      <ellipse class="blush" cx="137" cy="104" rx="9" ry="5.5" />
      <path class="nose" d="M95 98 Q100 96 105 98 L100 103.5 Z" />
      <path class="mouth" d="M92 108 Q96 113 100 107 Q104 113 108 108" />
      <path class="mouth-open" d="M93 108 Q100 123 107 108 Z" />
      <g class="whiskers">
        <path d="M52 99 L30 95" /><path d="M52 105 L30 107" />
        <path d="M148 99 L170 95" /><path d="M148 105 L170 107" />
      </g>
    </g>
  </g>
</svg>`

const CHEERS = [
  'you got this!',
  'so focused~',
  'proud of u 💗',
  'meow! (keep going)',
  '*happy tail swish*',
  'one paw at a time',
  'ur doing amazing',
  'focus mode: ON 😼',
]

const pick = (list) => list[Math.floor(Math.random() * list.length)]

export function createCat(root) {
  root.innerHTML = `
    <div class="bubble"></div>
    <div class="zzz"><span>z</span><span>z</span><span>Z</span></div>
    ${CAT_SVG}
    <div class="fx"></div>`

  const bubble = root.querySelector('.bubble')
  const fx = root.querySelector('.fx')
  let bubbleTimer = null
  let moodTimer = null

  function setState(state) {
    root.dataset.state = state
  }

  function say(text, ms = 2600) {
    bubble.textContent = text
    bubble.classList.remove('show')
    void bubble.offsetWidth // restart the pop-in animation
    bubble.classList.add('show')
    clearTimeout(bubbleTimer)
    bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms)
  }

  // Little emoji particles that float up from the cat
  function burst(emojis, count) {
    const doc = root.ownerDocument // may be the mini window's document
    for (let i = 0; i < count; i++) {
      const el = doc.createElement('span')
      el.className = 'particle'
      el.textContent = pick(emojis)
      el.style.setProperty('--x', `${(Math.random() - 0.5) * 220}px`)
      el.style.setProperty('--y', `${-90 - Math.random() * 110}px`)
      el.style.setProperty('--r', `${(Math.random() - 0.5) * 80}deg`)
      el.style.setProperty('--s', `${0.8 + Math.random() * 0.7}`)
      el.style.animationDelay = `${Math.random() * 400}ms`
      el.addEventListener('animationend', () => el.remove())
      fx.appendChild(el)
    }
  }

  function mood(className, ms) {
    root.classList.remove('is-petting', 'is-celebrating')
    void root.offsetWidth
    root.classList.add(className)
    clearTimeout(moodTimer)
    moodTimer = setTimeout(() => root.classList.remove(className), ms)
  }

  function celebrate(big = false) {
    mood('is-celebrating', big ? 5200 : 4000)
    say(big ? 'ALL DONE!!! 🏆' : pick(['YAY!! 🎉', 'u did it!!!', 'best human ever!', 'WOOHOO 💖']), 3600)
    burst(['💖', '💗', '✨', '⭐', '🐾', '🎉'], big ? 28 : 18)
  }

  function pet() {
    if (root.classList.contains('is-celebrating')) return
    mood('is-petting', 900)
    say(pick(['purrr~', 'mrrp!', 'hehe 💕', 'more pets pls']), 1600)
    burst(['💕', '💗'], 3)
  }

  root.addEventListener('click', pet)

  // Occasional encouragement while you're working
  setInterval(() => {
    if (root.dataset.state === 'working' && !root.classList.contains('is-celebrating')) say(pick(CHEERS))
  }, 75_000)

  return { setState, say, celebrate, pet, burst }
}
