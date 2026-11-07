// Prayer times, worked out on the phone from its location (no server), with local reminders.
// Unlike the web app, the reminders are real phone notifications that ring even when the app is closed.
import { Platform } from "react-native";
import * as Location from "expo-location";
import { addReminder, askNotify, clearReminders } from "./notify";
import { PR_NAMES, prayerDay, guessMethod, T } from "./web-data";
import { G, save, changed, toast } from "./game";
import { t } from "./i18n";
import { roundCoord } from "./safe";

// The permission messages name the iPhone's settings; Android phones get their own (my translations).
const ANDROID_PERM = {
  en: ["Location is blocked. Allow it in Settings → Apps → Hasanat Scroll → Permissions → Location, then try again.", "Notifications are blocked. Allow them in Settings → Apps → Hasanat Scroll → Notifications."],
  ar: ["الموقع محظور. اسمح به من الإعدادات ← التطبيقات ← Hasanat Scroll ← الأذونات ← الموقع، ثم حاول مرة أخرى.", "الإشعارات محظورة. اسمح بها من الإعدادات ← التطبيقات ← Hasanat Scroll ← الإشعارات."],
  fr: ["La localisation est bloquée. Autorise-la dans Paramètres → Applications → Hasanat Scroll → Autorisations → Position, puis réessaie.", "Les notifications sont bloquées. Autorise-les dans Paramètres → Applications → Hasanat Scroll → Notifications."],
  es: ["La ubicación está bloqueada. Permítela en Ajustes → Aplicaciones → Hasanat Scroll → Permisos → Ubicación y vuelve a intentarlo.", "Las notificaciones están bloqueadas. Permítelas en Ajustes → Aplicaciones → Hasanat Scroll → Notificaciones."],
  tr: ["Konum engellendi. Ayarlar → Uygulamalar → Hasanat Scroll → İzinler → Konum'dan izin ver ve tekrar dene.", "Bildirimler engellendi. Ayarlar → Uygulamalar → Hasanat Scroll → Bildirimler'den izin ver."],
  ur: ["مقام بند ہے۔ ترتیبات ← ایپس ← Hasanat Scroll ← اجازتیں ← مقام میں اجازت دیں، پھر دوبارہ کوشش کریں۔", "اطلاعات بند ہیں۔ ترتیبات ← ایپس ← Hasanat Scroll ← اطلاعات میں اجازت دیں۔"],
  id: ["Lokasi diblokir. Izinkan di Setelan → Aplikasi → Hasanat Scroll → Izin → Lokasi, lalu coba lagi.", "Notifikasi diblokir. Izinkan di Setelan → Aplikasi → Hasanat Scroll → Notifikasi."],
  bn: ["লোকেশন বন্ধ আছে। সেটিংস → অ্যাপস → Hasanat Scroll → অনুমতি → লোকেশন থেকে অনুমতি দাও, তারপর আবার চেষ্টা করো।", "নোটিফিকেশন বন্ধ আছে। সেটিংস → অ্যাপস → Hasanat Scroll → নোটিফিকেশন থেকে অনুমতি দাও।"],
  ru: ["Доступ к геолокации запрещён. Разреши его в Настройки → Приложения → Hasanat Scroll → Разрешения → Местоположение и попробуй снова.", "Уведомления отключены. Разреши их в Настройки → Приложения → Hasanat Scroll → Уведомления."],
  de: ["Der Standort ist blockiert. Erlaube ihn unter Einstellungen → Apps → Hasanat Scroll → Berechtigungen → Standort und versuche es erneut.", "Mitteilungen sind blockiert. Erlaube sie unter Einstellungen → Apps → Hasanat Scroll → Benachrichtigungen."],
};
if (Platform.OS === "android") for (const [l, [loc, notif]] of Object.entries(ANDROID_PERM)) if (T[l]) Object.assign(T[l].ui, { prDenied: loc, prNoPerm: notif });

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
