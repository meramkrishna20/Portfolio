const SpotifyApp = {
    audio: new Audio(),
    isPlaying: false,
    currentTrackId: null,
    winEl: null,

    tracks: [
        {
            id: 't1',
            title: 'Victory Anthem',
            artist: 'Khushi x Lashcury',
            src: '/desktop/media/Victory Anthem.mp3',
            duration: '2:37',
            cover: '/desktop/images/victory.jpg'
        },
        {
            id: 't2',
            title: 'Jalai-Malai',
            artist: 'Arthur Gunn',
            src: '/desktop/media/Jalai Malai.mp3',
            duration: '3:20',
            cover: '/desktop/images/jalai.jpg'
        },
        {
            id: 't3',
            title: 'GOAT',
            artist: 'Diljit Singh',
            src: '/desktop/media/GOAT.mp3',
            duration: '3:42',
            cover: '/desktop/images/goat.jpg'
        },

        {
            id: 't4',
            title: 'Nidari-Taral',
            artist: 'Bartika Eam Rai',
            src: '/desktop/media/Nidari.mp3',
            duration: '4:09',
            cover: '/desktop/images/nidari.jpg'
        },
        {
            id: 't5',
            title: 'IDGAF-The Kidd x Sidhu Moosewala',
            artist: 'Sidhu Moosewala x The Kidd',
            src: '/desktop/media/thekidd.mp3',
            duration: '4:36',
            cover: '/desktop/images/thekidd.jpg'
        },
        {
            id: 't6',
            title: 'Jau Ki Basu',
            artist: 'Sabin Rai',
            src: '/desktop/media/Jau Ki Basu.mp3',
            duration: '5:23',
            cover: '/desktop/images/jauki.jpg'
        },
        {
            id: 't7',
            title: 'Ghumtima Naau Hai',
            artist: 'Prem Dhoj Pradhan',
            src: '/desktop/media/ghumtima.mp3',
            duration: '5:23',
            cover: '/desktop/images/ghumtima.jpg'
        },
        {
            id: 't8',
            title: 'Juneli Raatama',
            artist: 'Swoopna Suman',
            src: '/desktop/media/juneli.mp3',
            duration: '5:23',
            cover: '/desktop/images/juneliraat.jpg'
        },
        {
            id: 't9',
            title: 'Asaar',
            artist: 'Bipul Chhetri',
            src: '/desktop/media/asaar.mp3',
            duration: '5:23',
            cover: '/desktop/images/asaar.jpg'
        },
        {
            id: 't10',
            title: 'Flirty Maya',
            artist: 'Neetesh Jung Kunwar',
            src: '/desktop/media/flirtymaya.mp3',
            duration: '5:23',
            cover: '/desktop/images/flirtymaya.jpg'
        },
        {
            id: 't11',
            title: 'Yo Jindagani',
            artist: 'Nepathya',
            src: '/desktop/media/yojindagani.mp3',
            duration: '5:23',
            cover: '/desktop/images/yojindagani.jpg'
        },
        {
            id: 't12',
            title: 'Kaile Vetne Khai',
            artist: 'Almoda',
            src: '/desktop/media/kailevetnekhai.mp3',
            duration: '5:23',
            cover: '/desktop/images/kaile vetne khai.jpg'
        },
        {
            id: 't13',
            title: 'Timro Aakha',
            artist: 'Swoopna Suman',
            src: '/desktop/media/timroakhaa.mp3',
            duration: '5:23',
            cover: '/desktop/images/timroakha.jpg'
        },
        {
            id: 't14',
            title: 'Behos',
            artist: 'Sushant KC',
            src: '/desktop/media/behos.mp3',
            duration: '5:23',
            cover: '/desktop/images/behos.jpg'
        },
        {
            id: 't15',
            title: 'Eklopan-Phsycomusic G Nepal',
            artist: 'Phsycomusic G Nepal',
            src: '/desktop/media/Eklopan.mp3',
            duration: '5:23',
            cover: '/desktop/images/eklopan.jpg'
        },
        {
            id: 't16',
            title: 'Laijanay Ho Ki',
            artist: 'Yankee Yolmo',
            src: '/desktop/media/Laijaney Hoki.mp3',
            duration: '5:23',
            cover: '/desktop/images/laijane hoki.jpg'
        },
        {
            id: 't17',
            title: 'Don\'t Worry',
            artist: 'Sushant KC',
            src: '/desktop/media/dontworry.mp3',
            duration: '5:23',
            cover: '/desktop/images/dontworry.jpg'
        }
    ],

    init(el) {
        this.winEl = el;
        this.renderTracks();
        this.bindEvents();
        if (this.tracks.length > 0) this.selectTrack(this.tracks[0].id, false);
    },

    renderTracks() {
        const list = this.winEl.querySelector('#spotify-tracks');
        list.innerHTML = '';

        this.tracks.forEach((t, i) => {
            const item = document.createElement('div');
            item.className = 's-track';
            item.id = `sp-trk-${t.id}`;
            item.innerHTML = `
                <div class="t-info">
                    <span class="t-num t-num-idx">${i + 1}</span>
                    <img class="t-cover" src="${t.cover}" width="44" height="44" alt="${t.title}">
                    <div class="t-name">
                        <span class="t-title">${t.title}</span>
                        <span class="t-artist">${t.artist}</span>
                    </div>
                </div>
                <span class="t-time">${t.duration}</span>
            `;
            item.onclick = () => this.selectTrack(t.id, true);
            list.appendChild(item);
        });
    },

    bindEvents() {
        const playBtn = this.winEl.querySelector('#sp-play');
        const prevBtn = this.winEl.querySelector('#sp-prev');
        const nextBtn = this.winEl.querySelector('#sp-next');
        const seekSlider = this.winEl.querySelector('#sp-seek');
        const volSlider = this.winEl.querySelector('#sp-vol');

        playBtn.onclick = () => this.togglePlay();
        nextBtn.onclick = () => this.playNext();
        prevBtn.onclick = () => this.playPrev();

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('loadedmetadata', () => {
            const tot = this.winEl.querySelector('#sp-time-tot');
            if (tot) tot.textContent = this.formatTime(this.audio.duration);
        });

        seekSlider.addEventListener('input', e => {
            const time = (e.target.value / 100) * this.audio.duration;
            this.audio.currentTime = time;
        });

        if (volSlider) {
            volSlider.addEventListener('input', e => {
                this.audio.volume = e.target.value / 100;
            });
        }

        document.addEventListener('app-closed', e => {
            if (e.detail.appId === 'spotify') this.destroy();
        });
    },

    selectTrack(id, playImmediate = false) {
        this.currentTrackId = id;
        const track = this.tracks.find(t => t.id === id);
        if (!track) return;

        this.winEl.querySelectorAll('.s-track').forEach(el => {
            el.classList.remove('active');
            el.querySelector('.t-num-idx') && (el.querySelector('.t-num-idx').style.display = '');
        });
        const activeEl = this.winEl.querySelector(`#sp-trk-${id}`);
        if (activeEl) {
            activeEl.classList.add('active');
            const numEl = activeEl.querySelector('.t-num-idx');
            if (numEl) numEl.style.display = 'none';
        }

        const cover = this.winEl.querySelector('#sp-cover');
        const title = this.winEl.querySelector('#sp-title');
        const artist = this.winEl.querySelector('#sp-artist');
        if (cover) cover.src = track.cover;
        if (title) title.textContent = track.title;
        if (artist) artist.textContent = track.artist;

        this.audio.src = track.src;
        this.audio.load();

        playImmediate ? this.play() : this.pause();
    },

    togglePlay() {
        if (!this.currentTrackId && this.tracks.length > 0) {
            this.selectTrack(this.tracks[0].id, false);
        }
        this.isPlaying ? this.pause() : this.play();
    },

    play() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            const icon = this.winEl.querySelector('#sp-play i');
            if (icon) icon.className = 'fa-solid fa-circle-pause';
        }).catch(e => console.warn('Audio play prevented:', e));
    },

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        const icon = this.winEl.querySelector('#sp-play i');
        if (icon) icon.className = 'fa-solid fa-circle-play';
    },

    playNext() {
        if (!this.currentTrackId) return;
        const idx = this.tracks.findIndex(t => t.id === this.currentTrackId);
        this.selectTrack(this.tracks[(idx + 1) % this.tracks.length].id, true);
    },

    playPrev() {
        if (!this.currentTrackId) return;
        const idx = this.tracks.findIndex(t => t.id === this.currentTrackId);
        const prev = (idx - 1 + this.tracks.length) % this.tracks.length;
        this.selectTrack(this.tracks[prev].id, true);
    },

    updateProgress() {
        if (!this.audio.duration) return;
        const pct = (this.audio.currentTime / this.audio.duration) * 100;
        const seek = this.winEl.querySelector('#sp-seek');
        const curEl = this.winEl.querySelector('#sp-time-cur');
        if (seek) seek.value = pct;
        if (curEl) curEl.textContent = this.formatTime(this.audio.currentTime);

        // Update progress bar fill
        if (seek) {
            seek.style.setProperty('--pct', `${pct}%`);
        }
    },

    formatTime(secs) {
        if (isNaN(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    },

    destroy() {
        this.audio.pause();
        this.audio.src = '';
        this.isPlaying = false;
        this.winEl = null;
    }
};

document.addEventListener('app-opened', e => {
    if (e.detail.appId === 'spotify') SpotifyApp.init(e.detail.el);
});
