/**
 * Terminal App — Bhisan OS
 *
 * SFX FILES (drop these into /public/desktop/media/):
 *   sfx_glitch.mp3   — plays on random glitch events during boot / commands
 *   sfx_keyclick.mp3 — subtle click per keystroke (optional)
 *   sfx_boot.mp3     — plays once when terminal first opens
 */

const TerminalApp = {
    winEl: null,
    output: null,
    inputEl: null,
    history: [],
    historyIdx: -1,
    bootComplete: false,

    // ── SFX ──────────────────────────────────────────────────────────────────
    sfx: {
        glitch: new Audio('/desktop/media/sfx_glitch.mp3'),
        keyclick: new Audio('/desktop/media/sfx_keyclick.mp3'),
        boot: new Audio('/desktop/media/sfx_boot.mp3'),
    },

    playSound(name, volume = 0.6) {
        const snd = this.sfx[name]
        if (!snd) return
        // Clone so it can overlap
        const clone = /** @type {HTMLAudioElement} */ (snd.cloneNode())
        clone.volume = volume
        clone.play().catch(() => { })
    },

    // ── Commands ─────────────────────────────────────────────────────────────
    commands: {
        help() {
            return [
                { text: 'Available commands:', cls: 'bright' },
                { text: '  help       — show this message', cls: '' },
                { text: '  whoami     — who are you?', cls: '' },
                { text: '  ls         — list files', cls: '' },
                { text: '  cat        — read a file (e.g. cat about.txt)', cls: '' },
                { text: '  skills     — list tech stack', cls: '' },
                { text: '  contact    — show contact info', cls: '' },
                { text: '  clear      — clear the terminal', cls: '' },
                { text: '  glitch     — run a glitch test 😈', cls: '' },
            ]
        },
        whoami() {
            return [
                { text: '  Bhisan Heffernan', cls: 'bright' },
                { text: '  Software Developer & 3D Enthusiast', cls: 'green' },
                { text: '  TypeScript · WebGL · Three.js · Blender', cls: 'dim' },
            ]
        },
        ls() {
            return [
                { text: 'drwxr-xr-x  projects/', cls: 'green' },
                { text: 'drwxr-xr-x  assets/', cls: 'green' },
                { text: '-rw-r--r--  about.txt', cls: '' },
                { text: '-rw-r--r--  contact.txt', cls: '' },
                { text: '-rwxr-xr-x  portfolio.glb', cls: 'yellow' },
            ]
        },
        cat(args) {
            const files = {
                'about.txt': [
                    { text: '# About Me', cls: 'bright' },
                    { text: 'I build beautiful things on the web and in 3D.', cls: '' },
                    { text: 'Passionate about creating immersive digital experiences', cls: '' },
                    { text: 'that blur the line between code and art.', cls: '' },
                ],
                'contact.txt': [
                    { text: 'GitHub  : github.com/bhisan', cls: 'green' },
                    { text: 'Email   : bhisan@example.com', cls: 'green' },
                    { text: 'Twitter : @bhisan', cls: 'green' },
                ],
            }
            const filename = args[0]
            if (!filename) return [{ text: 'Usage: cat <filename>', cls: 'red' }]
            return files[filename] || [{ text: `cat: ${filename}: No such file or directory`, cls: 'red' }]
        },
        skills() {
            return [
                { text: '┌────────────────────────────┐', cls: 'dim' },
                { text: '│  TECH STACK                │', cls: 'bright' },
                { text: '├────────────────────────────┤', cls: 'dim' },
                { text: '│  TypeScript  ████████░░  82%│', cls: 'green' },
                { text: '│  Three.js    ███████░░░  74%│', cls: 'green' },
                { text: '│  React       ████████░░  84%│', cls: 'green' },
                { text: '│  Blender     ██████░░░░  62%│', cls: 'yellow' },
                { text: '│  Node.js     ███████░░░  70%│', cls: 'yellow' },
                { text: '│  GSAP        █████████░  90%│', cls: 'green' },
                { text: '└────────────────────────────┘', cls: 'dim' },
            ]
        },
        contact() {
            return TerminalApp.commands.cat(['contact.txt'])
        },
        clear() {
            return '__CLEAR__'
        },
        glitch() {
            return [
                { text: 'INITIATING GLITCH SEQUENCE...', cls: 'red', glitch: true },
                { text: '█▓▒░ CORRUPTED ░▒▓█', cls: 'red', glitch: true },
                { text: '\x1b[ERR] SYSTEM INTEGRITY: 0%', cls: 'red', glitch: true },
                { text: '[RECOVERED]', cls: 'green' },
            ]
        },
    },

    // ── Init ─────────────────────────────────────────────────────────────────
    init(el) {
        this.winEl = el
        this.output = el.querySelector('.term-output')
        this.inputEl = el.querySelector('.term-input')

        this.bindInput()
        this.runBoot()

        document.addEventListener('app-closed', e => {
            if (e.detail.appId === 'terminal') this.destroy()
        })
    },

    // ── Boot sequence ─────────────────────────────────────────────────────────
    async runBoot() {
        this.playSound('boot', 0.5)

        const bootLines = [
            { text: 'Bhisan OS v1.0 — KERNEL BOOT', cls: 'bright', delay: 0 },
            { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', cls: 'dim', delay: 60 },
            { text: '[  OK  ] Mounting virtual filesystems...', cls: 'green', delay: 80 },
            { text: '[  OK  ] Starting session manager...', cls: 'green', delay: 90, glitch: true },
            { text: '[  OK  ] Initialising network interfaces...', cls: 'green', delay: 80 },
            { text: '[ WARN ] GPU memory pressure detected', cls: 'yellow', delay: 60, glitch: true },
            { text: '[  OK  ] Loading portfolio assets...', cls: 'green', delay: 120 },
            { text: '[ INFO ] WebGL context: active', cls: 'dim', delay: 60 },
            { text: '[ INFO ] CSS3D renderer: active', cls: 'dim', delay: 55 },
            { text: '[ INFO ] GSAP animation engine: ready', cls: 'dim', delay: 55 },
            { text: '[  OK  ] bhisan-shell loaded', cls: 'green', delay: 100, glitch: true },
            { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', cls: 'dim', delay: 80 },
            { text: 'Type "help" for available commands.', cls: 'bright', delay: 120 },
            { text: '', cls: '', delay: 50 },
        ]

        for (const line of bootLines) {
            await this.sleep(line.delay)
            this.printLine(line.text, line.cls, line.glitch ?? false)
        }

        this.bootComplete = true
        this.inputEl.focus()
    },

    // ── Input handling ────────────────────────────────────────────────────────
    bindInput() {
        this.inputEl.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const raw = this.inputEl.value.trim()
                this.inputEl.value = ''
                if (raw) {
                    this.history.unshift(raw)
                    this.historyIdx = -1
                    this.printLine(`bhisan@portfolio:~$ ${raw}`, 'prompt')
                    this.runCommand(raw)
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                if (this.historyIdx < this.history.length - 1) {
                    this.historyIdx++
                    this.inputEl.value = this.history[this.historyIdx]
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                if (this.historyIdx > 0) {
                    this.historyIdx--
                    this.inputEl.value = this.history[this.historyIdx]
                } else {
                    this.historyIdx = -1
                    this.inputEl.value = ''
                }
            } else {
                // Key-click SFX (subtle)
                this.playSound('keyclick', 0.3)
            }
        })
    },

    // ── Command runner ────────────────────────────────────────────────────────
    async runCommand(raw) {
        const parts = raw.trim().split(/\s+/)
        const cmd = parts[0].toLowerCase()
        const args = parts.slice(1)

        const fn = this.commands[cmd]
        if (!fn) {
            this.printLine(`bash: ${cmd}: command not found`, 'red')
            this.playSound('glitch', 0.4)
            return
        }

        const result = fn.call(this.commands, args)

        if (result === '__CLEAR__') {
            this.output.innerHTML = ''
            return
        }

        for (const line of (result || [])) {
            await this.sleep(18)
            this.printLine(line.text, line.cls || '', line.glitch ?? false)
        }
    },

    // ── Print helpers ─────────────────────────────────────────────────────────
    printLine(text, cls = '', doGlitch = false) {
        const el = document.createElement('div')
        el.className = `term-line ${cls}`
        el.textContent = text
        this.output.appendChild(el)

        if (doGlitch) {
            this.playSound('glitch', 0.5)
            el.classList.add('glitch')
            // Flash the whole terminal briefly
            const container = this.winEl.querySelector('.app-terminal')
            if (container) {
                container.classList.add('term-flash')
                setTimeout(() => container.classList.remove('term-flash'), 200)
            }
        }

        this.output.scrollTop = this.output.scrollHeight
    },

    sleep(ms) {
        return new Promise(r => setTimeout(r, ms))
    },

    destroy() {
        Object.values(this.sfx).forEach(s => { s.pause(); s.src = '' })
        this.winEl = null
    }
}

document.addEventListener('app-opened', e => {
    if (e.detail.appId === 'terminal') TerminalApp.init(e.detail.el)
})
