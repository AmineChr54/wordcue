/* Only one sound plays at a time on this page. */
const sounds = new Set();
function solo(current) {
  sounds.forEach(s => { if (s !== current && !s.paused) s.pause(); });
}
const clean = w => w.toLowerCase().replace(/[^a-z]/g, '');

/* Hero: a silent loop until asked, or a switch to the interactive player. */
{
  const video = document.getElementById('hero-video');
  const frame = document.getElementById('hero-frame');
  const sound = document.getElementById('hero-sound');
  const toVideo = document.getElementById('show-video');
  const toPlayer = document.getElementById('show-player');
  sounds.add(video);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(() => {});
  const label = () => {
    sound.textContent = !video.muted && !video.paused ? '❚❚ Pause' : '▶ Play with sound';
  };
  sound.addEventListener('click', () => {
    if (video.muted || video.paused) {
      if (video.muted) { video.muted = false; video.loop = false; video.currentTime = 0; }
      solo(video);
      video.play();
    } else video.pause();
    label();
  });
  ['play', 'pause', 'ended'].forEach(e => video.addEventListener(e, label));
  function show(interactive) {
    toVideo.setAttribute('aria-pressed', !interactive);
    toPlayer.setAttribute('aria-pressed', interactive);
    frame.hidden = !interactive;
    video.hidden = interactive;
    sound.hidden = interactive;
    if (interactive) {
      video.pause();
      frame.src = 'films/sentence/film.html';
    } else frame.removeAttribute('src');
  }
  toVideo.addEventListener('click', () => show(false));
  toPlayer.addEventListener('click', () => show(true));
}

/* Three looks play in step, from one clock. Only the first carries the sound. */
{
  const videos = [...document.querySelectorAll('.triptych video')];
  const button = document.getElementById('looks-play');
  const lead = videos[0];
  videos.forEach((v, i) => { v.muted = i !== 0; sounds.add(v); });
  const playing = () => !lead.paused && !lead.ended;
  const label = () => { button.textContent = playing() ? '❚❚ Pause' : '▶ Play all three'; };
  function start() {
    solo(lead);
    if (lead.ended || lead.currentTime === 0) videos.forEach(v => { v.currentTime = 0; });
    videos.forEach(v => v.play());
  }
  button.addEventListener('click', () => { playing() ? videos.forEach(v => v.pause()) : start(); });
  videos.forEach(v => v.addEventListener('click', () => { playing() ? videos.forEach(x => x.pause()) : start(); }));
  lead.addEventListener('play', label);
  lead.addEventListener('pause', () => { videos.slice(1).forEach(v => v.pause()); label(); });
  lead.addEventListener('ended', label);
  /* Keep the others on the lead's clock if a browser lets them drift. */
  lead.addEventListener('timeupdate', () => {
    videos.slice(1).forEach(v => { if (Math.abs(v.currentTime - lead.currentTime) > .15) v.currentTime = lead.currentTime; });
  });
}

/* The word cue demo. Word times come from the recordings, through the same voice step films use. */
{
  const data = window.CUES;
  const audio = new Audio();
  sounds.add(audio);
  const said = document.getElementById('said');
  const rail = document.getElementById('rail');
  const head = document.getElementById('head');
  const pins = document.getElementById('pins');
  const beam = document.getElementById('sc-beam');
  const lamp = document.getElementById('sc-lamp');
  const ship = document.getElementById('sc-ship');
  const play = document.getElementById('cue-play');
  const buttons = { a: document.getElementById('v-a'), b: document.getElementById('v-b') };
  const CUES = [['turns', 'The lamp turns on “turns”'], ['beam', 'The beam starts on “beam”'], ['ship', 'The ship lights on “ship”']];
  const SCALE_END = Math.max(data.a.duration, data.b.duration);
  const blocks = [];
  let current = 'a', raf = 0;

  for (let i = 0; i < data.b.words.length; i++) blocks.push(rail.appendChild(document.createElement('i')));

  const timeOf = (v, word) => data[v].words.find(w => clean(w.w).startsWith(word)).start;

  function draw(t) {
    const v = data[current];
    [...said.children].forEach((s, i) => s.classList.toggle('spoken', t >= v.words[i].start));
    head.style.left = `${Math.min(100, t / SCALE_END * 100)}%`;
    const turn = t - timeOf(current, 'turns');
    lamp.style.transform = `rotate(${turn > 0 ? Math.min(turn * 720, 360) : 0}deg)`;
    /* The beam reaches the ship exactly when the word "ship" is said. */
    const reach = (t - timeOf(current, 'beam')) / (timeOf(current, 'ship') - timeOf(current, 'beam'));
    const from = lamp.getBoundingClientRect(), to = ship.getBoundingClientRect();
    const dx = to.left + to.width / 2 - from.left - from.width / 2;
    const dy = to.top + to.height / 2 - from.top - from.height / 2;
    beam.style.width = `${Math.hypot(dx, dy)}px`;
    beam.style.transform = `rotate(${Math.atan2(dy, dx)}rad) scaleX(${Math.max(0, Math.min(1, reach))})`;
    ship.classList.toggle('found', t >= timeOf(current, 'ship'));
  }

  function select(v) {
    audio.pause();
    current = v;
    audio.src = data[v].audio;
    Object.entries(buttons).forEach(([k, b]) => b.setAttribute('aria-pressed', k === v));
    said.innerHTML = '';
    data[v].words.forEach(w => {
      const s = said.appendChild(document.createElement('span'));
      s.textContent = `${w.w} `;
    });
    blocks.forEach((b, i) => {
      const w = data[v].words[i];
      b.style.display = w ? 'block' : 'none';
      if (!w) return;
      b.style.left = `${w.start / SCALE_END * 100}%`;
      b.style.width = `${Math.max(.6, (w.end - w.start) / SCALE_END * 100)}%`;
      b.classList.toggle('cue', CUES.some(([c]) => clean(w.w).startsWith(c)));
    });
    pins.innerHTML = CUES.map(([c, note]) => `<li>${note} <b>${timeOf(v, c).toFixed(2)} s</b></li>`).join('');
    draw(data[v].duration);
    play.textContent = '▶ Play';
  }

  function tick() {
    draw(audio.currentTime);
    if (!audio.paused && !audio.ended) raf = requestAnimationFrame(tick);
  }
  play.addEventListener('click', () => {
    if (audio.paused) {
      solo(audio);
      if (audio.ended) audio.currentTime = 0;
      audio.play();
    } else audio.pause();
  });
  audio.addEventListener('play', () => { play.textContent = '❚❚ Pause'; cancelAnimationFrame(raf); tick(); });
  audio.addEventListener('pause', () => { play.textContent = '▶ Play'; });
  audio.addEventListener('ended', () => { play.textContent = '▶ Play again'; draw(data[current].duration); });
  buttons.a.addEventListener('click', () => select('a'));
  buttons.b.addEventListener('click', () => select('b'));
  select('a');
}

/* The voice wall shows connected voices, with the full list a click away. */
{
  const wall = document.getElementById('wall');
  const audio = new Audio();
  sounds.add(audio);
  const buttons = { de: document.getElementById('l-de'), en: document.getElementById('l-en') };
  let live = null;
  const stop = () => { if (live) live.classList.remove('on'); live = null; };
  function show(lang) {
    audio.pause();
    stop();
    Object.entries(buttons).forEach(([k, b]) => b.setAttribute('aria-pressed', k === lang));
    wall.innerHTML = '';
    window.VOICES.voices.filter(v => v.lang === lang && v.connected).forEach(v => {
      const b = wall.appendChild(document.createElement('button'));
      b.type = 'button';
      b.innerHTML = `<span></span><small></small>`;
      b.firstChild.textContent = v.name;
      b.lastChild.textContent = v.engineName;
      b.setAttribute('aria-label', `Play ${v.name}, ${v.engineName}`);
      b.addEventListener('click', () => {
        if (live === b && !audio.paused) { audio.pause(); return; }
        stop();
        live = b;
        b.classList.add('on');
        audio.src = `voices/${v.long || v.short}`;
        solo(audio);
        audio.play();
      });
    });
  }
  audio.addEventListener('ended', stop);
  audio.addEventListener('pause', stop);
  buttons.de.addEventListener('click', () => show('de'));
  buttons.en.addEventListener('click', () => show('en'));
  show('de');
}
