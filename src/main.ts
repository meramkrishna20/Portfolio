import './style.css'
import Experience from './Experience/Experience'
import sources from './Experience/sources'

// ----- DOM REFS -----
const introUi = document.getElementById('intro-ui')!
const bootLines = document.getElementById('boot-lines')!
const progressSection = document.getElementById('progress-section')!
const progressFill = document.getElementById('progress-fill')!
const progressPct = document.getElementById('progress-pct')!
const progressLabel = document.getElementById('progress-label')!
const pressEnterUi = document.getElementById('press-enter-ui')!
const peFill = document.getElementById('pe-fill')!
const pePct = document.getElementById('pe-pct')!
const peStatus = document.getElementById('pe-status')!
const pePrompt = document.getElementById('pe-prompt')!

// ----- INTRO AUDIO -----
// space.mp3 — ambient during entire intro, stops on enter
const spaceAudio = new Audio('/desktop/media/space.MP3')
spaceAudio.loop = true
spaceAudio.volume = 0.6

// main_loop.MP3 — plays during loading bar, stops when bar hits 100%
const loopAudio = new Audio('/desktop/media/main_loop.MP3')
loopAudio.loop = true
loopAudio.volume = 0.55

// enter.MP3 — plays on dismiss
const enterAudio = new Audio('/desktop/media/enter.MP3')
enterAudio.volume = 0.9

// room.mp3 — ambient loop after enter
const roomAudio = new Audio('/desktop/media/room.MP3')
roomAudio.loop = true
roomAudio.volume = 0.45

// Helper — fade out an audio element over ~400ms
function fadeOut(audio: HTMLAudioElement, cb?: () => void) {
  const orig = audio.volume
  const step = () => {
    if (audio.volume > 0.05) {
      audio.volume = Math.max(0, audio.volume - 0.08)
      setTimeout(step, 40)
    } else {
      audio.pause()
      audio.currentTime = 0
      audio.volume = orig
      cb?.()
    }
  }
  step()
}

// Try autoplay immediately; fall back to first Chrome-valid activation gesture
const tryAutoplay = (audio: HTMLAudioElement) => {
  audio.play()
    .catch(() => {
      const start = () => audio.play().catch(() => { })
      // Chrome activation gestures (pointermove does NOT count)
      document.addEventListener('pointerdown', start, { once: true })
      document.addEventListener('touchstart', start, { once: true, passive: true })
      document.addEventListener('keydown', start, { once: true })
    })
}
tryAutoplay(spaceAudio)
tryAutoplay(loopAudio)

// ----- TERMINAL UTILS -----
function appendInstant(text: string, cls = '') {
  const line = document.createElement('div')
  line.className = `t-line ${cls}`
  line.innerHTML = text
  bootLines.appendChild(line)
  bootLines.scrollTop = bootLines.scrollHeight
}

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

// Beep sound for each typed line in the boot sequence
const beepAudio = new Audio('/desktop/media/beep beep.MP3')
beepAudio.volume = 0.25

async function printLine(text: string, cls = '', speedMs = 16) {
  const line = document.createElement('div')
  line.className = `t-line ${cls}`
  bootLines.appendChild(line)
  bootLines.scrollTop = bootLines.scrollHeight
  // Play a brief beep at the start of each line being typed
  const beep = beepAudio.cloneNode() as HTMLAudioElement
  beep.volume = 0.25
  beep.play().catch(() => { })
  for (let i = 0; i <= text.length; i++) {
    line.innerHTML = text.slice(0, i) + '<span class="caret">█</span>'
    await sleep(speedMs)
  }
  line.innerHTML = text
}

// ----- SECOND TERMINAL PROGRESS -----
// Fills the pe-bar smoothly from current% to target% over durationMs
function animatePeBar(from: number, to: number, durationMs: number): Promise<void> {
  return new Promise(resolve => {
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      const pct = Math.round(from + (to - from) * t)
      peFill.style.width = `${pct}%`
      pePct.textContent = `${pct}%`
      if (t < 1) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
}

// ----- BOOT SEQUENCE -----
// Returns estimated total duration so second terminal can sync its bar
async function runBootSequence(): Promise<void> {
  await sleep(150)
  await printLine('Parrot OS — bhisan@portfolio  [kernel 6.2.0-parrot1]', 'dim', 10)
  appendInstant('────────────────────────────────────────────────────', 'dim')
  await sleep(50)
  await printLine('[  OK  ] Mounting virtual filesystem...', 'ok', 12)
  await sleep(80)
  await printLine('[  OK  ] Starting D-Bus System Message Bus...', 'ok', 12)
  await sleep(60)
  await printLine('[  OK  ] Reached target Graphical Interface.', 'ok', 12)
  await sleep(100)
  await printLine('$ initializing 3D runtime engine...', 'cmd', 14)
  await sleep(80)
  await printLine('[  OK  ] WebGL context established.', 'ok', 12)
  await sleep(60)
  await printLine('[  OK  ] CSS3D renderer online.', 'ok', 12)
  await sleep(80)
  await printLine(`$ loading ${sources.length} asset(s)...`, 'cmd', 14)
  await sleep(60)

  // Mobile warning
  if (window.innerWidth <= 1280 && 'ontouchstart' in window) {
    await sleep(200)
    await printLine('>> WARNING: Mobile device detected', 'warn', 12)
    await printLine('>> Please switch to a Computer for the best experience.', 'warn', 12)
    await sleep(400)
  }

  progressSection.classList.remove('hidden')
  progressLabel.innerHTML = `<span class="prompt-text">→</span> Awaiting assets...`
}

// ----- CLICK-TO-BEGIN HINT -----
const clickHint = document.getElementById('click-hint') as HTMLElement
const clickHintText = document.getElementById('click-hint-text') as HTMLElement
let hintActive = false

window.addEventListener('portfolio-start', async () => {
  hintActive = true
  clickHint.classList.add('visible')

  // Typewriter effect for the hint
  const text = "Click anywhere to begin"
  clickHintText.textContent = ""
  for (let i = 0; i <= text.length; i++) {
    if (!hintActive) break // stop typing if they click early
    clickHintText.textContent = text.slice(0, i)
    await sleep(40)
  }
})

// Move it to the bottom-left universally when ANY interaction happens
window.addEventListener('pointerdown', () => {
  if (!hintActive) return
  hintActive = false
  clickHintText.textContent = "Orbit Mode Active"
  clickHint.classList.add('moved')
}, { once: true })

window.addEventListener('monitor-focus', () => clickHint.classList.add('desktop-hidden'))
window.addEventListener('orbit-return', () => clickHint.classList.remove('desktop-hidden'))

// ----- INIT -----
const canvas = document.querySelector('canvas#webgl') as HTMLCanvasElement
const experience = new Experience(canvas)

// Show second terminal immediately in loading state
pressEnterUi.classList.remove('hidden')
peStatus.textContent = 'Initializing environment...'

// Track completion of both phases
let bootDone = false
let assetsDone = false

// fadeOutLoop — fades main_loop.MP3 when progress bar hits 100% (original behaviour)
function fadeOutLoop() { fadeOut(loopAudio) }

function tryUnlock() {
  if (!bootDone || !assetsDone) return
  // Both done — fill to 100%, fade loop, then reveal Press ENTER
  animatePeBar(85, 100, 600).then(() => {
    fadeOutLoop()
    peStatus.innerHTML = '<span class="ok-bracket">[  OK  ]</span> Environment ready (Lights ON).'
    pePrompt.classList.remove('hidden')
    bootLines.scrollTop = bootLines.scrollHeight
    setupDismiss()
  })
}

// Run boot sequence — fill bar to 75% across its duration (~5s)
animatePeBar(0, 75, 5200).then(() => {
  bootDone = true
  peStatus.textContent = 'Awaiting asset pipeline...'
  tryUnlock()
})

runBootSequence()

// ----- LOADING PROGRESS -----
const total = sources.length
experience.resources.on('progress', (progress: number) => {
  const loaded = Math.round(progress * total)
  const pct = Math.round(progress * 100)
  progressFill.style.width = `${pct}%`
  progressPct.textContent = `${pct}%`
  progressLabel.innerHTML = `<span class="prompt-text">→</span> Loaded: <span class="hl">${loaded}/${total}</span> asset(s)`
})

experience.resources.on('ready', async () => {
  progressSection.classList.add('hidden')
  appendInstant(`[  OK  ] All assets loaded. (${total}/${total})`, 'ok')
  await sleep(150)
  appendInstant('$ compiling scene graph...', 'cmd')
  await sleep(300)
  appendInstant('[  OK  ] Scene ready.', 'ok')
  bootLines.scrollTop = bootLines.scrollHeight

  // Advance pe bar to at least 85% when assets done
  const curPct = parseFloat(peFill.style.width) || 0
  if (curPct < 85) {
    await animatePeBar(curPct, 85, 300)
  }
  assetsDone = true
  tryUnlock()
})

// ----- PRESS-ENTER OVERLAY DISMISS -----
function setupDismiss() {
  const dismiss = (e?: KeyboardEvent) => {
    if (e && e.key !== 'Enter') return

    // Ensure space.mp3 is playing (in case Enter = first interaction)
    spaceAudio.play().catch(() => { })
    // Stop main_loop immediately — don't let it bleed into the room phase
    loopAudio.pause()
    loopAudio.currentTime = 0
    // Play enter SFX
    enterAudio.play().catch(() => { })
    // After a short gap, cross-fade space → room
    setTimeout(() => {
      fadeOut(spaceAudio, () => {
        roomAudio.play().catch(() => { })
      })
    }, 400)

    pressEnterUi.style.opacity = '0'
    pressEnterUi.style.pointerEvents = 'none'
    introUi.style.opacity = '0'
    introUi.style.pointerEvents = 'none'
    introUi.style.transition = 'opacity 0.6s ease'
    setTimeout(() => {
      pressEnterUi.classList.add('hidden')
      introUi.style.display = 'none'
    }, 700)
    window.dispatchEvent(new CustomEvent('portfolio-start'))
    document.removeEventListener('keydown', dismiss)
    pressEnterUi.removeEventListener('click', clickDismiss)
  }
  const clickDismiss = () => dismiss()
  document.addEventListener('keydown', dismiss)
  pressEnterUi.addEventListener('click', clickDismiss)
}

