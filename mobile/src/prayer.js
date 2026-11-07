// Prayer times, worked out on the phone from its location (no server), with local reminders.
// Unlike the web app, the reminders are real iPhone notifications that ring even when the app is closed.
import * as Location from "expo-location";
import { addReminder, askNotify, clearReminders } from "./notify";
import { PR_NAMES, prayerDay, guessMethod } from "./web-data";
import { G, save, changed, toast } from "./game";
import { t } from "./i18n";
import { roundCoord } from "./safe";

export const pName = k => t("pr_" + k);
export const hhmm = d => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function nextPrayer(pr) {
  const now = Date.now();
  for (let off = 0; off < 2; off++) {
    const day = prayerDay(new Date(now + off * 864e5), pr);
    if (!day) return null;
    for (const i of [0, 2, 3, 4, 5]) if (day[i].getTime() > now) return { k: PR_NAMES[i], at: day[i], i };
  }
  return null;
}

// iOS keeps at most 64 pending notifications, so this books the next few days and is redone on every open.
export async function schedulePrayer() {
  try {
    await clearReminders("prayer-");
    const pr = G.life.prayer;
    if (!pr || !pr.remind) return;
    const now = Date.now();
    for (let off = 0; off < 5; off++) {
      const day = prayerDay(new Date(now + off * 864e5), pr);
      if (!day) return;
      for (const i of [0, 2, 3, 4, 5]) {
        const k = PR_NAMES[i], at = day[i].getTime() - (pr.before || 0) * 6e4;
        if (pr.on[k] === false || at < now + 5000) continue;
        await addReminder(`prayer-${k}-${at}`, at, t("prNotifT", { p: pName(k) }), pr.before ? t("prNotifSoon", { n: pr.before }) : t("prNotifNow"));
      }
    }
  } catch (e) {}
}

// Returns a message to show, or "" when it worked.
export async function askLocation() {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") return t("prDenied");
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const old = G.life.prayer || {};
    // Kept to about a kilometre (safe.js): enough for prayer times and the Qibla.
    G.life.prayer = { lat: roundCoord(pos.coords.latitude), lng: roundCoord(pos.coords.longitude), method: old.method || guessMethod(), hanafi: !!old.hanafi, remind: !!old.remind, before: old.before || 0, on: old.on || {} };
    save(); changed(); schedulePrayer();
    return prayerDay(new Date(), G.life.prayer) ? "" : t("prFar");
  } catch (e) {
    return t("prFail");
  }
}

export async function setReminders(onOff) {
  const pr = G.life.prayer;
  if (!pr) return "";
  let msg = "";
  if (onOff) {
    const k = await askNotify().catch(() => "prNoPerm");
    if (k) msg = t(k);
  }
  pr.remind = onOff; save(); changed(); schedulePrayer();
  return msg;
}

export function updatePrayer(patch) {
  const pr = G.life.prayer;
  if (!pr) return;
  Object.assign(pr, patch); save(); changed(); schedulePrayer();
}
export function setPrayerOn(k, v) {
  const pr = G.life.prayer;
  if (!pr) return;
  pr.on = { ...pr.on, [k]: v }; save(); changed(); schedulePrayer();
}
export { toast };
export { WEB_NOTE } from "./notify";
