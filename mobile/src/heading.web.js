// Compass heading in the browser. iPhone Safari gives webkitCompassHeading after the person allows
// "Motion & Orientation" in a tap (askHeading); Android Chrome gives deviceorientationabsolute.
const DOE = typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined;
let granted = !(DOE && typeof DOE.requestPermission === "function");

export const headingNeedsTap = () => !granted;
// Must run inside a tap.
export async function askHeading() {
  if (granted) return true;
  try { granted = (await DOE.requestPermission()) === "granted"; } catch (e) { granted = false; }
  return granted;
}

export async function watchHeading(cb) {
  if (typeof window === "undefined" || !DOE) throw new Error("no compass");
  if (!granted) throw new Error("needs a tap");
  const onEvent = e => {
    let v = null;
    if (typeof e.webkitCompassHeading === "number" && e.webkitCompassHeading >= 0) v = e.webkitCompassHeading;
    else if (e.absolute && typeof e.alpha === "number") v = (360 - e.alpha) % 360;
    if (v == null) return;
    // Turned sideways, the top of the screen points elsewhere.
    const turn = (window.screen && window.screen.orientation && window.screen.orientation.angle) || 0;
    cb((v + turn + 360) % 360);
  };
  const ev = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
  window.addEventListener(ev, onEvent);
  return { remove: () => window.removeEventListener(ev, onEvent) };
}
