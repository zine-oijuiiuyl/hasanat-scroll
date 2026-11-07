// Web version of the expo-haptics calls the app makes (fx.js).
// iPhone Safari (iOS 18+) gives a light tick when a page flips a switch control inside a tap; there is no
// vibration API there. Android browsers have navigator.vibrate. Outside a tap (while scrolling) iOS
// stays silent, which is the same as the old web app.
export const ImpactFeedbackStyle = { Light: "light", Medium: "medium", Heavy: "heavy", Soft: "soft", Rigid: "rigid" };
export const NotificationFeedbackType = { Success: "success", Warning: "warning", Error: "error" };

let label = null;
function tick() {
  if (typeof document === "undefined") return;
  try {
    if (!label) {
      label = document.createElement("label");
      label.setAttribute("aria-hidden", "true");
      label.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("switch", "");
      input.tabIndex = -1;
      label.appendChild(input);
      document.body.appendChild(label);
    }
    label.click();
  } catch (e) {}
}
const vib = ms => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

export async function selectionAsync() { tick(); vib(8); }
export async function impactAsync(style) { tick(); vib(style === "heavy" ? 30 : style === "medium" ? 20 : 12); }
export async function notificationAsync() { tick(); setTimeout(tick, 90); vib([20, 60, 20]); }
