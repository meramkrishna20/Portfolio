const OS = {
    windows: new Map(),
    zIndexCounter: 100,
    isPoweredOff: false,

    init() {
        this.startClock();

        // Start menu toggle
        document.getElementById('start-btn').addEventListener('click', () => {
            this.toggleStart();
        });

        // Power-on via Space key when off
        document.addEventListener('keydown', e => {
            if (this.isPoweredOff && e.code === 'Space') this.powerOn();
        });

        // Close start menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
                document.getElementById('start-menu').classList.add('hidden');
            }
        });
    },

    startClock() {
        const clockEl = document.getElementById('clock');
        setInterval(() => {
            const now = new Date();
            let h = now.getHours();
            let m = now.getMinutes();
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            m = m < 10 ? '0' + m : m;
            clockEl.textContent = `${h}:${m} ${ampm}`;
        }, 1000);
    },

    toggleStart() {
        const sm = document.getElementById('start-menu');
        sm.classList.toggle('hidden');
    },

    powerOff() {
        this.isPoweredOff = true;
        // Close all apps
        [...this.windows.keys()].forEach(id => this.closeApp(id));
        document.getElementById('start-menu').classList.add('hidden');
        const pw = document.getElementById('power-screen');
        pw.classList.remove('hidden');
        pw.style.animation = 'none';
        pw.offsetHeight; // reflow
        pw.style.animation = '';

        // Re-wire power button to turn back on
        document.getElementById('power-btn').onclick = () => this.powerOn();
    },

    powerOn() {
        this.isPoweredOff = false;
        const pw = document.getElementById('power-screen');
        pw.style.transition = 'opacity 0.4s';
        pw.style.opacity = '0';
        setTimeout(() => {
            pw.classList.add('hidden');
            pw.style.opacity = '';
            pw.style.transition = '';
        }, 400);
        // Re-wire power button to turn off
        document.getElementById('power-btn').onclick = () => this.powerOff();
    },

    openApp(appId) {
        // If already open, just focus it
        if (this.windows.has(appId)) {
            const win = this.windows.get(appId);
            if (win.el.style.display === 'none') {
                win.el.style.display = 'flex'; // Restore if minimized
            }
            this.focusWindow(appId);
            return;
        }

        // Create new window
        const tpl = document.getElementById(`tpl-${appId}`);
        if (!tpl) { console.error(`Template not found: tpl-${appId}`); return; }

        const content = tpl.innerHTML;
        const titles = {
            'cv': 'Portfolio.pdf',
            'spotify': 'Spotify',
            'vlc': 'VLC Media Player',
            'terminal': 'bhisan@portfolio:~'
        };

        const winEl = document.createElement('div');
        winEl.className = 'os-window maximized';
        winEl.id = `win-${appId}`;

        // Store per-app floating sizes for when user un-maximizes
        const floatSizes = {
            spotify: { w: '1060px', h: '720px' },
            vlc: { w: '900px', h: '600px' },
            cv: { w: '1000px', h: '680px' }, // Made CV larger for the new premium layout
            terminal: { w: '820px', h: '560px' },
        };
        const fs = floatSizes[appId] || { w: '800px', h: '600px' };
        winEl.dataset.floatW = fs.w;
        winEl.dataset.floatH = fs.h;

        winEl.innerHTML = `
      <div class="win-titlebar">
        <div class="win-title"><i class="fa-solid fa-cube"></i> ${titles[appId] || 'App'}</div>
        <div class="win-controls">
          <button class="win-btn w-min" onclick="OS.minimizeApp('${appId}')"></button>
          <button class="win-btn w-max" onclick="OS.maximizeApp('${appId}')"></button>
          <button class="win-btn w-close" onclick="OS.closeApp('${appId}')"></button>
        </div>
      </div>
      <div class="win-content">
        ${content}
      </div>
    `;

        document.getElementById('window-area').appendChild(winEl);

        const winObj = { el: winEl, isMaximized: true };
        this.windows.set(appId, winObj);

        this.makeDraggable(winEl, winEl.querySelector('.win-titlebar'));

        // Bring to front on click
        winEl.addEventListener('mousedown', () => this.focusWindow(appId));

        // Add to taskbar
        this.addTaskbarItem(appId, titles[appId]);

        this.focusWindow(appId);

        // Dispatch custom event so app scripts can initialize
        document.dispatchEvent(new CustomEvent('app-opened', { detail: { appId, el: winEl } }));

        // Wire big play button for Spotify
        if (appId === 'spotify') {
            const bigPlay = winEl.querySelector('#sp-big-play');
            if (bigPlay) bigPlay.onclick = () => SpotifyApp.togglePlay();
        }

        // Wire Portfolio/CV Sidebar Navigation
        if (appId === 'cv') {
            const navBtns = winEl.querySelectorAll('.p-nav-btn');
            const sections = winEl.querySelectorAll('.port-section');

            navBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active nav button
                    navBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Show target section, hide others
                    const targetId = btn.dataset.target;
                    sections.forEach(sec => {
                        if (sec.id === targetId) {
                            sec.classList.add('active');
                        } else {
                            sec.classList.remove('active');
                        }
                    });
                });
            });
        }
    },

    focusWindow(appId) {
        const win = this.windows.get(appId);
        if (!win) return;
        this.zIndexCounter++;
        win.el.style.zIndex = this.zIndexCounter;

        // Update taskbar UI
        document.querySelectorAll('.t-app-btn').forEach(btn => btn.classList.remove('active'));
        const tbBtn = document.getElementById(`tb-${appId}`);
        if (tbBtn) tbBtn.classList.add('active');
    },

    closeApp(appId) {
        const win = this.windows.get(appId);
        if (!win) return;

        win.el.remove();
        this.windows.delete(appId);

        const tbBtn = document.getElementById(`tb-${appId}`);
        if (tbBtn) tbBtn.remove();

        // Dispatch event to stop audio/video
        document.dispatchEvent(new CustomEvent('app-closed', { detail: { appId } }));
    },

    maximizeApp(appId) {
        const win = this.windows.get(appId);
        if (!win) return;
        win.isMaximized = !win.isMaximized;
        if (win.isMaximized) {
            // Save current floating position/size before maximizing
            win.prevStyle = {
                width: win.el.style.width,
                height: win.el.style.height,
                top: win.el.style.top,
                left: win.el.style.left,
            };
            win.el.style.width = win.el.style.height = win.el.style.top = win.el.style.left = '';
            win.el.classList.add('maximized');
        } else {
            win.el.classList.remove('maximized');
            // Restore to the per-app floating size, centered
            const fw = win.el.dataset.floatW || '800px';
            const fh = win.el.dataset.floatH || '600px';
            win.el.style.width = fw;
            win.el.style.height = fh;
            win.el.style.top = '40px';
            win.el.style.left = '60px';
        }
    },

    minimizeApp(appId) {
        const win = this.windows.get(appId);
        if (!win) return;
        win.el.style.display = 'none';
        const tbBtn = document.getElementById(`tb-${appId}`);
        if (tbBtn) tbBtn.classList.remove('active');
    },

    addTaskbarItem(appId, title) {
        const tbApps = document.getElementById('taskbar-apps');
        const btn = document.createElement('div');
        btn.className = 't-app-btn shadow active';
        btn.id = `tb-${appId}`;

        let icon = 'fa-cube';
        if (appId === 'spotify') icon = 'fa-spotify fa-brands';
        if (appId === 'vlc') icon = 'fa-film';
        if (appId === 'cv') icon = 'fa-file-pdf';

        btn.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${title}</span>`;

        btn.onclick = () => {
            const win = this.windows.get(appId);
            if (win.el.style.display === 'none') {
                win.el.style.display = 'flex';
                this.focusWindow(appId);
            } else {
                if (win.el.style.zIndex == this.zIndexCounter) {
                    this.minimizeApp(appId); // Toggle minimize if it's currently focused
                } else {
                    this.focusWindow(appId);
                }
            }
        };
        tbApps.appendChild(btn);
    },

    makeDraggable(elmnt, header) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // Skip if clicking a window button
            if (e.target.classList.contains('win-btn')) return;

            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();

            const winData = OS.windows.get(elmnt.id.replace('win-', ''));
            if (winData && winData.isMaximized) return; // Can't drag maximized

            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            elmnt.style.top = Math.max(0, (elmnt.offsetTop - pos2)) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    OS.init();
});

// Inter-process Communication: Broadcast mouse movements to parent
// This allows the 3D scene (World.ts) to calculate parallax even when the mouse is over the iframe OS
window.addEventListener('mousemove', (e) => {
    window.parent.postMessage({
        type: 'os-mousemove',
        normX: (e.clientX / window.innerWidth) * 2 - 1,
        normY: -(e.clientY / window.innerHeight) * 2 + 1
    }, '*');
});
