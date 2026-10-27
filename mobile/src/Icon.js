// The app's own icon set, drawn to match the gold-on-deep-green look, used in place of system emojis
// (Zine, 2026-10-27: the emojis looked cheap). Each icon is a 24 × 24 SVG. Data and translations keep
// their emoji, and EMOJI maps each one to its icon, so <Glyph e="📿" /> draws the tasbih.
import { memo } from "react";
import { Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

const O = "#5c3a08", CR = "#fff6dc", TEAL = "#2f8f7a", TEAL2 = "#1d5f52", PINK = "#ff8a9a", BLUE = "#8fd8ff";
const DEFS = `<defs>
  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeaa6"/><stop offset=".55" stop-color="#f5b83d"/><stop offset="1" stop-color="#c98a1b"/></linearGradient>
  <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset=".55" stop-color="#f79a2e"/><stop offset="1" stop-color="#d6501e"/></linearGradient>
  <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fc9ad"/><stop offset="1" stop-color="#1d6f60"/></linearGradient>
  <linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6e8a8"/><stop offset=".6" stop-color="#46ab7c"/><stop offset="1" stop-color="#22705a"/></linearGradient>
  <linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1e4c2"/></linearGradient>
</defs>`;
const ln = `stroke="${O}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"`;
const thin = `stroke="${O}" stroke-width=".9" stroke-linejoin="round" stroke-linecap="round" fill="none"`;

// A five-point star and a four-point sparkle, as path data.
const star = (cx, cy, R, r) => "M" + Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R;
  return `${(cx + d * Math.cos(a)).toFixed(2)},${(cy + d * Math.sin(a)).toFixed(2)}`;
}).join(" L") + "Z";
const spark = (x, y, r) => `M${x},${y - r} Q${x + r * 0.16},${y - r * 0.16} ${x + r},${y} Q${x + r * 0.16},${y + r * 0.16} ${x},${y + r} Q${x - r * 0.16},${y + r * 0.16} ${x - r},${y} Q${x - r * 0.16},${y - r * 0.16} ${x},${y - r}Z`;
const heart = (x, y, s) => `<path transform="translate(${x},${y}) scale(${s})" d="M0,3 C-4,0 -3,-3.2 -1.4,-3.2 C-.6,-3.2 0,-2.6 0,-2 C0,-2.6 .6,-3.2 1.4,-3.2 C3,-3.2 4,0 0,3Z" fill="${PINK}" stroke="${O}" stroke-width=".5"/>`;
const feather = (a, l) => {
  const w = l * 0.2;
  return `<path transform="rotate(${a})" d="M0,0 C${-w},${-l * 0.3} ${-w},${-l * 0.78} 0,${-l} C${w},${-l * 0.78} ${w},${-l * 0.3} 0,0Z" fill="url(#c)" stroke="#d29a2a" stroke-width=".8"/>`;
};
const face = (inner, cy = 12.5) => `<circle cx="12" cy="${cy}" r="8.6" fill="url(#g)" ${ln}/><path d="M7.2,9.4 A6,6 0 0 1 11,6.6" stroke="#fff3c4" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".8"/>${inner}`;

const ICONS = {
  tasbih: (() => {
    const beads = [];
    for (let i = 0; i < 13; i++) {
      const a = Math.PI / 2 + 0.55 + i * (2 * Math.PI - 1.1) / 12;
      beads.push(`<circle cx="${(12 + 7 * Math.cos(a)).toFixed(2)}" cy="${(10 + 6.6 * Math.sin(a)).toFixed(2)}" r="1.75" fill="url(#g)" stroke="${O}" stroke-width=".8"/>`);
    }
    return `<path d="M12,17.6 L10.6,22 M12,17.6 L12,22.4 M12,17.6 L13.4,22" stroke="${TEAL}" stroke-width="1.3" stroke-linecap="round"/>${beads.join("")}<circle cx="12" cy="17" r="2.2" fill="url(#t)" stroke="${O}" stroke-width=".8"/>`;
  })(),
  scale: `<path d="M12,4 V19" stroke="${O}" stroke-width="3.2" stroke-linecap="round"/><path d="M12,4 V19" stroke="url(#g)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M4.5,6.5 H19.5" stroke="${O}" stroke-width="2.8" stroke-linecap="round"/><path d="M4.5,6.5 H19.5" stroke="#ffd36b" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M4.5,6.5 L2.2,13 M4.5,6.5 L6.8,13 M19.5,6.5 L17.2,13 M19.5,6.5 L21.8,13" ${thin}/>
    <path d="M1.6,13 H7.4 A2.9,2.4 0 0 1 1.6,13Z M16.6,13 H22.4 A2.9,2.4 0 0 1 16.6,13Z" fill="url(#g)" ${ln}/>
    <path d="M8,21 Q8,18.6 12,18.6 Q16,18.6 16,21Z" fill="url(#g)" ${ln}/><circle cx="12" cy="3.6" r="1.6" fill="url(#t)" ${ln}/>`,
  crown: `<path d="M3,8 L7.6,12 L12,4.8 L16.4,12 L21,8 L19.4,18.6 H4.6Z" fill="url(#g)" ${ln}/><rect x="4.4" y="16.2" width="15.2" height="3" rx=".8" fill="#e09a26" ${ln}/>
    <circle cx="12" cy="4.6" r="1.4" fill="${CR}" ${ln}/><circle cx="3" cy="7.8" r="1.1" fill="${CR}" ${ln}/><circle cx="21" cy="7.8" r="1.1" fill="${CR}" ${ln}/>
    <path d="M12,15.2 L13.3,17.7 L12,18.4 L10.7,17.7Z" fill="url(#t)" stroke="${O}" stroke-width=".7"/><circle cx="7.4" cy="17.7" r=".8" fill="${PINK}"/><circle cx="16.6" cy="17.7" r=".8" fill="${PINK}"/>`,
  lock: `<path d="M8,11 V8 A4,4 0 0 1 16,8 V11" stroke="${O}" stroke-width="3.6" fill="none"/><path d="M8,11 V8 A4,4 0 0 1 16,8 V11" stroke="#e9ddc3" stroke-width="2" fill="none"/>
    <rect x="4.8" y="10.4" width="14.4" height="10.6" rx="2.6" fill="url(#g)" ${ln}/><circle cx="12" cy="14.6" r="1.6" fill="${O}"/><rect x="11.3" y="15" width="1.4" height="3.1" rx=".7" fill="${O}"/>`,
  compass: `<circle cx="12" cy="12" r="9.4" fill="url(#g)" ${ln}/><circle cx="12" cy="12" r="7" fill="url(#t)" stroke="${O}" stroke-width=".8"/>
    <path d="M12,5.6 V6.8 M12,17.2 V18.4 M5.6,12 H6.8 M17.2,12 H18.4" stroke="${CR}" stroke-width="1" stroke-linecap="round"/>
    <path d="M14.6,9.4 L12.9,12.9 L9.4,14.6 L11.1,11.1Z" fill="${CR}" stroke="${O}" stroke-width=".7"/><path d="M14.6,9.4 L11.1,11.1 L12.9,12.9Z" fill="#ff7b5c" stroke="${O}" stroke-width=".7"/><circle cx="12" cy="12" r=".9" fill="${O}"/>`,
  brain: `<path d="M12,4.6 C9.5,3 6,4 5.5,7 C3.2,7.6 2.8,10.8 4.3,12.2 C3,14.3 4.5,17.5 7.2,17.3 C8,19.6 11,20.2 12,18.2 C13,20.2 16,19.6 16.8,17.3 C19.5,17.5 21,14.3 19.7,12.2 C21.2,10.8 20.8,7.6 18.5,7 C18,4 14.5,3 12,4.6Z" fill="#ffc9c9" ${ln}/>
    <path d="M12,4.8 V18 M8.2,8.2 Q10.2,8.2 10.2,10.4 M6.6,13 Q9.2,12.3 9.8,14.6 M15.8,8.2 Q13.8,8.2 13.8,10.4 M17.4,13 Q14.8,12.3 14.2,14.6" ${thin}/><path d="${spark(19.6, 4.2, 2.4)}" fill="url(#g)" stroke="${O}" stroke-width=".6"/>`,
  fire: `<path d="M12,2.4 C13.2,6 17.8,8 17.8,13.6 A5.8,5.8 0 0 1 6.2,13.6 C6.2,10.5 8.4,9 9,6.8 C10.6,8.4 10.6,10.2 10.6,10.2 C11.6,8 12.6,5.4 12,2.4Z" fill="url(#f)" ${ln}/>
    <path d="M12,10.8 C13.6,12.8 15,13.9 15,16 A3,3 0 0 1 9,16 C9,14.4 10.5,13.2 12,10.8Z" fill="#fff1b8"/>`,
  star: `<path d="${star(12, 12.6, 10, 4.4)}" fill="url(#g)" ${ln}/><path d="M9,9.6 L10.6,8.4" stroke="#fff6cc" stroke-width="1.4" stroke-linecap="round"/>`,
  star2: `<path d="M12,1 V2.6 M2.2,9.6 L3.6,10 M21.8,9.6 L20.4,10 M5.6,21 L6.6,19.8 M18.4,21 L17.4,19.8" stroke="#ffe08a" stroke-width="1.4" stroke-linecap="round"/><path d="${star(12, 12.8, 8.6, 3.8)}" fill="url(#g)" ${ln}/>
    <path d="${spark(20, 4, 2.4)}" fill="${CR}"/><path d="${spark(4.2, 19, 1.8)}" fill="${CR}"/><path d="M9.6,10.2 L10.8,9.3" stroke="#fff6cc" stroke-width="1.2" stroke-linecap="round"/>`,
  sparkle: `<path d="${spark(10, 10.5, 7.8)}" fill="url(#g)" ${ln}/><path d="${spark(18.6, 17.8, 3.4)}" fill="url(#g)" stroke="${O}" stroke-width=".8"/><path d="${spark(18.4, 4.6, 2.2)}" fill="${CR}"/>`,
  gift: `<rect x="4.2" y="11" width="15.6" height="10" rx="1.4" fill="url(#t)" ${ln}/><rect x="3" y="8" width="18" height="4.2" rx="1.2" fill="#3fae93" ${ln}/>
    <rect x="10.5" y="8" width="3" height="13" fill="url(#g)" stroke="${O}" stroke-width=".8"/>
    <path d="M12,8 C9.6,3.6 5.4,5 7.4,8Z M12,8 C14.4,3.6 18.6,5 16.6,8Z" fill="url(#g)" ${ln}/><circle cx="12" cy="8" r="1.2" fill="#e09a26" ${ln}/>`,
  chest: `<path d="M3.5,11 V8.5 A4,4 0 0 1 7.5,4.5 H16.5 A4,4 0 0 1 20.5,8.5 V11Z" fill="url(#t)" ${ln}/><rect x="3.5" y="11" width="17" height="9.5" rx="1.2" fill="url(#t)" ${ln}/>
    <path d="M3.5,11 H20.5 M7.5,4.6 V20.4 M16.5,4.6 V20.4" stroke="url(#g)" stroke-width="2"/><path d="M3.5,11 H20.5" ${thin}/>
    <rect x="10.2" y="9.4" width="3.6" height="4.4" rx=".9" fill="url(#g)" ${ln}/><circle cx="12" cy="11.4" r=".7" fill="${O}"/>`,
  up: `<circle cx="12" cy="12" r="9.6" fill="url(#g)" ${ln}/><path d="M12,5.8 L17.2,11.2 H14.2 V17.6 H9.8 V11.2 H6.8Z" fill="${CR}" ${ln}/>`,
  cal: `<rect x="3.4" y="5" width="17.2" height="15.6" rx="2.6" fill="url(#c)" ${ln}/><path d="M3.4,10 V7.6 A2.6,2.6 0 0 1 6,5 H18 A2.6,2.6 0 0 1 20.6,7.6 V10Z" fill="url(#g)" ${ln}/>
    <rect x="7.2" y="2.8" width="1.8" height="4.4" rx=".9" fill="${TEAL2}"/><rect x="15" y="2.8" width="1.8" height="4.4" rx=".9" fill="${TEAL2}"/>
    ${[[7.4, 13], [12, 13], [16.6, 13], [7.4, 16.8], [12, 16.8]].map(([x, y]) => `<rect x="${x - 1.2}" y="${y - 1.1}" width="2.4" height="2.2" rx=".6" fill="${TEAL}"/>`).join("")}<path d="${star(16.6, 16.9, 1.9, 0.85)}" fill="#f5b83d"/>`,
  books: `<rect x="3.4" y="6" width="4.2" height="14.6" rx=".8" fill="url(#t)" ${ln}/><rect x="7.6" y="3.8" width="4.6" height="16.8" rx=".8" fill="url(#g)" ${ln}/>
    <rect x="13.6" y="5" width="4.4" height="15.4" rx=".8" transform="rotate(14 15.8 12.7)" fill="#d97a5a" ${ln}/>
    <path d="M3.4,9 H7.6 M3.4,17.4 H7.6 M7.6,6.8 H12.2 M7.6,17.6 H12.2" stroke="${CR}" stroke-width="1"/><path d="M2.6,20.8 H21.4" stroke="${O}" stroke-width="1.4" stroke-linecap="round"/>`,
  book: `<path d="M1.8,7.2 V20.6 C6,19.4 9.4,19.8 12,21.2 C14.6,19.8 18,19.4 22.2,20.6 V7.2Z" fill="url(#t)" ${ln}/>
    <path d="M12,6.8 C9.4,5 6,4.6 3.2,5.4 V18.8 C6,18 9.4,18.4 12,20 Z M12,6.8 C14.6,5 18,4.6 20.8,5.4 V18.8 C18,18 14.6,18.4 12,20Z" fill="url(#c)" ${ln}/>
    <path d="M5.4,9 C7.4,8.6 9,9 10.2,9.8 M5.4,12 C7.4,11.6 9,12 10.2,12.8 M13.8,9.8 C15,9 16.6,8.6 18.6,9 M13.8,12.8 C15,12 16.6,11.6 18.6,12" stroke="#c9a25a" stroke-width=".8" fill="none" stroke-linecap="round"/>
    <path d="${star(16.2, 15.6, 1.6, 0.7)}" fill="#f5b83d"/>`,
  scroll: `<rect x="6" y="5" width="12" height="14" fill="url(#c)" ${ln}/><path d="M8.6,9 H15.4 M8.6,11.8 H15.4 M8.6,14.6 H13" stroke="#c9a25a" stroke-width="1" stroke-linecap="round"/>
    <rect x="3.6" y="3.2" width="16.8" height="3.6" rx="1.8" fill="url(#g)" ${ln}/><rect x="3.6" y="17.2" width="16.8" height="3.6" rx="1.8" fill="url(#g)" ${ln}/>`,
  wings: `<g transform="translate(5.4,20.4)">${[[18, 17], [38, 18], [58, 16], [78, 12.5]].map(([a, l]) => feather(a, l)).join("")}${[[28, 12], [50, 12], [70, 9.5]].map(([a, l]) => feather(a, l)).join("")}</g><circle cx="5.4" cy="20.4" r="1.4" fill="url(#g)" stroke="${O}" stroke-width=".7"/>`,
  trophy: `<path d="M7,5.8 H4.2 V7.6 A3.4,3.4 0 0 0 7.8,11 M17,5.8 H19.8 V7.6 A3.4,3.4 0 0 1 16.2,11" stroke="${O}" stroke-width="3" fill="none"/><path d="M7,5.8 H4.2 V7.6 A3.4,3.4 0 0 0 7.8,11 M17,5.8 H19.8 V7.6 A3.4,3.4 0 0 1 16.2,11" stroke="#f5b83d" stroke-width="1.5" fill="none"/>
    <path d="M6.6,3.4 H17.4 V9 A5.4,5.4 0 0 1 6.6,9Z" fill="url(#g)" ${ln}/><rect x="10.8" y="14" width="2.4" height="3.6" fill="#d99a2a" ${ln}/><rect x="7.2" y="17.4" width="9.6" height="3.4" rx="1" fill="url(#t)" ${ln}/><path d="${star(12, 8.4, 2.6, 1.15)}" fill="${CR}"/>`,
  mosque: `<path d="M12,1.6 V4.6" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/><path d="M6,13.2 C6,8.8 9,7.2 12,4.6 C15,7.2 18,8.8 18,13.2Z" fill="url(#g)" ${ln}/>
    <rect x="5" y="13" width="14" height="8.2" fill="url(#c)" ${ln}/><rect x="1.8" y="9" width="2.6" height="12.2" fill="url(#c)" ${ln}/><rect x="19.6" y="9" width="2.6" height="12.2" fill="url(#c)" ${ln}/>
    <path d="M1.8,9 L3.1,5.6 L4.4,9Z M19.6,9 L20.9,5.6 L22.2,9Z" fill="url(#g)" ${ln}/><path d="M10,21.2 V17.6 A2,2 0 0 1 14,17.6 V21.2Z" fill="url(#t)" stroke="${O}" stroke-width=".9"/>
    <path d="M6.8,15.6 V17 M17.2,15.6 V17" stroke="${TEAL}" stroke-width="1.4" stroke-linecap="round"/>`,
  save: `<path d="M4,14 V18.6 A1.8,1.8 0 0 0 5.8,20.4 H18.2 A1.8,1.8 0 0 0 20,18.6 V14" stroke="${O}" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4,14 V18.6 A1.8,1.8 0 0 0 5.8,20.4 H18.2 A1.8,1.8 0 0 0 20,18.6 V14" stroke="${CR}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10.4,3.2 H13.6 V9.8 H16.8 L12,15.2 L7.2,9.8 H10.4Z" fill="url(#g)" ${ln}/>`,
  open: `<path d="M4,14 V18.6 A1.8,1.8 0 0 0 5.8,20.4 H18.2 A1.8,1.8 0 0 0 20,18.6 V14" stroke="${O}" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4,14 V18.6 A1.8,1.8 0 0 0 5.8,20.4 H18.2 A1.8,1.8 0 0 0 20,18.6 V14" stroke="${CR}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10.4,15.2 H13.6 V8.6 H16.8 L12,3.2 L7.2,8.6 H10.4Z" fill="url(#g)" ${ln}/>`,
  folder: `<path d="M2.8,7 Q2.8,5.2 4.6,5.2 H9.4 L11.4,7.4 H19.4 Q21.2,7.4 21.2,9.2 V18.6 Q21.2,20.4 19.4,20.4 H4.6 Q2.8,20.4 2.8,18.6Z" fill="#c98a1b" ${ln}/>
    <rect x="5.2" y="8.4" width="13.6" height="6" rx=".6" fill="url(#c)" stroke="${O}" stroke-width=".7"/><path d="M2.8,11 H21.2 V18.6 Q21.2,20.4 19.4,20.4 H4.6 Q2.8,20.4 2.8,18.6Z" fill="url(#g)" ${ln}/>`,
  pin: `<path d="M12,21.8 C12,21.8 4.8,14.8 4.8,9.6 A7.2,7.2 0 0 1 19.2,9.6 C19.2,14.8 12,21.8 12,21.8Z" fill="url(#g)" ${ln}/><circle cx="12" cy="9.6" r="2.8" fill="url(#t)" ${ln}/>`,
  hand: `<path d="M10,14.6 V4.4 A1.7,1.7 0 0 1 13.4,4.4 V10.8 A1.6,1.6 0 0 1 16.6,11.2 V11.8 A1.6,1.6 0 0 1 19.6,12.4 V16.4 C19.6,19.8 17.2,22 14,22 H12.8 C10.6,22 9.2,21 8,19.4 L4.6,15.2 A1.6,1.6 0 0 1 7.1,13.2Z" fill="url(#c)" ${ln}/>
    <path d="M13.4,10.8 V13.6 M16.6,11.8 V14" ${thin}/><path d="M10.6,3.4 A1.2,1.2 0 0 1 12.8,3.6" stroke="#f5b83d" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  target: `<circle cx="11" cy="13" r="9" fill="url(#c)" ${ln}/><circle cx="11" cy="13" r="6" fill="url(#t)" stroke="${O}" stroke-width=".8"/><circle cx="11" cy="13" r="3" fill="url(#g)" stroke="${O}" stroke-width=".8"/>
    <path d="M11,13 L20,4" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/><path d="M11,13 L20,4" stroke="${CR}" stroke-width="1.2" stroke-linecap="round"/><path d="M18.4,3 L21,3 L21,5.6 L19.6,6.2 L17.8,4.4Z" fill="url(#g)" ${ln}/>`,
  gem: `<path d="M6.4,3.6 H17.6 L22,9.2 L12,21.4 L2,9.2Z" fill="url(#t)" ${ln}/><path d="M2,9.2 H22 M6.4,3.6 L9,9.2 L12,3.6 L15,9.2 L17.6,3.6 M9,9.2 L12,21.4 L15,9.2" stroke="#bff3e3" stroke-width=".9" fill="none" stroke-linejoin="round"/><path d="M5,8 L7,5" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`,
  globe: `<circle cx="12" cy="12" r="9.4" fill="url(#t)" stroke="url(#g)" stroke-width="2"/><circle cx="12" cy="12" r="10.4" fill="none" stroke="${O}" stroke-width=".7"/>
    <path d="M2.8,12 H21.2 M12,2.6 V21.4 M12,2.6 C7.6,7 7.6,17 12,21.4 M12,2.6 C16.4,7 16.4,17 12,21.4 M4.4,7.2 H19.6 M4.4,16.8 H19.6" stroke="${CR}" stroke-width=".9" fill="none" opacity=".85"/>`,
  timer: `<rect x="10.4" y="2.2" width="3.2" height="2.8" rx=".8" fill="url(#g)" ${ln}/><path d="M18.4,6.6 L19.8,5.2" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/><path d="M18.4,6.6 L19.8,5.2" stroke="#f5b83d" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="12" cy="13.6" r="8" fill="url(#g)" ${ln}/><circle cx="12" cy="13.6" r="5.9" fill="url(#c)" stroke="${O}" stroke-width=".8"/><path d="M12,13.6 V9.6 M12,13.6 L14.6,15.2" stroke="${O}" stroke-width="1.4" stroke-linecap="round"/><circle cx="12" cy="13.6" r=".9" fill="${TEAL}"/>`,
  sound: `<path d="M3.6,9.4 H7.4 L12.4,5 V19 L7.4,14.6 H3.6Z" fill="url(#g)" ${ln}/><path d="M15.4,9.2 A4,4 0 0 1 15.4,14.8 M18.2,6.4 A8,8 0 0 1 18.2,17.6" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M15.4,9.2 A4,4 0 0 1 15.4,14.8 M18.2,6.4 A8,8 0 0 1 18.2,17.6" stroke="${CR}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  medal: `<path d="M7,1.8 L12,10 L17,1.8 H13.6 L12,4.8 L10.4,1.8Z" fill="url(#t)" ${ln}/><circle cx="12" cy="14.8" r="7.2" fill="url(#g)" ${ln}/><circle cx="12" cy="14.8" r="5" fill="none" stroke="#c98a1b" stroke-width=".9"/><path d="${star(12, 15.1, 3.2, 1.4)}" fill="${CR}" stroke="${O}" stroke-width=".5"/>`,
  bolt: `<path d="M13.6,1.8 L4.6,13.6 H10.8 L9.4,22.2 L19.4,9.6 H13Z" fill="url(#g)" ${ln}/><path d="M12.2,4.6 L7.6,11" stroke="#fff3c4" stroke-width="1.2" stroke-linecap="round"/>`,
  rocket: `<g transform="rotate(45 12 12)"><path d="M10,15.6 H14 L12,22.4Z" fill="url(#f)" ${ln}/><path d="M8.2,11.6 L5,16.2 V18.4 L8.6,15.8Z M15.8,11.6 L19,16.2 V18.4 L15.4,15.8Z" fill="url(#t)" ${ln}/>
    <path d="M12,1.8 C15.8,4.6 16.8,9 16.2,15.8 H7.8 C7.2,9 8.2,4.6 12,1.8Z" fill="url(#c)" ${ln}/><path d="M9.6,4.6 Q12,2.4 14.4,4.6" fill="url(#g)" stroke="${O}" stroke-width=".8"/><circle cx="12" cy="9.4" r="2.2" fill="url(#t)" stroke="#e09a26" stroke-width="1.2"/></g>`,
  moon: `<path d="M15.6,3.2 A9.2,9.2 0 1 0 20.8,16.4 A7.2,7.2 0 1 1 15.6,3.2Z" fill="url(#g)" ${ln}/><path d="${star(17.4, 9.2, 2.6, 1.1)}" fill="${CR}" stroke="${O}" stroke-width=".5"/><path d="M6,10 A6.6,6.6 0 0 1 9.4,5.6" stroke="#fff3c4" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  leaf: `<path d="M3.6,20.4 C3.6,10.4 9.6,3.6 20.6,3.6 C20.6,14.6 13.8,20.4 3.6,20.4Z" fill="url(#l)" ${ln}/><path d="M3.6,20.4 L16.6,7.6 M9,15 H13.4 M9,15 V10.6 M12.4,11.6 H16 M12.4,11.6 V8.2" stroke="#e8ffe6" stroke-width="1" fill="none" stroke-linecap="round" opacity=".9"/>`,
  tree: `<rect x="10.6" y="13.6" width="2.8" height="8" rx=".6" fill="#b47a2a" ${ln}/><path d="M12,2.2 C15.6,2.2 17.4,4.8 17.2,7 C20,7.6 21,10.6 19.6,12.8 C18.6,15.4 15.4,16 13.6,15 C12.6,16 11.4,16 10.4,15 C8.6,16 5.4,15.4 4.4,12.8 C3,10.6 4,7.6 6.8,7 C6.6,4.8 8.4,2.2 12,2.2Z" fill="url(#l)" ${ln}/>
    <circle cx="8.6" cy="9.6" r=".9" fill="#f5b83d"/><circle cx="15" cy="7.4" r=".9" fill="#f5b83d"/><circle cx="14.6" cy="12" r=".9" fill="#f5b83d"/><path d="M8,6.4 A4.4,4.4 0 0 1 11,4" stroke="#e8ffe6" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".8"/>`,
  palm: `<path d="M11.4,8.4 C12.6,12 12.4,17 11,21.8 H14.4 C15.4,17 15,12 13.2,8.4Z" fill="url(#g)" ${ln}/><path d="M11.6,12 H13.8 M11.9,15 H14.2 M11.8,18 H14.2" stroke="${O}" stroke-width=".7"/>
    <path d="M12.4,8.6 C9,5.4 4.6,5.6 2.4,9 C5.6,7.6 8.8,8.4 12.4,8.6Z M12.4,8.6 C15.8,5.4 20.2,5.6 22.4,9.2 C19.2,7.8 16,8.4 12.4,8.6Z M12.4,8.6 C10.8,4.8 7.6,2.6 4.8,3.4 C8,4.4 10.4,6.4 12.4,8.6Z M12.4,8.6 C14.4,4.6 17.8,2.8 20.4,3.8 C17.4,4.6 14.6,6.4 12.4,8.6Z M12.4,8.6 C9.6,9.4 7.4,11.6 7,14.4 C8.8,12.2 10.4,10.6 12.4,8.6Z M12.4,8.6 C15.4,9.6 17.4,11.8 17.6,14.4 C16,12.2 14.4,10.6 12.4,8.6Z" fill="url(#l)" ${ln}/>
    <circle cx="11.6" cy="9.6" r="1.1" fill="#9a5a1c" stroke="${O}" stroke-width=".5"/><circle cx="13.6" cy="9.8" r="1.1" fill="#9a5a1c" stroke="${O}" stroke-width=".5"/>`,
  sprout: `<path d="M12,20 V11" stroke="${O}" stroke-width="2.8" stroke-linecap="round"/><path d="M12,20 V11" stroke="#46ab7c" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M12,12 C12,7.4 8.6,5 3.8,5.4 C3.8,10 7,12.4 12,12Z M12,10.4 C12,6 15,3.4 20.2,3.6 C20.2,8.4 17,10.6 12,10.4Z" fill="url(#l)" ${ln}/><path d="M12,12 L6.6,7.6 M12,10.4 L17.4,6" stroke="#e8ffe6" stroke-width=".9" stroke-linecap="round"/>
    <path d="M5,21.4 Q5,18 12,18 Q19,18 19,21.4Z" fill="url(#g)" ${ln}/>`,
  halo: face(`<ellipse cx="12" cy="3.4" rx="6.2" ry="2" fill="none" stroke="${O}" stroke-width="2.8"/><ellipse cx="12" cy="3.4" rx="6.2" ry="2" fill="none" stroke="#fff1b0" stroke-width="1.4"/>
    <path d="M8,12 Q9.2,10.8 10.4,12 M13.6,12 Q14.8,10.8 16,12" ${thin} stroke-width="1.2"/><path d="M8.8,15.4 Q12,18.6 15.2,15.4" ${thin} stroke-width="1.2"/><circle cx="7.4" cy="14.6" r="1.2" fill="${PINK}" opacity=".6"/><circle cx="16.6" cy="14.6" r="1.2" fill="${PINK}" opacity=".6"/>`, 13.4),
  miss: face(`<circle cx="9.2" cy="12" r="2.3" fill="${O}"/><circle cx="14.8" cy="12" r="2.3" fill="${O}"/><circle cx="9.9" cy="11.2" r=".9" fill="#fff"/><circle cx="15.5" cy="11.2" r=".9" fill="#fff"/>
    <path d="M7.4,9.4 L10,8.4 M16.6,9.4 L14,8.4" ${thin}/><path d="M10.6,16.6 Q12,15.6 13.4,16.6" ${thin} stroke-width="1.1"/>`),
  sad: face(`<circle cx="9.2" cy="11.6" r="1.1" fill="${O}"/><circle cx="14.8" cy="11.6" r="1.1" fill="${O}"/><path d="M9.2,16.8 Q12,14.6 14.8,16.8" ${thin} stroke-width="1.2"/>
    <path d="M16.8,13.4 C16.8,13.4 15.4,15.4 15.4,16.2 A1.4,1.4 0 0 0 18.2,16.2 C18.2,15.4 16.8,13.4 16.8,13.4Z" fill="${BLUE}" stroke="${O}" stroke-width=".6"/>`),
  upset: face(`<path d="M7.6,11.6 Q9.2,10.2 10.6,11.6 M13.4,11.6 Q14.8,10.2 16.4,11.6" ${thin} stroke-width="1.2"/><ellipse cx="12" cy="16.2" rx="2.4" ry="1.8" fill="${O}"/>
    <path d="M8.4,12.6 V20.6 M15.6,12.6 V20.6" stroke="${BLUE}" stroke-width="1.8" stroke-linecap="round"/>`),
  love: face(`<path d="M7.8,12 Q9.2,10.6 10.6,12 M13.4,12 Q14.8,10.6 16.2,12" ${thin} stroke-width="1.2"/><path d="M8.8,15 Q12,18.4 15.2,15" ${thin} stroke-width="1.2"/>
    ${heart(19.6, 5.6, 0.75)}${heart(4.2, 18, 0.62)}${heart(20.4, 16.4, 0.55)}`),
  party: `<path d="M2.6,21.4 L7.6,8.6 L15.4,16.4Z" fill="url(#g)" ${ln}/><path d="M5.4,14.4 L9.6,18.6 M4,18 L6,20" stroke="${TEAL}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M10.6,8.4 C11.4,5.6 10,4.4 11.6,2.6 M15.6,13.4 C18.4,12.6 19.6,14 21.4,12.4 M13,10.4 C15.4,8 17,8.6 18.4,6" stroke="${O}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M10.6,8.4 C11.4,5.6 10,4.4 11.6,2.6 M15.6,13.4 C18.4,12.6 19.6,14 21.4,12.4 M13,10.4 C15.4,8 17,8.6 18.4,6" stroke="${PINK}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <circle cx="16.6" cy="3.6" r="1" fill="${CR}"/><circle cx="20.6" cy="8.6" r="1" fill="#5fc9ad"/><rect x="18.6" y="17.2" width="1.8" height="1.8" rx=".3" transform="rotate(20 19.5 18.1)" fill="#f5b83d"/><path d="${spark(6.4, 4.4, 2)}" fill="#ffe08a"/>`,
  warn: `<path d="M10.4,3.6 A1.8,1.8 0 0 1 13.6,3.6 L21.8,18.4 A1.8,1.8 0 0 1 20.2,21 H3.8 A1.8,1.8 0 0 1 2.2,18.4Z" fill="url(#g)" ${ln}/><rect x="10.9" y="8.2" width="2.2" height="7" rx="1.1" fill="${O}"/><circle cx="12" cy="17.8" r="1.25" fill="${O}"/>`,
  signal: `<path d="M3.6,10.2 A8.6,8.6 0 0 0 13.8,20.4Z" fill="url(#g)" ${ln}/><path d="M8.6,15.4 L12.4,11.6" stroke="${O}" stroke-width="1.4" stroke-linecap="round"/><circle cx="13" cy="11" r="1.3" fill="url(#t)" ${ln}/>
    <path d="M14.8,6.6 A4.4,4.4 0 0 1 17.4,9.2 M15.4,2.8 A8,8 0 0 1 21.2,8.6" stroke="${O}" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M14.8,6.6 A4.4,4.4 0 0 1 17.4,9.2 M15.4,2.8 A8,8 0 0 1 21.2,8.6" stroke="${CR}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  check: `<circle cx="12" cy="12" r="9.6" fill="url(#t)" ${ln}/><path d="M7.4,12.4 L10.6,15.6 L16.8,8.8" stroke="${O}" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.4,12.4 L10.6,15.6 L16.8,8.8" stroke="url(#g)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  bulb: `<path d="M12,1.6 V2.8 M3.8,5 L4.8,5.8 M20.2,5 L19.2,5.8 M2,11 H3.2 M20.8,11 H22" stroke="#ffe08a" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M12,4 A6.6,6.6 0 0 0 8.2,16 V17.4 H15.8 V16 A6.6,6.6 0 0 0 12,4Z" fill="url(#g)" ${ln}/><path d="M10.4,17.2 V13.4 L12,14.6 L13.6,13.4 V17.2" stroke="${O}" stroke-width=".9" fill="none" stroke-linejoin="round"/>
    <rect x="8.4" y="17.4" width="7.2" height="1.8" rx=".6" fill="url(#c)" ${ln}/><rect x="9.4" y="19.2" width="5.2" height="1.9" rx=".8" fill="#d8c9a6" ${ln}/><path d="M9,7.6 A4,4 0 0 1 11,6.2" stroke="#fff3c4" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
};

// Every emoji the app uses, mapped to its icon.
export const EMOJI = {
  "📿": "tasbih", "⚖️": "scale", "⚖": "scale", "👑": "crown", "🔒": "lock", "🧭": "compass", "🧠": "brain", "🔥": "fire",
  "⭐": "star", "🌟": "star2", "✨": "sparkle", "🎁": "gift", "⬆️": "up", "⬆": "up", "📅": "cal", "🗓️": "cal", "🗓": "cal",
  "📚": "books", "📖": "book", "📜": "scroll", "🪽": "wings", "🏆": "trophy", "🕌": "mosque", "💾": "save", "📂": "open",
  "🗂": "folder", "🗂️": "folder", "📍": "pin", "👆": "hand", "🎯": "target", "💎": "gem", "🌐": "globe", "⏱": "timer", "⏱️": "timer",
  "🔊": "sound", "💪": "medal", "⚡": "bolt", "🚀": "rocket", "🌙": "moon", "🍃": "leaf", "🌳": "tree", "🌴": "palm",
  "🌱": "sprout", "😇": "halo", "🥺": "miss", "😢": "sad", "😭": "upset", "🥰": "love", "🎉": "party", "⚠️": "warn", "⚠": "warn",
  "📡": "signal", "✅": "check", "💡": "bulb",
};
export const ICON_NAMES = Object.keys(ICONS);

const cache = {};
export const iconXml = name => cache[name] || (cache[name] = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${DEFS}${ICONS[name]}</svg>`);

export const Icon = memo(function Icon({ name, size = 24, style }) {
  if (!ICONS[name]) return null;
  return <View style={[{ width: size, height: size }, style]}><SvgXml xml={iconXml(name)} width={size} height={size} /></View>;
});

// An emoji from the data, drawn as its icon (or as text, for a symbol with no icon such as ✦ or ★).
export function Glyph({ e, size = 24, style, textStyle }) {
  const name = EMOJI[e];
  if (name) return <Icon name={name} size={size} style={style} />;
  return <Text style={[{ fontSize: size * 0.85 }, textStyle, style]}>{e}</Text>;
}

// Splits a leading emoji off a label: "🕌 Prayer times" → ["mosque", "Prayer times"].
export function splitIcon(str) {
  if (typeof str !== "string") return [null, str];
  const m = str.match(/^(\S+)\s+([\s\S]*)$/);
  return m && EMOJI[m[1]] ? [EMOJI[m[1]], m[2]] : [null, str];
}

// A line of text that may start with an emoji; the emoji becomes an icon in front of the text.
export function IconText({ children, size = 16, style, gap = 6, center }) {
  const [name, rest] = splitIcon(children);
  if (!name) return <Text style={style}>{children}</Text>;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap, justifyContent: center ? "center" : undefined, flexShrink: 1 }}>
      <Icon name={name} size={size} />
      <Text style={[style, { flexShrink: 1 }]}>{rest}</Text>
    </View>
  );
}
