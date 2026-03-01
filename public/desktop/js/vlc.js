const VlcApp = {
    video: null,
    winEl: null,

    init(el) {
        this.winEl = el;
        this.video = el.querySelector('#vlc-vid');

        // Lazy load the video source so it doesn't freeze the initial website load 
        if (!this.video.src || this.video.src === '') {
            this.video.src = '/desktop/media/demo_video.mp4';
        }

        this.bindEvents();
    },

    bindEvents() {
        const playBtn = this.winEl.querySelector('#vlc-play');
        const stopBtn = this.winEl.querySelector('#vlc-stop');
        const fsBtn = this.winEl.querySelector('#vlc-fullscreen');
        const seekSlider = this.winEl.querySelector('#vlc-seek');

        playBtn.onclick = () => this.togglePlay();

        stopBtn.onclick = () => {
            this.video.pause();
            this.video.currentTime = 0;
        };

        fsBtn.onclick = () => {
            if (this.video.requestFullscreen) {
                this.video.requestFullscreen();
            } else if (this.video.webkitRequestFullscreen) {
                this.video.webkitRequestFullscreen();
            }
        };

        this.video.addEventListener('timeupdate', () => this.updateProgress());
        this.video.addEventListener('click', () => this.togglePlay());
        this.video.addEventListener('play', () => {
            playBtn.querySelector('i').className = 'fa-solid fa-pause';
        });
        this.video.addEventListener('pause', () => {
            playBtn.querySelector('i').className = 'fa-solid fa-play';
        });

        seekSlider.addEventListener('input', (e) => {
            if (!this.video.duration) return;
            const time = (e.target.value / 100) * this.video.duration;
            this.video.currentTime = time;
        });

        // Cleanup on OS close
        document.addEventListener('app-closed', (e) => {
            if (e.detail.appId === 'vlc') {
                this.video.pause();
                this.video.src = '';
            }
        });
    },

    togglePlay() {
        if (this.video.paused) {
            this.video.play().catch(e => console.warn("Video play prevented:", e));
        } else {
            this.video.pause();
        }
    },

    updateProgress() {
        if (!this.video.duration) return;
        const pct = (this.video.currentTime / this.video.duration) * 100;
        this.winEl.querySelector('#vlc-seek').value = pct;

        const cur = this.formatTime(this.video.currentTime);
        const tot = this.formatTime(this.video.duration);
        this.winEl.querySelector('#vlc-time').textContent = `${cur} / ${tot}`;
    },

    formatTime(secs) {
        if (isNaN(secs)) return '00:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    }
};

// Listen for OS injecting the app
document.addEventListener('app-opened', (e) => {
    if (e.detail.appId === 'vlc') {
        VlcApp.init(e.detail.el);
    }
});
