// The buddy seen from the side, facing right, for the "Remove sins" rock. Same colours and style as the
// front-facing buddy in web-data.js. The body and the arms are separate drawings so the arms, holding
// the pickaxe in both hands, can swing around the shoulder.
const SKIN = "#f1c7a0", INK = "#2b2118";

// The body is drawn in a 100 × 130 box; the arms in a box centred on the shoulder (ARM units each way).
export const SHOULDER = { f: [51, 76], m: [51, 74] };
export const ARM = 62;

const tierOf = st => st >= 5 ? 2 : st >= 3 ? 1 : 0;

// A folded wing on the back, from the stage the front-facing buddy grows wings.
function wing(st, x, y) {
  if (st < 3) return "";
  const s = [0, 0, 0, 0.62, 0.8, 0.95][st], gold = st >= 5;
  const f = (a, l, fill, stroke) => {
    const w = l * 0.19;
    return `<path transform="rotate(${a})" d="M0,0 C${-w},${-l * 0.3} ${-w},${-l * 0.78} 0,${-l} C${w},${-l * 0.78} ${w},${-l * 0.3} 0,0Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/>`;
  };
  const back = [[-28, 40], [-48, 44], [-68, 42], [-88, 36]].map(([a, l]) => f(a, l, "#dde6f2", "#b4c3da")).join("");
  const front = [[-38, 30], [-58, 32], [-78, 28]].map(([a, l]) => f(a, l, "#ffffff", gold ? "#f0cf7a" : "#c9d6e8")).join("");
  return `<g transform="translate(${x},${y}) scale(${s})">${back}${front}</g>`;
}

function halo(st, cx, cy) {
  if (st < 4) return "";
  return `<ellipse cx="${cx}" cy="${cy}" rx="15" ry="4.2" fill="none" stroke="#ffd35a" stroke-width="${st >= 5 ? 6 : 4}" opacity=".35"/>
    <ellipse cx="${cx}" cy="${cy}" rx="15" ry="4.2" fill="none" stroke="#f5b83d" stroke-width="${st >= 5 ? 3.2 : 2.2}" opacity="${st >= 5 ? 1 : 0.75}"/>`;
}

// One eye, a cheek, a nose and a smile, on a face that looks right.
const face = (ex, ey) => `
  <ellipse cx="${ex}" cy="${ey}" rx="2.7" ry="3.6" fill="${INK}"/><circle cx="${ex + 0.9}" cy="${ey - 1.4}" r="1.1" fill="#fff"/>
  <circle cx="${ex - 4}" cy="${ey + 9}" r="4.2" fill="#f59d9d" opacity=".5"/>
  <path d="M${ex + 1},${ey + 11} Q${ex + 4},${ey + 13.5} ${ex + 6.5},${ey + 10.5}" fill="none" stroke="#8a4b3a" stroke-width="1.7" stroke-linecap="round"/>`;

export function sideBody(gender, st, P) {
  const boy = gender !== "f";
  const tier = P[tierOf(st)];
  if (boy) {
    return `<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
      ${wing(st, 40, 78)}
      <ellipse cx="44" cy="126" rx="10" ry="4" fill="#3a2a22"/><ellipse cx="60" cy="126" rx="10" ry="4" fill="#3a2a22"/>
      <path d="M36,68 Q50,60 64,68 L72,123 Q51,129 29,123Z" fill="${tier.robe}" stroke="#0000001f" stroke-width="1.2"/>
      <path d="M58,64 L63,78" stroke="${tier.trim}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M31,117 Q51,124 70,117" fill="none" stroke="${tier.trim}" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="53" cy="44" r="21" fill="${SKIN}"/>
      <path d="M33,46 Q30,24 50,21 Q64,20 72,28 Q60,27 51,32 Q43,38 45,52 Q37,53 33,46Z" fill="${INK}"/>
      <ellipse cx="47" cy="46" rx="4.4" ry="5.2" fill="${SKIN}" stroke="#d9a47e" stroke-width="1.2"/>
      <path d="M32,35 Q35,16 54,16 Q72,17 75,32 Q55,25 32,35Z" fill="${tier.cap}" stroke="#cfc8b4" stroke-width="1.3"/>
      <path d="M32.5,33.5 Q55,24 74.5,30.5" fill="none" stroke="${tier.trim}" stroke-width="2.4"/>
      <circle cx="73.5" cy="46" r="2.6" fill="${SKIN}"/>
      ${face(66, 42)}
      ${halo(st, 54, 9)}
    </svg>`;
  }
  return `<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
    ${wing(st, 40, 80)}
    <ellipse cx="45" cy="126" rx="10" ry="4" fill="#4b3a63"/><ellipse cx="61" cy="126" rx="10" ry="4" fill="#4b3a63"/>
    <path d="M37,70 Q51,63 64,70 L73,123 Q51,129 28,123Z" fill="${tier.dress}" stroke="#0000001f" stroke-width="1.2"/>
    <path d="M33,98 Q51,103 68,98" fill="none" stroke="${tier.trim}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M30,117 Q51,124 71,117" fill="none" stroke="${tier.trim}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M51,16 C33,16 24,30 25,47 C25,59 21,68 28,76 Q48,84 67,76 C70,68 77,60 77,46 C77,28 68,16 51,16Z" fill="${tier.hijab}" stroke="#0000001f" stroke-width="1.2"/>
    <path d="M30,73 Q48,80 65,73" fill="none" stroke="#00000014" stroke-width="1.6"/>
    <ellipse cx="64" cy="45" rx="13.5" ry="16.5" fill="#00000022"/>
    <ellipse cx="64.5" cy="44.5" rx="12" ry="15" fill="${SKIN}"/>
    <circle cx="76" cy="46" r="2.5" fill="${SKIN}"/>
    ${face(69, 41)}
    ${halo(st, 51, 8)}
  </svg>`;
}

// Both arms reaching forward to the handle, drawn pointing right from the shoulder at (0, 0).
// The pickaxe head sits at the far end, its long point on the side that leads a downward swing.
export function sideArms(gender, st, P) {
  const tier = P[tierOf(st)];
  const sleeve = gender !== "f" ? tier.robe : tier.dress;
  const A = ARM;
  return `<svg viewBox="${-A} ${-A} ${2 * A} ${2 * A}" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="0" x2="52" y2="0" stroke="#6e4520" stroke-width="4.4" stroke-linecap="round"/>
    <line x1="12" y1="0" x2="52" y2="0" stroke="#b77c43" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M45,-24 Q58,-14 58,0 Q58,14 45,24 Q53,12 52.5,0 Q53,-12 45,-24Z" fill="#c9d1d9" stroke="#59626b" stroke-width="1.3" stroke-linejoin="round"/>
    <rect x="50" y="-4.5" width="8" height="9" rx="2" fill="#8d97a1" stroke="#59626b" stroke-width="1.1"/>
    <path d="M0,0 L18,0" stroke="#00000026" stroke-width="11.5" stroke-linecap="round"/>
    <path d="M0,0 L18,0" stroke="${sleeve}" stroke-width="9.5" stroke-linecap="round"/>
    <circle cx="19" cy="0" r="4.4" fill="${SKIN}" stroke="#d9a47e" stroke-width="0.8"/>
    <circle cx="26.5" cy="0" r="4.4" fill="${SKIN}" stroke="#d9a47e" stroke-width="0.8"/>
  </svg>`;
}

// Arm angles, in degrees from pointing straight ahead: wound up, resting over the shoulder, and on the rock.
export const SWING = { inputRange: [-0.25, 0, 1], outputRange: ["-152deg", "-126deg", "32deg"] };
