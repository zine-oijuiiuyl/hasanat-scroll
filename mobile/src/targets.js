// Views the tutorial can point at, by name.
const refs = {};
const fns = {};
export const target = name => fns[name] || (fns[name] = el => { refs[name] = el; });
export const measure = name => new Promise(resolve => {
  const el = refs[name];
  if (!el || !el.measureInWindow) return resolve(null);
  el.measureInWindow((x, y, w, h) => resolve(w ? { x, y, w, h } : null));
});

// The open sheet's scroll view, so the tutorial can bring a setting that is further down into view.
let scroller = null;
export const setScroller = s => { scroller = s; };
export const reveal = (name, H) => measure(name).then(r => {
  if (!r || !scroller) return;
  if (r.y < H * 0.15 || r.y + r.h > H * 0.6) scroller.scrollTo(Math.max(0, scroller.y + r.y - H * 0.25));
});
