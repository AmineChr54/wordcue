/* Measurement helpers with no look of their own. Eases, durations and every kind of motion belong to
   the film. Don't add helpers here that make one film's feel the default for the next. */
window.Geometry = (() => {
  /* Camera in region-local coordinates, clamped so that a zoom never shows the region next door.
     regions: { name: [x, y, width, height] } in world pixels. */
  function camera(regions, stageWidth = 1600, stageHeight = 900) {
    return (at, region, x, y, zoom = 1, dur) => {
      const [rx, ry, rw, rh] = regions[region];
      const hw = stageWidth / 2 / zoom, hh = stageHeight / 2 / zoom;
      return {
        at, camera: true, zoom, dur,
        x: rx + Math.min(rw - hw, Math.max(hw, x)),
        y: ry + Math.min(rh - hh, Math.max(hh, y)),
      };
    };
  }

  /* Puts an absolutely positioned element on top of another one. */
  function place(el, on) {
    const moving = document.querySelector(el);
    const parent = moving.offsetParent.getBoundingClientRect();
    const target = document.querySelector(on).getBoundingClientRect();
    moving.style.left = `${target.left - parent.left}px`;
    moving.style.top = `${target.top - parent.top}px`;
  }

  /* Distance between two elements, for an animation that travels from one to the other. */
  function between(from, to) {
    const a = document.querySelector(from).getBoundingClientRect();
    const b = document.querySelector(to).getBoundingClientRect();
    return { dx: b.left - a.left, dy: b.top - a.top };
  }

  return { camera, place, between };
})();
