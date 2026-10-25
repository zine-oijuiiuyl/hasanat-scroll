// Views the tutorial can point at, by name.
const refs = {};
const fns = {};
export const target = name => fns[name] || (fns[name] = el => { refs[name] = el; });
export const measure = name => new Promise(resolve => {
  const el = refs[name];
  if (!el || !el.measureInWindow) return resolve(null);
  el.measureInWindow((x, y, w, h) => resolve(w ? { x, y, w, h } : null));
});
