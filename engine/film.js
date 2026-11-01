/* Declarative steps compile to one timeline. render(t) is a pure function of t, so the
   live player and the frame-by-frame MP4 renderer draw exactly the same picture. */
(function () {
  const EASE = {
    move: [.45, .05, .25, 1],
    out: [.16, 1, .3, 1],
    in: [.6, 0, .9, .3],
    linear: null,
  };
  const css = name => {
    const b = EASE[name];
    if (name in EASE) return b ? `cubic-bezier(${b.join(',')})` : 'linear';
    return name || css('out');
  };

  function bezier([x1, y1, x2, y2]) {
    const at = (a, b, s) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
    return x => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let lo = 0, hi = 1, s = x;
      for (let i = 0; i < 24; i++) {
        const v = at(x1, x2, s);
        if (Math.abs(v - x) < 1e-5) break;
        if (v < x) lo = s; else hi = s;
        s = (lo + hi) / 2;
      }
      return at(y1, y2, s);
    };
  }
  const easeFn = name => {
    const b = EASE[name];
    return b ? bezier(b) : (p => Math.min(1, Math.max(0, p)));
  };
  const clamp01 = v => Math.min(1, Math.max(0, v));

  const norm = s => s.toLowerCase().replace(/ß/g, 'ss').replace(/[^\p{L}\p{N}]/gu, '');

  /* Anchors: 12.5 | "line" | "line.end" | "line:Wort" | "line:Wort#2" | "line:Wort.end", each with
     an optional +0.4 or -0.1 suffix. "+0.4" alone is relative to the previous step. */
  function resolver(timing) {
    const lines = new Map(timing.lines.map(l => [l.id, l]));
    let prev = 0;
    return function at(anchor) {
      if (typeof anchor === 'number') return prev = anchor;
      const rel = anchor.match(/^\+([\d.]+)$/);
      if (rel) return prev = prev + parseFloat(rel[1]);
      const m = anchor.match(/^([\w-]+)(?::([^#.+\-\s]+)(?:#(\d+))?)?(\.end)?([+-][\d.]+)?$/);
      if (!m) throw new Error(`Bad anchor "${anchor}"`);
      const [, id, word, nth, end, off] = m;
      const line = lines.get(id);
      if (!line) throw new Error(`Anchor "${anchor}": no line "${id}"`);
      let t;
      if (word) {
        const wanted = norm(word);
        const hits = line.words.filter(w => norm(w.w).startsWith(wanted));
        const hit = hits[(nth ? +nth : 1) - 1];
        if (!hit) throw new Error(`Anchor "${anchor}": the line no longer says "${word}". It says: ${line.say}`);
        t = end ? hit.end : hit.start;
      } else t = end ? line.end : line.start;
      return prev = t + (off ? parseFloat(off) : 0);
    };
  }

  const each = (sel, root) => {
    if (sel instanceof Element) return [sel];
    const found = [...root.querySelectorAll(sel)];
    if (!found.length) throw new Error(`Selector "${sel}" matches nothing`);
    return found;
  };

  function propsOf(kf) {
    const skip = new Set(['offset', 'easing', 'composite']);
    const frames = Array.isArray(kf) ? kf : [kf];
    return [...new Set(frames.flatMap(f => Object.keys(f)))].filter(k => !skip.has(k));
  }

  function create({ stage, world, timing, steps, width = 1600, height = 900, cursor, reduced = false }) {
    const root = typeof stage === 'string' ? document.querySelector(stage) : stage;
    const camEl = typeof world === 'string' ? document.querySelector(world) : world;
    const at = resolver(timing);
    const owned = [];
    const anims = [];   // {a, start}
    const fns = [];     // pure per-frame writers
    const states = [];  // {t, el, cls, on, text}
    const animated = new WeakMap();
    let end = timing.duration || 0;

    const camKeys = [{ t: 0, x: width / 2, y: height / 2, z: 1, dur: 0, ease: 'move' }];
    const cursorKeys = [];
    const cursorOffs = [];
    const ripples = [];

    camEl.style.transformOrigin = '0 0';
    camEl.style.transform = 'none';

    const centre = (el, aim = .5) => {
      const w = camEl.getBoundingClientRect(), r = el.getBoundingClientRect();
      const k = camEl.offsetWidth ? w.width / camEl.offsetWidth : 1;
      return { x: (r.left - w.left + r.width * aim) / k, y: (r.top - w.top + r.height / 2) / k, w: r.width / k };
    };

    for (const s of steps) {
      const t = at(s.at);
      if (s.anim) {
        const dur = s.dur ?? .5;
        const kf = s.kf;
        each(s.anim, root).forEach((el, i) => {
          const start = t + (s.stagger || 0) * i;
          // Only the first animation of a property holds its start value before it begins.
          // A later one must not override what came before it until its own time arrives.
          const seen = animated.get(el) || new Set();
          const props = propsOf(kf);
          const first = props.some(p => !seen.has(p));
          props.forEach(p => seen.add(p));
          animated.set(el, seen);
          const a = el.animate(kf, { duration: dur * 1000, easing: css(s.ease), fill: first ? 'both' : 'forwards' });
          a.pause();
          owned.push(a);
          anims.push({ a, start });
          end = Math.max(end, start + dur);
        });
      } else if (s.set) {
        each(s.set, root).forEach(el => states.push({ t, el, cls: s.cls, on: s.on !== false, text: s.text }));
      } else if (s.type) {
        const [el] = each(s.type, root);
        const text = s.text ?? el.textContent;
        el.textContent = '';
        const shown = el.appendChild(document.createElement('span'));
        const rest = el.appendChild(document.createElement('span'));
        rest.style.visibility = 'hidden';
        rest.textContent = text; // Keeps the final layout from the start, so nothing reflows while typing.
        const dur = s.dur ?? text.length * .045;
        let last = -1;
        fns.push(now => {
          const n = Math.round(clamp01((now - t) / dur) * text.length);
          if (n === last) return;
          last = n;
          shown.textContent = text.slice(0, n);
          rest.textContent = text.slice(n);
        });
        end = Math.max(end, t + dur);
      } else if (s.count) {
        const [el] = each(s.count, root);
        const dur = s.dur ?? .8, ease = easeFn(s.ease || 'out');
        const fmt = s.fmt || (v => String(Math.round(v)));
        fns.push(now => {
          if (now < t && s.hold !== true) { el.textContent = fmt(s.from ?? 0); return; }
          el.textContent = fmt((s.from ?? 0) + ((s.to ?? 0) - (s.from ?? 0)) * ease((now - t) / dur));
        });
      } else if (s.camera !== undefined) {
        const f = s.focus ? centre(each(s.focus, root)[0]) : null;
        camKeys.push({
          t, dur: reduced ? 0 : (s.dur ?? .65), ease: s.ease || 'move', z: s.zoom ?? 1,
          x: s.x ?? (f ? f.x : width / 2), y: s.y ?? (f ? f.y : height / 2),
        });
      } else if (s.cursor) {
        // The cursor arrives at the anchor, so a click lands exactly on the spoken word.
        const target = centre(each(s.cursor, root)[0], .3);
        const aim = target.w > 240 ? target : centre(each(s.cursor, root)[0]);
        const from = cursorKeys.length ? cursorKeys[cursorKeys.length - 1] : { x: width * .7, y: height * .8 };
        const dist = Math.hypot(aim.x - from.x, aim.y - from.y);
        const dur = s.dur ?? Math.min(1.3, Math.max(.55, (450 + dist * .85) / 1000));
        cursorKeys.push({ start: t - dur, t, x: aim.x, y: aim.y, fromX: from.x, fromY: from.y });
        if (s.click) ripples.push({ t, x: aim.x, y: aim.y });
      } else if (s.cursorOff) {
        cursorOffs.push(t);
      } else if (s.fn) {
        const dur = s.dur ?? 1, ease = easeFn(s.ease || 'linear');
        fns.push(now => s.fn(ease((now - t) / dur), now - t));
        end = Math.max(end, t + dur);
      } else {
        throw new Error(`Step does nothing: ${JSON.stringify(s)}`);
      }
    }

    states.sort((a, b) => a.t - b.t);
    camKeys.sort((a, b) => a.t - b.t);
    for (let i = 1; i < camKeys.length; i++) camKeys[i].ease = easeFn(camKeys[i].ease);

    function cameraAt(now) {
      let i = 0;
      while (i + 1 < camKeys.length && camKeys[i + 1].t <= now) i++;
      const k = camKeys[i], prev = camKeys[i - 1];
      if (!prev || !k.dur || now >= k.t + k.dur) return k;
      const p = k.ease((now - k.t) / k.dur);
      // Zoom is multiplicative, so it interpolates in log space to look even throughout.
      return {
        x: prev.x + (k.x - prev.x) * p,
        y: prev.y + (k.y - prev.y) * p,
        z: Math.exp(Math.log(prev.z) + (Math.log(k.z) - Math.log(prev.z)) * p),
      };
    }

    const cursorEl = cursor ? (typeof cursor === 'string' ? root.querySelector(cursor) : cursor) : null;
    const rippleEls = ripples.map(r => {
      const el = camEl.appendChild(document.createElement('i'));
      el.className = 'film-ripple';
      el.style.left = r.x + 'px';
      el.style.top = r.y + 'px';
      return el;
    });
    const moveEase = easeFn('move');

    function drawCursor(now) {
      if (!cursorEl) return;
      if (!cursorKeys.length || now < cursorKeys[0].start) { cursorEl.style.opacity = 0; return; }
      let i = 0;
      while (i + 1 < cursorKeys.length && cursorKeys[i + 1].start <= now) i++;
      const k = cursorKeys[i], p = moveEase((now - k.start) / (k.t - k.start));
      const x = k.fromX + (k.x - k.fromX) * p, y = k.fromY + (k.y - k.fromY) * p;
      cursorEl.style.opacity = cursorOffs.some(o => o <= now && o > k.t) ? 0 : 1;
      cursorEl.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`;
    }

    function drawStates(now) {
      const seen = new Map();
      for (const s of states) {
        const key = s.cls ?? '#text';
        if (!seen.has(s.el)) seen.set(s.el, new Map());
        const slots = seen.get(s.el);
        if (s.t <= now) slots.set(key, s);
        else if (!slots.has(key)) slots.set(key, { ...s, on: !s.on, text: s.el.dataset.filmText, off: true });
      }
      seen.forEach((slots, el) => slots.forEach((s, key) => {
        if (key === '#text') {
          if (el.dataset.filmText === undefined) el.dataset.filmText = el.textContent;
          el.textContent = s.off ? el.dataset.filmText : s.text;
        } else el.classList.toggle(key, s.on);
      }));
    }

    function render(now) {
      for (const { a, start } of anims) a.currentTime = (now - start) * 1000;
      const c = cameraAt(now);
      camEl.style.transform =
        `translate(${width / 2}px,${height / 2}px) scale(${c.z.toFixed(5)}) translate(${(-c.x).toFixed(2)}px,${(-c.y).toFixed(2)}px)`;
      drawStates(now);
      for (const f of fns) f(now);
      drawCursor(now);
      ripples.forEach((r, i) => {
        const p = clamp01((now - r.t) / .6), el = rippleEls[i];
        el.style.opacity = now < r.t || p >= 1 ? 0 : (1 - p) * .55;
        el.style.transform = `translate(-50%,-50%) scale(${.2 + p * 1.8})`;
      });
    }

    render(0);
    return {
      render, timing, duration: Math.max(end, timing.duration || 0), width, height,
      /* Anything that runs on its own clock would break the pure timeline, so the renderer refuses it. */
      strays() {
        return document.getAnimations().filter(a => !owned.includes(a))
          .map(a => a.animationName || a.transitionProperty || 'unnamed animation');
      },
      ready: () => Promise.all([
        document.fonts.ready,
        ...[...document.images].map(i => i.decode().catch(() => { throw new Error(`Image failed: ${i.src}`); })),
        ...owned.map(a => a.ready),
      ]),
    };
  }

  window.Film = { create, EASE };
})();
