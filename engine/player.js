/* Live player over a film: audio-locked playback, keyboard, deep links and a presenter window.
   With ?render in the URL there is no player at all: the renderer calls film.render(t) itself. */
(function () {
  const STYLE = `
    html, body { margin:0; height:100%; background:#000; overflow:hidden; }
    .film-fit { position:fixed; left:50%; top:50%; transform-origin:0 0; }
    .film-bar { position:fixed; left:0; right:0; bottom:0; display:flex; gap:12px; align-items:center;
      padding:10px 16px; background:rgba(0,0,0,.72); color:#fff; font:13px/1 "Segoe UI",system-ui,sans-serif;
      transition:opacity .2s; }
    .film-bar.idle { opacity:0; }
    .film-bar button { all:unset; cursor:pointer; padding:4px 8px; }
    .film-bar button:focus-visible { outline:2px solid #fff; }
    .film-track { flex:1; height:14px; cursor:pointer; display:flex; align-items:center; }
    .film-track i { display:block; height:3px; background:#fff; width:0; }
    .film-time { font-variant-numeric:tabular-nums; }
    body.film-presenter { background:#111; color:#eee; font:24px/1.45 "Segoe UI",system-ui,sans-serif; padding:32px; overflow:auto; }
    .film-presenter small { display:block; color:#999; font-size:15px; margin-top:24px; }
    .film-presenter .now { color:#fff; }
    .film-presenter .next { color:#888; }
  `;
  const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const channel = () => ('BroadcastChannel' in window ? new BroadcastChannel('film-player') : null);

  function presenter(timing) {
    document.body.className = 'film-presenter';
    document.body.innerHTML = '<div class="now"></div><small>Next</small><div class="next"></div><small class="clock"></small>';
    const bc = channel();
    if (!bc) return;
    bc.onmessage = ({ data }) => {
      const i = timing.lines.findIndex(l => l.id === data.line);
      document.querySelector('.now').textContent = timing.lines[i]?.text || '';
      document.querySelector('.next').textContent = timing.lines[i + 1]?.text || 'End';
      document.querySelector('.clock').textContent = `${fmt(data.t)} / ${fmt(timing.duration)} ${data.playing ? '' : '(paused)'}`;
    };
    addEventListener('keydown', e => bc.postMessage({ key: e.code }));
  }

  function play(film, { fit, audio: src }) {
    const params = new URLSearchParams(location.search);
    const audio = src ? new Audio(src) : null;
    const lines = film.timing.lines;
    const stopped = new Set();
    let t = 0, playing = false, last = 0, rate = 1;

    const box = document.querySelector(fit);
    box.classList.add('film-fit');
    const resize = () => {
      const k = Math.min(innerWidth / film.width, innerHeight / film.height);
      box.style.transform = `scale(${k}) translate(${-film.width / 2}px,${-film.height / 2}px)`;
    };
    addEventListener('resize', resize);
    resize();

    const bar = document.body.appendChild(document.createElement('div'));
    bar.className = 'film-bar';
    bar.innerHTML = `<button data-do="toggle" aria-label="Play or pause">Play</button>
      <div class="film-track" aria-label="Position"><i></i></div>
      <span class="film-time"></span>
      <button data-do="fast" aria-label="Playback speed">1x</button>
      <button data-do="presenter">Presenter</button>`;
    let idleTimer;
    const wake = () => { bar.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => playing && bar.classList.add('idle'), 2000); };
    addEventListener('mousemove', wake);

    const bc = channel();
    const lineAt = v => {
      let i = 0;
      while (i + 1 < lines.length && lines[i + 1].start <= v) i++;
      return i;
    };
    function draw() {
      film.render(t);
      bar.querySelector('.film-track i').style.width = (t / film.duration * 100) + '%';
      bar.querySelector('.film-time').textContent = `${fmt(t)} / ${fmt(film.duration)}`;
      bar.querySelector('[data-do=toggle]').textContent = playing ? 'Pause' : 'Play';
      bc && bc.postMessage({ line: lines[lineAt(t)]?.id, t, playing });
    }
    function seek(v) {
      t = Math.min(film.duration, Math.max(0, v));
      if (audio) audio.currentTime = t;
      stopped.clear();
      draw();
      if (!playing) history.replaceState(null, '', `#t=${t.toFixed(2)}`);
    }
    function setPlaying(on) {
      playing = on;
      last = performance.now();
      if (audio) { if (on) audio.play().catch(() => {}); else audio.pause(); }
      if (!on) history.replaceState(null, '', `#t=${t.toFixed(2)}`);
      wake();
      draw();
    }
    function tick(now) {
      if (playing) {
        // Audio is the master clock while it plays. The wall clock only covers silence past its end.
        const before = t;
        if (audio && !audio.ended && !audio.paused) t = audio.currentTime;
        else t += (now - last) / 1000 * rate;
        last = now;
        // Lines marked stop:true wait for a keypress, for presenting live. Frames can be far apart
        // in a throttled tab, so this looks at everything passed since the last frame.
        const line = lines.find(l => l.stop && !stopped.has(l.id) && before <= l.end && t >= l.end);
        if (line) {
          stopped.add(line.id);
          t = line.end;
          if (audio) audio.currentTime = t;
          setPlaying(false);
        }
        if (t >= film.duration) { t = film.duration; setPlaying(false); }
        draw();
      }
      requestAnimationFrame(tick);
    }
    const act = {
      toggle: () => setPlaying(!playing),
      fast() {
        rate = rate === 1 ? 2 : 1;
        if (audio) audio.playbackRate = rate;
        bar.querySelector('[data-do=fast]').textContent = rate + 'x';
      },
      presenter: () => window.open(`${location.pathname}?presenter`, 'film-presenter', 'width=720,height=520'),
      next: () => seek(lines[Math.min(lineAt(t) + 1, lines.length - 1)].start),
      back() {
        const i = lineAt(t);
        seek(t - lines[i].start > 1 ? lines[i].start : lines[Math.max(i - 1, 0)].start);
      },
    };
    const keys = { Space: 'toggle', ArrowRight: 'next', ArrowLeft: 'back', KeyF: 'fast', KeyP: 'presenter' };
    const press = code => {
      if (keys[code]) act[keys[code]]();
      else if (code === 'KeyM' && audio) audio.muted = !audio.muted;
      else if (code === 'Home') seek(0);
    };
    addEventListener('keydown', e => {
      if (!keys[e.code] && e.code !== 'KeyM' && e.code !== 'Home') return;
      e.preventDefault();
      press(e.code);
    });
    bc && (bc.onmessage = ({ data }) => data.key && press(data.key));
    bar.addEventListener('click', e => {
      const d = e.target.closest('[data-do]');
      if (d) act[d.dataset.do]();
      else if (e.target.closest('.film-track')) {
        const r = bar.querySelector('.film-track').getBoundingClientRect();
        seek((e.clientX - r.left) / r.width * film.duration);
      }
    });
    if (audio) audio.addEventListener('ended', () => { t = Math.max(t, audio.duration); });

    const hash = location.hash.match(/t=([\d.]+)/);
    if (params.get('line')) {
      const l = lines.find(x => x.id === params.get('line'));
      if (l) t = l.start;
    }
    if (hash) t = +hash[1];
    if (audio) audio.currentTime = t;
    draw();
    wake();
    requestAnimationFrame(tick);
  }

  /* One call from a film page: render mode, presenter window, or the normal player. */
  window.FilmPlayer = {
    start(buildFilm, opts) {
      const params = new URLSearchParams(location.search);
      if (params.has('presenter')) {
        const style = document.head.appendChild(document.createElement('style'));
        style.textContent = STYLE;
        return presenter(opts.timing);
      }
      const film = buildFilm();
      window.__film = film;
      if (params.has('render')) {
        document.documentElement.style.background = '#000';
        return film;
      }
      const style = document.head.appendChild(document.createElement('style'));
      style.textContent = STYLE;
      play(film, opts);
      return film;
    },
  };
})();
