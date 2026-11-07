// Prayer reminders on the web. A web page can't book a notification for later, so each reminder is a
// timer that shows a notification (through the service worker when there is one) while the page is open
// or in the background. iPhone Safari only allows notifications once the app is on the home screen.
export const WEB_NOTE = true;

const timers = new Map();
export async function clearReminders(prefix) {
  for (const [id, h] of timers) if (id.startsWith(prefix)) { clearTimeout(h); timers.delete(id); }
}
async function show(title, body) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
    const opts = { body, icon: "icon-192.png", badge: "icon-192.png", tag: "prayer" };
    if (reg && reg.showNotification) await reg.showNotification(title, opts);
    else new Notification(title, opts);
  } catch (e) {}
}
export async function addReminder(id, at, title, body) {
  const ms = at - Date.now();
  // Timers further off than a day are booked again on the next open.
  if (ms < 0 || ms > 864e5) return;
  timers.set(id, setTimeout(() => { timers.delete(id); show(title, body); }, ms));
}
export async function askNotify() {
  if (typeof Notification === "undefined") {
    const standalone = typeof navigator !== "undefined" && (navigator.standalone || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches));
    return standalone ? "prNoPerm" : "prAdd";
  }
  try {
    if (Notification.permission === "default") await Notification.requestPermission();
  } catch (e) {}
  return Notification.permission === "granted" ? "" : "prNoPerm";
}
