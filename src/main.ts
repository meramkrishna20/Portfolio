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

// Try autoplay for both; fall back to mousemove (fires before dismiss click)
const tryAutoplay = (audio: HTMLAudioElement) => {
  audio.play()
    .catch(() => {
      const start = () => audio.play().catch(() => { })
      document.addEventListener('mousemove', start, { once: true })
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

async function printLine(text: string, cls = '', speedMs = 16) {
  const line = document.createElement('div')
  line.className = `t-line ${cls}`
  bootLines.appendChild(line)
  bootLines.scrollTop = bootLines.scrollHeight
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
  progressSection.classList.remove('hidden')
  progressLabel.innerHTML = `<span class="prompt-text">→</span> Awaiting assets...`
}

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

    // Stop space.mp3, play enter.mp3, then start room.mp3
    enterAudio.play().catch(() => { })
    fadeOut(spaceAudio, () => {
      roomAudio.play().catch(() => { })
    })

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

