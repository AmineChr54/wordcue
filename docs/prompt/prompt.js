/* Prompt helper. Every choice lives in `state`, which fills the page, the prompt and the shareable link.
   Each topic is in one of three modes: choose, decide (the agent decides) or ask (the agent asks). */

const LOOKS = [
  { id: 'plate', name: 'Engineering plate', cls: 'look-plate', sample: 'Fig. 1', desc: 'Fine ink lines, serif captions, figures drawn slowly.' },
  { id: 'beam', name: 'Light in the dark', cls: 'look-beam', sample: '<span>THE WORD</span>', desc: 'Black stage, with type revealed by a moving light.' },
  { id: 'paper', name: 'Cut paper', cls: 'look-paper', sample: '<span>Hello!</span>', desc: 'Bright flat shapes with hard shadows and a bounce.' },
  { id: 'type', name: 'Heavy type', cls: 'look-type', sample: 'NOW.', desc: 'Huge words on one strong colour, with hard cuts.' },
  { id: 'poster', name: 'Duotone poster', cls: 'look-poster', sample: 'LOUD', desc: 'Two inks, condensed poster type, big claims.' },
  { id: 'grid', name: 'Precise chart', cls: 'look-grid', sample: '+36 %', desc: 'A true scale on a fine grid, where position means value.' },
  { id: 'news', name: 'Newspaper page', cls: 'look-news', sample: 'The Headline', desc: 'Columns, rules and serif headlines that set themselves.' },
  { id: 'terminal', name: 'Terminal', cls: 'look-mono', sample: '<span>$ run</span>', desc: 'Monospace on a dark screen, typed as if live.' },
  { id: 'swiss', name: 'Swiss poster', cls: 'look-swiss', sample: '3→1', desc: 'One red, tight grotesque, ruthless alignment.' },
];

const MOTIONS = [
  { id: 'word', name: 'Word-cued reveal', cls: 'm-word', sample: '<i>on</i><i>each</i><i>word</i>', desc: 'Text appears as each word is spoken.' },
  { id: 'push', name: 'Camera push', cls: 'm-push', sample: '<span>Focus</span>', desc: 'The camera moves in on what matters.' },
  { id: 'line', name: 'Line drawn', cls: 'm-line', sample: '', desc: 'Connections and diagrams draw themselves.' },
  { id: 'count', name: 'Count-up', cls: 'm-count', sample: '<span></span>', desc: 'A figure counts up to its value on its word.' },
  { id: 'travel', name: 'Data travelling', cls: 'm-travel', sample: '<span></span>', desc: 'An entry moves from one place to another.' },
  { id: 'cuts', name: 'Hard cuts', cls: 'm-cuts', sample: 'CUT', desc: 'Sharp changes of colour or scene on a word.' },
  { id: 'pop', name: 'Bouncy pop', cls: 'm-pop', sample: '<span>Pop!</span>', desc: 'Things land with an overshoot.' },
  { id: 'light', name: 'Moving light or mask', cls: 'm-light', sample: '<span>SEEN</span>', desc: 'A moving shape decides what can be seen.' },
  { id: 'typewriter', name: 'Typewriter', cls: 'm-type', sample: '<span>typed live...</span>', desc: 'Text types itself, with its space reserved.' },
  { id: 'cursor', name: 'Cursor and click', cls: 'm-click', sample: '<b></b><i></i>', desc: 'A cursor acts in a staged product interface.' },
];

const HOOKS = [
  { id: 'moment', name: 'A concrete moment', ex: '“It’s 6 a.m., and the last ferry hasn’t left.”' },
  { id: 'number', name: 'A surprising number', ex: '“Forty minutes. That’s how long one form takes.”' },
  { id: 'question', name: 'A question they’re already asking', ex: '“Why does this always break on a Friday?”' },
  { id: 'demo', name: 'The result first', ex: 'Show the finished thing working, then explain.' },
];

const STRUCTURES = [
  { id: 'turn', name: 'Problem, turn, solution', ex: 'Show the pain, rewind, replay it with your idea.' },
  { id: 'walk', name: 'Step by step', ex: 'Follow one thing through the whole process.' },
  { id: 'layers', name: 'Layer by layer', ex: 'Start with the whole, then open it up.' },
  { id: 'myth', name: 'Belief, then evidence', ex: 'State what people assume, then show what happens.' },
  { id: 'qa', name: 'One question, one answer', ex: 'Everything serves a single answer. Good for Shorts.' },
];

const TYPES = [
  { id: 'explainer', name: 'Narrated explainer', recipe: 'video-explainer', status: 'Used for real', desc: 'YouTube, product or teaching film. MP4 and HTML.' },
  { id: 'short', name: 'Vertical Short', recipe: 'short', status: 'Example only', desc: 'Under about 60 s, for people scrolling.' },
  { id: 'pitch', name: 'Pitch', recipe: 'pitch', status: 'Not yet run', desc: 'Win a room. HTML, with an MP4 backup.' },
  { id: 'demo', name: 'Live demo', recipe: 'live-demo', status: 'Not yet run', desc: 'You present by keypress. HTML.' },
  { id: 'explorer', name: 'System explorer', recipe: 'tech-explorer', status: 'Not yet run', desc: 'People explore at their own pace. Not a video.' },
];

const LENGTHS = ['20 seconds', '45 seconds', '90 seconds', '3 minutes', '5 minutes'];
const USES = [
  { id: 'personal', name: 'Personal or internal' },
  { id: 'public', name: 'Public, not monetised' },
  { id: 'money', name: 'Client or monetised' },
];
const STARTERS = {
  about: ['How our booking tool saves a clinic an hour a day', 'Why bridges have gaps', 'How a request travels through our system'],
  audience: ['New customers who have never seen the product', 'Decision-makers with five minutes', 'Junior developers joining the team'],
  takeaway: ['This saves an hour a day', 'The gap is there for a reason', 'Every request passes through one gateway'],
};

const VOICES = window.VOICES.voices.filter(v => v.connected);
const FRESH = () => ({
  about: '', audience: '', takeaway: '', lang: 'en', use: 'public', sources: '', research: false, estimates: false,
  brand: '', lookNote: '', motionNote: '', storyNote: '', type: 'explainer', length: '45 seconds', hook: '', structure: '',
  look: '', motion: [], voice: '',
  modes: { purpose: 'choose', story: 'decide', facts: 'choose', look: 'decide', motion: 'decide', voice: 'decide', format: 'choose' },
});
let state = FRESH();

const TOPICS = [
  { id: 'purpose', title: 'Purpose and audience', why: 'Everything else follows from who’s watching and the one thing they should remember.', render: renderPurpose },
  { id: 'format', title: 'Format and length', why: 'This picks the recipe. Shorter films are easier to make great.', render: renderFormat },
  { id: 'story', title: 'Story', why: 'The opening and the shape decide whether people keep watching.', render: renderStory },
  { id: 'facts', title: 'Facts and sources', why: 'A film is only as honest as what it’s allowed to say. Give it real material.', render: renderFacts },
  { id: 'look', title: 'Look', why: 'These are sparks, not templates. The agent makes a new look from whichever you pick.', render: renderLook },
  { id: 'motion', title: 'Motion', why: 'Motion should show what happens. Pick the moves that fit. They’re timed to spoken words.', render: renderMotion },
  { id: 'voice', title: 'Voice', why: 'Press play to hear them. All of them are AI voices that run on your own computer.', render: renderVoice },
];

const $ = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const langName = l => (l === 'de' ? 'German' : 'English');

/* ---------- Rendering ---------- */

function field(key, label, hint, area = false) {
  const wrap = $(`<label class="field">${esc(label)}<small>${esc(hint)}</small></label>`);
  const box = document.createElement(area ? 'textarea' : 'input');
  if (!area) box.type = 'text';
  box.value = state[key];
  box.addEventListener('input', () => { state[key] = box.value; update(); });
  wrap.appendChild(box);
  if (STARTERS[key]) {
    const row = $('<div class="starters"></div>');
    STARTERS[key].forEach(text => {
      const b = $(`<button type="button">${esc(text)}</button>`);
      b.addEventListener('click', () => { state[key] = box.value = text; update(); });
      row.appendChild(b);
    });
    wrap.appendChild(row);
  }
  return wrap;
}

function option(o, on, click, tile = '') {
  const b = $(`<button type="button" class="opt" aria-pressed="${on}">${tile}<span class="text"><b>${esc(o.name)}</b><small>${esc(o.desc || o.ex || '')}</small>${o.status ? `<em>Tested: ${esc(o.status)}</em>` : ''}</span></button>`);
  b.addEventListener('click', click);
  return b;
}

function choiceRow(list, key, cls = 'list') {
  const box = $(`<div class="${cls}"></div>`);
  list.forEach(o => box.appendChild(option(o, state[key] === o.id, () => { state[key] = state[key] === o.id ? '' : o.id; draw(); })));
  return box;
}

function renderPurpose(el) {
  el.append(field('about', 'What is the film about?', 'One sentence is enough.'),
    field('audience', 'Who is watching?', 'Be specific, including what they already know.'),
    field('takeaway', 'What should they remember?', 'Just one thing.'));
  el.appendChild($('<div class="subhead">Language</div>'));
  const row = $('<div class="modes"></div>');
  ['en', 'de'].forEach(l => {
    const b = $(`<button type="button" aria-pressed="${state.lang === l}">${langName(l)}</button>`);
    b.addEventListener('click', () => { state.lang = l; if (state.voice && !state.voice.startsWith(`${l}:`)) state.voice = ''; draw(); });
    row.appendChild(b);
  });
  el.appendChild(row);
  el.appendChild($('<div class="subhead">Where will it be used?</div>'));
  const use = $('<div class="modes"></div>');
  USES.forEach(u => {
    const b = $(`<button type="button" aria-pressed="${state.use === u.id}">${esc(u.name)}</button>`);
    b.addEventListener('click', () => { state.use = u.id; draw(); });
    use.appendChild(b);
  });
  el.appendChild(use);
}

function renderFormat(el) {
  const grid = $('<div class="grid"></div>');
  TYPES.forEach(t => grid.appendChild(option(t, state.type === t.id, () => { state.type = t.id; draw(); })));
  el.appendChild(grid);
  el.appendChild($('<div class="subhead">Length</div>'));
  const row = $('<div class="modes"></div>');
  LENGTHS.forEach(l => {
    const b = $(`<button type="button" aria-pressed="${state.length === l}">${l}</button>`);
    b.addEventListener('click', () => { state.length = l; draw(); });
    row.appendChild(b);
  });
  el.appendChild(row);
}

function renderStory(el) {
  el.appendChild($('<div class="subhead">How it opens</div>'));
  el.appendChild(choiceRow(HOOKS, 'hook', 'grid'));
  el.appendChild($('<div class="subhead">Its shape</div>'));
  el.appendChild(choiceRow(STRUCTURES, 'structure', 'grid'));
  el.appendChild($('<div style="height:14px"></div>'));
  el.appendChild(field('storyNote', 'Anything specific?', 'A scene, a person or a line you want in it.'));
}

function renderFacts(el) {
  el.appendChild(field('sources', 'Your material', 'File paths, links or facts. The film uses only what you allow.', true));
  [['research', 'The agent may also research public sources, and cite them'], ['estimates', 'Some of my figures are estimates, so the film must say so']].forEach(([key, text]) => {
    const l = $(`<label style="display:flex;gap:9px;margin-bottom:6px"><input type="checkbox" ${state[key] ? 'checked' : ''}> <span>${esc(text)}</span></label>`);
    l.querySelector('input').addEventListener('change', e => { state[key] = e.target.checked; update(); });
    el.appendChild(l);
  });
}

function renderLook(el) {
  const grid = $('<div class="grid"></div>');
  LOOKS.forEach(o => grid.appendChild(option(o, state.look === o.id, () => { state.look = state.look === o.id ? '' : o.id; draw(); }, `<span class="tile ${o.cls}">${o.sample}</span>`)));
  el.appendChild(grid);
  el.appendChild($('<div style="height:14px"></div>'));
  el.append(field('brand', 'Do you have a brand or deck to follow?', 'Name it or give a path. This replaces the sparks above.'),
    field('lookNote', 'Or describe the world it belongs to', 'For example: a harbour chart, a chemist’s label, a ship’s log.'));
}

function renderMotion(el) {
  const grid = $('<div class="grid"></div>');
  MOTIONS.forEach(o => {
    const on = state.motion.includes(o.id);
    grid.appendChild(option(o, on, () => {
      state.motion = on ? state.motion.filter(x => x !== o.id) : [...state.motion, o.id];
      draw();
    }, `<span class="tile motion ${o.cls}">${o.sample}</span>`));
  });
  el.appendChild(grid);
  el.appendChild($('<div style="height:14px"></div>'));
  el.appendChild(field('motionNote', 'Anything else?', 'For example: no zooms, or the camera never stops moving.'));
}

const audio = new Audio();
let playingVoice = null;
function renderVoice(el) {
  const grid = $('<div class="voice-pick"></div>');
  VOICES.filter(v => v.lang === state.lang).forEach(v => {
    const id = `${v.lang}:${v.engine}:${v.voice}`;
    const row = $(`<div class="voice" data-on="${state.voice === id}">
      <button type="button" class="play" aria-label="Hear ${esc(v.name)}">${playingVoice === id ? '❚❚' : '▶'}</button>
      <button type="button" class="pick" aria-pressed="${state.voice === id}"><b>${esc(v.name)}</b>${v.default ? ' · default' : ''}<small>${esc(v.engineName)}</small></button>
    </div>`);
    row.querySelector('.play').addEventListener('click', () => {
      if (playingVoice === id) { audio.pause(); playingVoice = null; } else {
        audio.src = `../voices/${v.long || v.short}`;
        audio.play();
        playingVoice = id;
      }
      draw();
    });
    row.querySelector('.pick').addEventListener('click', () => { state.voice = state.voice === id ? '' : id; draw(); });
    grid.appendChild(row);
  });
  el.appendChild(grid);
}
audio.addEventListener('ended', () => { playingVoice = null; draw(); });

function draw() {
  const root = document.getElementById('topics');
  const scroll = window.scrollY;
  const controls = () => [...root.querySelectorAll('button, input, textarea')];
  const focusAt = controls().indexOf(document.activeElement);
  root.innerHTML = '';
  TOPICS.forEach(topic => {
    const mode = state.modes[topic.id];
    const sec = $(`<section class="topic" id="t-${topic.id}"><div class="topic-head"><h2>${esc(topic.title)}</h2></div><p class="why">${esc(topic.why)}</p></section>`);
    const modes = $('<div class="modes" role="group" aria-label="How to handle this topic"></div>');
    [['choose', 'I’ll choose'], ['decide', 'Let the agent decide'], ['ask', 'Ask me about this']].forEach(([m, label]) => {
      const b = $(`<button type="button" class="${m}" aria-pressed="${mode === m}">${label}</button>`);
      b.addEventListener('click', () => { state.modes[topic.id] = m; draw(); });
      modes.appendChild(b);
    });
    sec.appendChild(modes);
    const body = document.createElement('div');
    if (mode === 'choose') topic.render(body);
    else if (mode === 'ask') body.appendChild($(`<p class="asknote">The agent will ask you about ${esc(topic.title.toLowerCase())} before starting, with 2-3 recommendations and its top pick marked.</p>`));
    else body.appendChild($(`<p class="decidenote">The agent will decide this, and tell you what it chose and why.</p>`));
    sec.appendChild(body);
    root.appendChild(sec);
  });
  window.scrollTo(0, scroll);
  /* Redrawing replaces the buttons, so keyboard focus goes back to the same position. */
  if (focusAt >= 0) controls()[focusAt]?.focus({ preventScroll: true });
  update();
}

/* ---------- The prompt ---------- */

const find = (list, id) => list.find(o => o.id === id);
const voiceOf = id => VOICES.find(v => `${v.lang}:${v.engine}:${v.voice}` === id);

function buildPrompt() {
  const m = state.modes, type = find(TYPES, state.type);
  const lines = ['Use the presentation-director skill to make this.', ''];
  const brief = [], decide = [], ask = [];
  const route = t => (m[t] === 'ask' ? ask : m[t] === 'decide' ? decide : brief);

  if (m.purpose === 'choose') {
    if (state.about) brief.push(`About: ${state.about}`);
    if (state.audience) brief.push(`Audience: ${state.audience}`);
    if (state.takeaway) brief.push(`The one thing to remember: ${state.takeaway}`);
    brief.push(`Language: ${langName(state.lang)}`);
    brief.push(`Use: ${find(USES, state.use).name}`);
  } else route('purpose').push('Purpose, audience and the one takeaway');

  if (m.format === 'choose') {
    brief.push(`Format: ${type.name} (recipe: ${type.recipe})`);
    brief.push(`Length: about ${state.length}`);
  } else route('format').push('Format and length');

  if (m.story === 'choose') {
    const hook = find(HOOKS, state.hook), shape = find(STRUCTURES, state.structure);
    if (hook) brief.push(`Opening: ${hook.name}. In the spirit of: ${hook.ex}`);
    if (shape) brief.push(`Story shape: ${shape.name}. ${shape.ex}`);
    if (state.storyNote) brief.push(`Story note: ${state.storyNote}`);
    if (!hook) decide.push('How it opens');
    if (!shape) decide.push('The story shape');
  } else route('story').push('The story: how it opens and its shape');

  if (m.facts === 'choose') {
    brief.push(state.sources ? `Sources: ${state.sources}` : 'Sources: none yet. Ask me for material before writing any claims.');
    brief.push(state.research ? 'You may also research public sources. Cite them, and show sources on screen.' : 'Use only the facts I provide. Don’t invent any.');
    if (state.estimates) brief.push('Some figures are estimates. Say so out loud and on screen.');
  } else if (m.facts === 'decide') {
    decide.push('Which public sources to use. Cite them, and don’t invent facts');
  } else ask.push('Facts and sources: what the film may say');

  if (m.look === 'choose') {
    if (state.brand) brief.push(`Look: follow this brand or deck: ${state.brand}`);
    const look = find(LOOKS, state.look);
    if (look) brief.push(`Look direction, as a spark rather than a template: ${look.name}. ${look.desc} Make it new for this project.`);
    if (state.lookNote) brief.push(`The world the look belongs to: ${state.lookNote}`);
    if (!state.brand && !look && !state.lookNote) decide.push('The look');
  } else route('look').push('The look');

  if (m.motion === 'choose') {
    const moves = state.motion.map(id => find(MOTIONS, id).name);
    if (moves.length) brief.push(`Motion to use where it fits: ${moves.join(', ')}. Time it to spoken words.`);
    if (state.motionNote) brief.push(`Motion note: ${state.motionNote}`);
    if (!moves.length && !state.motionNote) decide.push('The motion');
  } else route('motion').push('The motion');

  if (m.voice === 'choose') {
    const v = voiceOf(state.voice);
    if (v) brief.push(`Voice: ${v.name} in ${langName(v.lang)} (${v.engineName}).`);
    else decide.push('The voice');
  } else route('voice').push('The voice');

  if (state.use === 'money' && m.purpose === 'choose') brief.push('Check the voice licence for client or monetised use, and tell me what it requires.');

  if (brief.length) lines.push('## Brief', ...brief.map(x => `- ${x}`), '');
  if (ask.length) {
    lines.push('## Ask me about', 'Before starting, ask me about each of these together. Give 2-3 recommendations for each, with your top pick marked.', ...ask.map(x => `- ${x}`), '');
  }
  if (decide.length) lines.push('## Decide yourself', 'Decide these without asking, and tell me what you chose and why.', ...decide.map(x => `- ${x}`), '');
  return lines.join('\n').trim();
}

function buildTips() {
  const tips = [], m = state.modes, type = find(TYPES, state.type);
  if (m.purpose === 'choose') {
    if (!state.about) tips.push(['warn', 'Say what the film is about. Nothing else helps without it.']);
    if (!state.audience) tips.push(['warn', 'Name the audience, or press Ask me about this.']);
    if (!state.takeaway) tips.push(['warn', 'Pick the one thing to remember. Good films have exactly one.']);
  }
  if (m.facts === 'choose' && !state.sources && !state.research) tips.push(['warn', 'No sources yet. The agent will stop and ask, because it won’t invent facts.']);
  if (m.format === 'choose') {
    tips.push(['info', `Route: the ${type.recipe} recipe. Tested: ${type.status.toLowerCase()}.`]);
    if (type.id === 'short' && !['20 seconds', '45 seconds'].includes(state.length)) tips.push(['warn', 'A Short should stay under about 60 seconds.']);
    if (['3 minutes', '5 minutes'].includes(state.length)) tips.push(['warn', 'Nothing this long has been made yet, so expect to find problems at this length.']);
    if (type.status === 'Not yet run') tips.push(['warn', 'This type hasn’t been run yet, so expect a few rough edges.']);
  }
  const v = voiceOf(state.voice);
  if (m.voice === 'choose' && v) {
    if (v.voice === 'jean' && state.use === 'money') tips.push(['warn', 'Jean is non-commercial only. Choose another voice for this use.']);
    else if (v.engine === 'qwen') tips.push(['info', `${v.name} is slow to generate: 5-9x slower than real time.`]);
  }
  if (state.use === 'money') tips.push(['info', 'Client or monetised: check the voice licence, and whether you must disclose the AI voice.']);
  return tips;
}

function update() {
  document.getElementById('prompt').textContent = buildPrompt();
  document.getElementById('tips').innerHTML = buildTips().map(([k, t]) => `<li class="${k}">${esc(t)}</li>`).join('');
  try { history.replaceState(null, '', `#${encodeURIComponent(JSON.stringify(state))}`); } catch { /* A sandboxed page may refuse this. */ }
}

async function copyText(text, button, done) {
  try { await navigator.clipboard.writeText(text); } catch {
    const area = document.body.appendChild(document.createElement('textarea'));
    area.value = text; area.select(); document.execCommand('copy'); area.remove();
  }
  const was = button.textContent;
  button.textContent = done;
  setTimeout(() => { button.textContent = was; }, 1400);
}

document.getElementById('copy').addEventListener('click', e => copyText(buildPrompt(), e.target, 'Copied'));
document.getElementById('share').addEventListener('click', e => copyText(location.href, e.target, 'Link copied'));
document.getElementById('reset').addEventListener('click', () => { state = FRESH(); draw(); window.scrollTo(0, 0); });

/* A shared link restores the choices. Only known keys are taken, because the link can come from anyone. */
try {
  const raw = decodeURIComponent(location.hash.slice(1));
  if (raw) {
    const saved = JSON.parse(raw), base = FRESH();
    Object.keys(base).forEach(k => {
      if (k === 'modes') Object.keys(base.modes).forEach(t => { if (['choose', 'decide', 'ask'].includes(saved.modes?.[t])) state.modes[t] = saved.modes[t]; });
      else if (Array.isArray(base[k]) && Array.isArray(saved[k])) state[k] = saved[k].filter(x => typeof x === 'string' && find(MOTIONS, x));
      else if (typeof saved[k] === typeof base[k]) state[k] = saved[k];
    });
    if (!find(TYPES, state.type)) state.type = base.type;
    if (!find(USES, state.use)) state.use = base.use;
    if (!['en', 'de'].includes(state.lang)) state.lang = base.lang;
  }
} catch { /* A broken link just starts fresh. */ }
draw();
