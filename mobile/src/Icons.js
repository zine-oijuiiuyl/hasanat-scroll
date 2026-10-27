// The app's own icons, drawn to match the buddy and the gold-on-green screens, in place of the system
// emoji (Zine, 2026-10-27: "they look cheap"). Each is a 48 × 48 drawing with the same gold, green,
// cream and rose fills and soft dark outlines. Ico takes an emoji and draws its icon, so the emoji can
// stay as the key in toasts, badges and labels.
import { memo, useMemo } from "react";
import { Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

const O = "#8a5a0c", GN = "#0f4d3a", CR = "#a8875a", RS = "#a84a64", SKIN = "#f1c7a0", SKO = "#c88d62", INK = "#2b2118";
const DEFS = `<defs>
  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeaa8"/><stop offset=".55" stop-color="#f5b83d"/><stop offset="1" stop-color="#cf8f1e"/></linearGradient>
  <linearGradient id="n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd9ad"/><stop offset=".6" stop-color="#1f8f6a"/><stop offset="1" stop-color="#16704f"/></linearGradient>
  <linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbf1"/><stop offset="1" stop-color="#eadbb9"/></linearGradient>
  <linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc9d4"/><stop offset="1" stop-color="#e8708f"/></linearGradient>
  <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset=".5" stop-color="#ff9a3c"/><stop offset="1" stop-color="#e0542a"/></linearGradient>
  <linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2fff6"/><stop offset=".5" stop-color="#6fdcbd"/><stop offset="1" stop-color="#2a9d8f"/></linearGradient>
</defs>`;
const gold = `fill="url(#g)" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"`;
const green = `fill="url(#n)" stroke="${GN}" stroke-width="1.6" stroke-linejoin="round"`;
const cream = `fill="url(#c)" stroke="${CR}" stroke-width="1.6" stroke-linejoin="round"`;
const rose = `fill="url(#r)" stroke="${RS}" stroke-width="1.6" stroke-linejoin="round"`;
const shine = (d, w = 2.2) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="${w}" stroke-linecap="round"/>`;

function starPts(cx, cy, R, r, n = 5) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / n, d = i % 2 ? r : R;
    p.push(`${(cx + d * Math.cos(a)).toFixed(1)},${(cy + d * Math.sin(a)).toFixed(1)}`);
  }
  return p.join(" ");
}
const sparkle = (x, y, r, a = gold) =>
  `<path d="M${x},${y - r} C${x + r * .08},${y - r * .3} ${x + r * .3},${y - r * .08} ${x + r},${y} C${x + r * .3},${y + r * .08} ${x + r * .08},${y + r * .3} ${x},${y + r} C${x - r * .08},${y + r * .3} ${x - r * .3},${y + r * .08} ${x - r},${y} C${x - r * .3},${y - r * .08} ${x - r * .08},${y - r * .3} ${x},${y - r}Z" ${a}/>`;
const feather = (x, y, ang, l, fill, stroke) => {
  const w = l * 0.2;
  return `<path transform="translate(${x} ${y}) rotate(${ang})" d="M0,0 C${-w},${-l * .3} ${-w},${-l * .78} 0,${-l} C${w},${-l * .78} ${w},${-l * .3} 0,0Z" fill="${fill}" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>`;
};
const frond = (ang, l) => `<path transform="translate(26 15) rotate(${ang})" d="M0,0 C${l * .3},-7 ${l * .75},-6 ${l},3 C${l * .6},0 ${l * .3},2 0,0Z" ${green}/>`;
const face = (inner) => `<circle cx="24" cy="25" r="18" fill="${SKIN}" stroke="${SKO}" stroke-width="1.8"/>
  <circle cx="13.5" cy="30" r="3.6" fill="#f59d9d" opacity=".55"/><circle cx="34.5" cy="30" r="3.6" fill="#f59d9d" opacity=".55"/>${inner}`;
const tinyHeart = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0,3 C-6,-2 -3,-7 0,-4 C3,-7 6,-2 0,3Z" fill="url(#r)" stroke="${RS}" stroke-width="1"/>`;
const calendarBody = `<rect x="7" y="10" width="34" height="32" rx="6" ${cream}/>
  <path d="M7,20 V16 a6,6 0 0 1 6,-6 H35 a6,6 0 0 1 6,6 V20Z" ${green}/>
  <rect x="13.5" y="5.5" width="5" height="10" rx="2.5" ${gold}/><rect x="29.5" y="5.5" width="5" height="10" rx="2.5" ${gold}/>`;

const ICONS = {
  beads: () => {
    let b = `<circle cx="24" cy="19" r="12" fill="none" stroke="${O}" stroke-opacity=".5" stroke-width="1.4"/>`;
    for (let i = 0; i < 12; i++) {
      const a = Math.PI / 2 + i * Math.PI / 6;
      if (i === 0) continue;
      b += `<circle cx="${(24 + 12 * Math.cos(a)).toFixed(1)}" cy="${(19 + 12 * Math.sin(a)).toFixed(1)}" r="3.5" ${gold} stroke-width="1.2"/>`;
    }
    return b + `<path d="M21,35 L18.5,45 Q24,47.5 29.5,45 L27,35Z" ${green}/>
      <circle cx="24" cy="32.5" r="4" ${green}/>${shine("M22.4,31.2 l1,-.8", 1.6)}`;
  },
  scale: () => `<path d="M14,43 Q24,36 34,43Z" ${gold}/><rect x="22.5" y="11" width="3" height="31" rx="1.5" ${gold}/>
    <path d="M7,14 H41" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/><path d="M7,14 H41" stroke="url(#g)" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="24" cy="10" r="3.4" ${gold}/>
    <path d="M10,15 L4,29 M10,15 L16,29 M38,15 L32,29 M38,15 L44,29" stroke="${O}" stroke-width="1.3" stroke-opacity=".8"/>
    <path d="M2.5,29 Q10,38 17.5,29Z" ${gold}/><path d="M30.5,29 Q38,38 45.5,29Z" ${gold}/>`,
  lock: () => `<path d="M15,23 V15.5 a9,9 0 0 1 18,0 V23" fill="none" stroke="#6f7b85" stroke-width="6.4"/>
    <path d="M15,23 V15.5 a9,9 0 0 1 18,0 V23" fill="none" stroke="#d6dde3" stroke-width="3.6"/>
    <rect x="9" y="21" width="30" height="22" rx="6" ${gold}/>${shine("M13,26 V31")}
    <circle cx="24" cy="30.5" r="3.2" fill="#5a3a06"/><rect x="22.6" y="31.5" width="2.8" height="6.5" rx="1.4" fill="#5a3a06"/>`,
  crown: () => `<path d="M7,35 L9,15 L17,24 L24,10 L31,24 L39,15 L41,35Z" ${gold}/>
    <rect x="6.5" y="33" width="35" height="8" rx="2.5" ${gold}/>
    <circle cx="9" cy="14" r="2.8" ${gold}/><circle cx="24" cy="9" r="2.8" ${gold}/><circle cx="39" cy="14" r="2.8" ${gold}/>
    <circle cx="15.5" cy="37" r="2.2" fill="url(#n)" stroke="${GN}"/><circle cx="24" cy="37" r="2.6" fill="url(#r)" stroke="${RS}"/><circle cx="32.5" cy="37" r="2.2" fill="url(#n)" stroke="${GN}"/>
    ${shine("M13,28 L14,21")}`,
  gift: () => `<path d="M24,16 C18,4 8,10 15,16Z" ${green}/><path d="M24,16 C30,4 40,10 33,16Z" ${green}/>
    <rect x="9" y="24" width="30" height="19" rx="3" ${gold}/><rect x="6.5" y="15.5" width="35" height="9.5" rx="3" ${gold}/>
    <rect x="21" y="15.5" width="6" height="27.5" fill="url(#n)" stroke="${GN}" stroke-width="1.4"/>
    ${shine("M12,28 V36")}`,
  brain: () => {
    const half = `<path d="M24,9 C20,6 13,7 11.5,12.5 C6.5,13.5 5,19.5 7.5,23 C4.5,27 6,33 10.5,34.5 C11,39.5 16,42.5 20.5,40.5 C22,42 24,42 24,42Z" ${rose}/>
      <path d="M11.5,12.5 C13,15 16,16 18,15 M7.5,23 C10,24.5 13,24 15,22 M10.5,34.5 C13,33 15,31 15.5,28.5 M19,24 C21,26 21,30 19,33" fill="none" stroke="${RS}" stroke-width="1.5" stroke-linecap="round"/>`;
    return half + `<g transform="translate(48 0) scale(-1 1)">${half}</g>` + shine("M13,17 C14,15.5 15.5,15 17,15.2", 1.8);
  },
  fire: () => `<path d="M24,3 C26,12 37,16 37,28.5 C37,37.5 31,44.5 24,44.5 C17,44.5 11,37.5 11,28.5 C11,21.5 15,17 18,13 C18.5,19 21,21.5 23,21.5 C21.5,15 22,9 24,3Z" fill="url(#f)" stroke="#b8431f" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M24,24 C26.5,28.5 30.5,30.5 30.5,35.5 C30.5,39.5 27.5,42.5 24,42.5 C20.5,42.5 17.5,39.5 17.5,35.5 C17.5,31 22,29 24,24Z" fill="#fff1b0"/>`,
  star: () => `<polygon points="${starPts(24, 26, 20, 9)}" ${gold}/>${shine("M17,20.5 L20,20.5", 2)}`,
  starGlow: () => `<path d="M8,8 L12,12 M40,8 L36,12 M6,30 L10,29 M42,30 L38,29" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>
    <polygon points="${starPts(24, 26, 16, 7.2)}" ${gold}/>${sparkle(40, 42, 4)}${shine("M18.5,22 L21,22", 1.8)}`,
  sparkle: () => `${sparkle(21, 27, 17)}${sparkle(38, 10, 6.5)}${sparkle(39, 38, 4)}${shine("M18,22 L20,20", 1.8)}`,
  compass: () => `<circle cx="24" cy="24" r="19.5" ${gold}/><circle cx="24" cy="24" r="15" ${green}/>
    <path d="M24,7 V11 M24,37 V41 M7,24 H11 M37,24 H41" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M24,11 L28.5,24 H19.5Z" fill="#fff6dd" stroke="${CR}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M19.5,24 H28.5 L24,37Z" ${gold} stroke-width="1.2"/><circle cx="24" cy="24" r="2.3" fill="${O}"/>`,
  books: () => `<rect x="7" y="13" width="10" height="29" rx="2" ${green}/><rect x="18" y="8" width="10" height="34" rx="2" ${gold}/>
    <rect x="29" y="12" width="10" height="30" rx="2" transform="rotate(12 34 42)" ${rose}/>
    <path d="M9.5,18 H14.5 M9.5,36 H14.5 M20.5,13 H25.5 M20.5,37 H25.5" stroke="#fff6dd" stroke-width="2" stroke-linecap="round"/>
    <path d="M4,43 H44" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/>`,
  book: () => `<path d="M3,15 V41 Q14,38 24,43 Q34,38 45,41 V15Z" ${green}/>
    <path d="M24,14 C18,9.5 11,9.5 6,11.5 V37.5 C11,35.5 18,35.5 24,40Z" ${cream}/>
    <path d="M24,14 C30,9.5 37,9.5 42,11.5 V37.5 C37,35.5 30,35.5 24,40Z" ${cream}/>
    <path d="M10,17 C13,16 17,16 20,17.5 M10,23 C13,22 17,22 20,23.5 M10,29 C13,28 17,28 20,29.5 M28,17.5 C31,16 35,16 38,17 M28,23.5 C31,22 35,22 38,23 M28,29.5 C31,28 35,28 38,29" fill="none" stroke="#d9a94a" stroke-width="1.8" stroke-linecap="round"/>`,
  scroll: () => `<rect x="11" y="9" width="26" height="30" ${cream}/>
    <path d="M16,18 H32 M16,23 H32 M16,28 H27" stroke="#d9a94a" stroke-width="2" stroke-linecap="round"/>
    <rect x="7.5" y="5.5" width="33" height="7.5" rx="3.75" ${gold}/><rect x="7.5" y="35.5" width="33" height="7.5" rx="3.75" ${gold}/>
    ${shine("M11,8 H20", 1.6)}`,
  up: () => `<circle cx="24" cy="24" r="19.5" ${green}/><path d="M24,10.5 L35.5,24 H29 V36.5 H19 V24 H12.5Z" ${gold}/>${shine("M22,16 L19.5,19", 1.8)}`,
  calendar: () => `${calendarBody}
    ${[25, 31.5, 38].map(y => [14.5, 21.5, 28.5].map(x => `<rect x="${x}" y="${y - 2.5}" width="5" height="4" rx="1.2" fill="#e3c57d"/>`).join("")).join("")}
    <rect x="28.5" y="35.5" width="5" height="4" rx="1.2" fill="url(#n)"/>`,
  calendarStar: () => `${calendarBody}<polygon points="${starPts(24, 31, 9.5, 4.3)}" ${gold}/>`,
  wing: () => [[18, 38], [40, 35], [62, 30], [84, 24]].map(([a, l]) => feather(9, 41, a, l, "#e6edf6", "#b4c3da")).join("") +
    [[28, 29], [50, 27], [72, 21]].map(([a, l]) => feather(9, 41, a, l, "#ffffff", "#e0b85a")).join(""),
  trophy: () => `<path d="M14,12 C6,12 6,23 15,24 M34,12 C42,12 42,23 33,24" fill="none" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M14,12 C6,12 6,23 15,24 M34,12 C42,12 42,23 33,24" fill="none" stroke="url(#g)" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M13,7 H35 V18 C35,26 30.5,31 24,31 C17.5,31 13,26 13,18Z" ${gold}/>
    <rect x="21.5" y="30" width="5" height="6" ${gold}/><rect x="14" y="35" width="20" height="8" rx="2.5" ${green}/>
    <polygon points="${starPts(24, 18, 6, 2.7)}" fill="#fff6dd"/>${shine("M17,11 V18")}`,
  mosque: () => `<rect x="3.5" y="17" width="5" height="26" rx="1" ${cream}/><path d="M3,17.5 L6,10 L9,17.5Z" ${gold}/>
    <rect x="39.5" y="17" width="5" height="26" rx="1" ${cream}/><path d="M39,17.5 L42,10 L45,17.5Z" ${gold}/>
    <rect x="10" y="27" width="28" height="16" ${cream}/>
    <path d="M12,28 C12,19 17,14 24,10 C31,14 36,19 36,28Z" ${gold}/>
    <path d="M24,10 V5" stroke="${O}" stroke-width="1.6"/><path d="M25.5,1.8 A2.6,2.6 0 1 0 25.5,6.6 A2,2 0 1 1 25.5,1.8Z" fill="url(#g)" stroke="${O}" stroke-width=".8"/>
    <path d="M20,43 V36 a4,4 0 0 1 8,0 V43Z" fill="url(#n)" stroke="${GN}" stroke-width="1.2"/>${shine("M16,22 C17,19 19,17 21,15.5", 1.8)}`,
  save: () => `<rect x="7" y="28" width="34" height="15" rx="4.5" ${green}/>
    <path d="M24,6 V26 M15,18 L24,27 L33,18" fill="none" stroke="${O}" stroke-width="7.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24,6 V26 M15,18 L24,27 L33,18" fill="none" stroke="url(#g)" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="34" cy="36" r="2" fill="#fff6dd"/>`,
  folder: () => `<path d="M5,11 H18.5 L22.5,15 H43 V40 H5Z" fill="#d99a28" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M5,20 H43 V40 a2,2 0 0 1 -2,2 H7 a2,2 0 0 1 -2,-2Z" ${gold}/>${shine("M9,25 H20", 1.8)}`,
  pin: () => `<path d="M24,45 C24,45 9.5,30 9.5,19 A14.5,14.5 0 0 1 38.5,19 C38.5,30 24,45 24,45Z" ${green}/>
    <circle cx="24" cy="19" r="6" ${gold}/>${shine("M15,14 C16,11.5 18,10 20,9.5", 1.8)}`,
  hand: () => `<path d="M13,27 C13,23 16,21.5 18.5,22.5 V9 C18.5,6 20.5,4 23,4 C25.5,4 27.5,6 27.5,9 V21 C29.5,19.8 31.8,20.8 32.2,23 C34.4,21.8 36.5,23.2 36.5,26 V32 C36.5,40 31.5,44.5 24.5,44.5 C17.5,44.5 13,40 13,34Z" fill="${SKIN}" stroke="${SKO}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M27.5,21.5 V27 M32.2,23.5 V28.5 M18.5,23 V28" stroke="${SKO}" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="20.5" y="5.8" width="5" height="5" rx="2.2" fill="#fbe3cf"/>`,
  gem: () => `<path d="M12,9 H36 L45,20 L24,43 L3,20Z" fill="url(#t)" stroke="#1f7a6e" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M3,20 H45 M12,9 L17.5,20 L24,9 L30.5,20 L36,9 M17.5,20 L24,43 L30.5,20" fill="none" stroke="#1f7a6e" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M12,9 L17.5,20 H3Z" fill="#fff" opacity=".45"/>`,
  globe: () => `<circle cx="24" cy="24" r="19" ${green}/>
    <ellipse cx="24" cy="24" rx="8.5" ry="19" fill="none" stroke="url(#g)" stroke-width="2"/>
    <path d="M24,5 V43 M5,24 H43 M8.5,14 H39.5 M8.5,34 H39.5" stroke="url(#g)" stroke-width="2"/>${shine("M11,13 C13,10 15.5,8.5 18,7.5", 1.8)}`,
  offline: () => `<path d="M14,37 C7.5,37 5.5,31.5 8,27.5 C9.5,24 13,23 15,23.5 C16,16.5 22,13 27.5,15 C31,16.2 33,19 33.5,22 C38.5,21.5 42.5,25.5 41.5,30.5 C40.8,34.5 37.5,37 34,37Z" ${cream}/>
    <path d="M9,9 L39,41" stroke="#fff" stroke-width="6.5" stroke-linecap="round"/><path d="M9,9 L39,41" stroke="url(#r)" stroke-width="3.8" stroke-linecap="round"/>`,
  check: () => `<circle cx="24" cy="24" r="19.5" ${green}/><path d="M14.5,24.5 L21.5,31.5 L34,17.5" fill="none" stroke="#fff6dd" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  bulb: () => `<path d="M8,8 L11,11 M40,8 L37,11 M3.5,22 H7.5 M44.5,22 H40.5" stroke="url(#g)" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M24,5 C15.5,5 10.5,11.5 10.5,19 C10.5,25 14.5,28 17,32 V35 H31 V32 C33.5,28 37.5,25 37.5,19 C37.5,11.5 32.5,5 24,5Z" ${gold}/>
    <path d="M19.5,22 L22,27.5 L24,22 L26,27.5 L28.5,22" fill="none" stroke="#fff6dd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="17" y="35" width="14" height="4" rx="1.5" ${cream}/><rect x="18.5" y="39" width="11" height="4.5" rx="2" ${cream}/>${shine("M15,15 C16,12 18,10 20,9.5", 1.8)}`,
  timer: () => `<rect x="20.5" y="3.5" width="7" height="6" rx="2" ${gold}/><path d="M24,9.5 V11" stroke="${O}" stroke-width="3"/>
    <circle cx="24" cy="27" r="17.5" ${gold}/><circle cx="24" cy="27" r="13.5" ${cream}/>
    <path d="M24,27 V17.5 M24,27 L31,31" stroke="${GN}" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="27" r="2.2" fill="${GN}"/>`,
  speaker: () => `<path d="M7,19 H14.5 L25,10 V38 L14.5,29 H7Z" ${gold}/>
    <path d="M30.5,18 C33.5,21 33.5,27 30.5,30 M35.5,12.5 C41.5,18.5 41.5,29.5 35.5,35.5" fill="none" stroke="#fff6dd" stroke-width="3.2" stroke-linecap="round"/>`,
  target: () => `<circle cx="22" cy="26" r="19" ${cream}/><circle cx="22" cy="26" r="14" ${green}/><circle cx="22" cy="26" r="9" fill="#fffbf1"/><circle cx="22" cy="26" r="4.5" ${gold}/>
    <path d="M22,26 L40,8" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/><path d="M37,4 L45,3 L44,11 L40,8Z" fill="url(#r)" stroke="${RS}" stroke-width="1.2" stroke-linejoin="round"/>`,
  party: () => `<path d="M5,43 L15,14 L34,33Z" ${gold}/><path d="M9,32 L20,38 M12,23 L27,32" stroke="${O}" stroke-width="1.6" stroke-opacity=".6"/>
    <path d="M22,13 C25,8 22,5 26,3 M33,22 C38,19 41,22 45,19" fill="none" stroke="url(#r)" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="33" y="5" width="4.5" height="4.5" rx="1" transform="rotate(20 35 7)" fill="url(#n)"/><circle cx="41" cy="12" r="2.4" fill="url(#g)" stroke="${O}"/>
    <circle cx="40" cy="30" r="2.2" fill="url(#n)"/><rect x="28" y="12" width="3.5" height="3.5" rx="1" fill="url(#r)"/>`,
  seedling: () => `<path d="M7,43 Q24,33 41,43Z" fill="#a8743f" stroke="#6b4520" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M24,39 V22" stroke="${GN}" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M24,27 C15.5,27 9.5,20.5 9.5,13 C18,13 24,18.5 24,27Z" ${green}/><path d="M24,22.5 C26,14 33,10 40.5,10.5 C40.5,19 33.5,24.5 24,22.5Z" ${green}/>
    ${shine("M13,15.5 C15.5,16 17.5,17.5 19,19.5", 1.6)}`,
  warning: () => `<path d="M24,5 L44.5,40.5 H3.5Z" ${gold} stroke-width="2"/><rect x="21.8" y="16" width="4.4" height="14" rx="2.2" fill="#5a3a06"/><circle cx="24" cy="35" r="2.5" fill="#5a3a06"/>`,
  moon: () => `<path d="M28,5 A19,19 0 1 0 43,31 A15,15 0 1 1 28,5Z" ${gold}/>${sparkle(36, 13, 5)}${shine("M12,20 C12.5,16.5 14.5,13.5 17,11.5", 1.8)}`,
  leaf: () => `<path d="M7,41 C7,20 21,7 42,7 C42,28 30,41 7,41Z" ${green}/>
    <path d="M7,41 L34,15 M17,31 L17,22 M17,31 L27,31 M25,23 L25,15 M25,23 L33,23" fill="none" stroke="#c8f5e2" stroke-width="1.8" stroke-linecap="round"/>`,
  tree: () => `<rect x="21" y="28" width="6" height="15.5" rx="2" fill="#a8743f" stroke="#6b4520" stroke-width="1.6"/>
    <path d="M12,33 C4.5,33 3.5,23 9.5,20.5 C8.5,12 16,7 22,10 C26,3.5 36.5,5.5 37.5,13 C44.5,14 45.5,26.5 38.5,30.5 C36.5,33.5 30,34 28,32.5 C24,35 16,35 12,33Z" ${green}/>
    <circle cx="16" cy="18" r="3" fill="#7be3bd" opacity=".7"/><circle cx="29" cy="13" r="2.4" fill="#7be3bd" opacity=".7"/>`,
  palm: () => `<path d="M21,44 C22.5,34 24,25 26,16" fill="none" stroke="#6b4520" stroke-width="6.2" stroke-linecap="round"/>
    <path d="M21,44 C22.5,34 24,25 26,16" fill="none" stroke="#c08a52" stroke-width="3.8" stroke-linecap="round"/>
    ${[-172, -140, -100, -45, -8].map((a, i) => frond(a, [19, 18, 15, 18, 19][i])).join("")}
    <circle cx="24.5" cy="19.5" r="2.6" fill="#8a5a2c"/><circle cx="28.5" cy="19.5" r="2.6" fill="#8a5a2c"/>`,
  medal: () => `<path d="M12,3 H21 L28,20 H19Z" ${green}/><path d="M36,3 H27 L20,20 H29Z" ${rose}/>
    <circle cx="24" cy="31" r="13" ${gold}/><circle cx="24" cy="31" r="9.5" fill="none" stroke="${O}" stroke-width="1.2" stroke-opacity=".6"/>
    <polygon points="${starPts(24, 31.5, 6.5, 2.9)}" fill="#fff6dd"/>`,
  bolt: () => `<path d="M28,3 L9,27 H21.5 L17.5,45 L39,19 H26.5Z" ${gold} stroke-width="1.8"/>${shine("M24,10 L17,19", 1.8)}`,
  rocket: () => `<path d="M19,32 C19,38 22,42 24,46 C26,42 29,38 29,32Z" fill="url(#f)"/>
    <path d="M16,24 L8.5,34 L16.5,33Z" ${rose}/><path d="M32,24 L39.5,34 L31.5,33Z" ${rose}/>
    <path d="M24,3 C32.5,9 34.5,20 32,33 H16 C13.5,20 15.5,9 24,3Z" ${cream}/>
    <circle cx="24" cy="18" r="4.8" ${green}/>${shine("M22.5,16.5 l1,-1", 1.4)}`,
  halo: () => `<ellipse cx="24" cy="26" rx="18" ry="7.5" fill="none" stroke="${O}" stroke-width="6.4"/>
    <ellipse cx="24" cy="26" rx="18" ry="7.5" fill="none" stroke="url(#g)" stroke-width="4"/>
    ${sparkle(9, 11, 5)}${sparkle(39, 9, 3.5)}${sparkle(41, 41, 4)}`,
  miss: () => face(`<ellipse cx="17" cy="23" rx="4.4" ry="5.2" fill="${INK}"/><ellipse cx="31" cy="23" rx="4.4" ry="5.2" fill="${INK}"/>
    <circle cx="18.4" cy="21" r="1.9" fill="#fff"/><circle cx="32.4" cy="21" r="1.9" fill="#fff"/>
    <path d="M20,34.5 Q24,31.5 28,34.5" fill="none" stroke="#8a4b3a" stroke-width="2" stroke-linecap="round"/>`),
  sad: () => face(`<ellipse cx="17" cy="23" rx="2.6" ry="3.4" fill="${INK}"/><ellipse cx="31" cy="23" rx="2.6" ry="3.4" fill="${INK}"/>
    <path d="M13,17 L20,15.5 M35,17 L28,15.5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M19,35 Q24,30.5 29,35" fill="none" stroke="#8a4b3a" stroke-width="2" stroke-linecap="round"/>
    <path d="M33,27 C35.5,31 36,33 33.5,34 C31,33 31.5,31 33,27Z" fill="#8fd0ff" stroke="#4d9bd6" stroke-width="1"/>`),
  upset: () => face(`<path d="M13,23 Q17,20 21,23 M27,23 Q31,20 35,23" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M14.5,25 C13.5,31 13,35 14.5,40 M33.5,25 C34.5,31 35,35 33.5,40" fill="none" stroke="#8fd0ff" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="24" cy="33.5" rx="4.5" ry="3.4" fill="#8a4b3a"/>`),
  love: () => face(`<path d="M13,24 Q17,19.5 21,24 M27,24 Q31,19.5 35,24" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M18.5,31.5 Q24,37 29.5,31.5" fill="none" stroke="#8a4b3a" stroke-width="2.2" stroke-linecap="round"/>
    ${tinyHeart(40, 10, 1.1)}${tinyHeart(8, 9, .8)}`),
};

// The emoji each icon stands in for.
const EMOJI = {
  "📿": "beads", "⚖": "scale", "🔒": "lock", "👑": "crown", "🎁": "gift", "🧠": "brain", "🔥": "fire",
  "⭐": "star", "🌟": "starGlow", "✨": "sparkle", "✦": "sparkle", "🧭": "compass", "📚": "books", "📖": "book",
  "📜": "scroll", "⬆": "up", "📅": "calendar", "🗓": "calendarStar", "🪽": "wing", "🏆": "trophy", "🕌": "mosque",
  "💾": "save", "📂": "folder", "🗂": "folder", "📍": "pin", "👆": "hand", "💎": "gem", "🌐": "globe",
  "📡": "offline", "✅": "check", "💡": "bulb", "⏱": "timer", "🔊": "speaker", "🎯": "target", "🎉": "party",
  "🌱": "seedling", "⚠": "warning", "🌙": "moon", "🍃": "leaf", "🌳": "tree", "🌴": "palm", "💪": "medal",
  "⚡": "bolt", "🚀": "rocket", "😇": "halo", "🥺": "miss", "😢": "sad", "😭": "upset", "🥰": "love",
};
export const iconOf = e => (e == null ? null : EMOJI[String(e).replace(/️/g, "")] || null);

const cache = {};
const xmlFor = name => cache[name] || (cache[name] = ICONS[name] ? `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${DEFS}${ICONS[name]()}</svg>` : null);

export const Icon = memo(function Icon({ name, size = 24, style }) {
  const xml = useMemo(() => xmlFor(name), [name]);
  if (!xml) return null;
  return <SvgXml xml={xml} width={size} height={size} style={style} />;
});

// An emoji drawn as the app's icon, or as itself when there is no icon for it.
export function Ico({ e, size = 24, style }) {
  const name = iconOf(e);
  if (name) return <Icon name={name} size={size} style={style} />;
  return <Text style={[{ fontSize: size * 0.85 }, style]}>{e}</Text>;
}

// Splits a leading emoji off a label: "🕌 Prayer times" gives ["🕌", "Prayer times"].
const flat = c => (Array.isArray(c) && c.every(x => typeof x === "string" || typeof x === "number") ? c.join("") : c);
export function splitIcon(c) {
  const str = flat(c);
  if (typeof str !== "string") return [null, c];
  const m = str.match(/^(\S+)\s+([\s\S]*)$/);
  return m && iconOf(m[1]) ? [m[1], m[2]] : [null, str];
}

// A line of text that may start with an emoji; the emoji is drawn as an icon in front of it.
export function IconText({ children, style, size, gap = 6, row, numberOfLines }) {
  const [e, rest] = splitIcon(children);
  if (!e) return <Text style={style} numberOfLines={numberOfLines}>{children}</Text>;
  const fs = size || (Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {}).fontSize || 15;
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap }, row]}>
      <Ico e={e} size={Math.round(fs * 1.25)} />
      <Text style={[style, { flexShrink: 1 }]} numberOfLines={numberOfLines}>{rest}</Text>
    </View>
  );
}
