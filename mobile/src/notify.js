// Prayer reminders as real phone notifications that ring even when the app is closed
// (notify.web.js: the browser version, which only rings while the page is open or in the background).
import * as Notifications from "expo-notifications";

export const WEB_NOTE = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function clearReminders(prefix) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(all.filter(n => String(n.identifier).startsWith(prefix)).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}
export function addReminder(id, at, title, body) {
  return Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
  });
}
// Resolves to "" when allowed, or the key of the message to show.
export async function askNotify() {
  const p = await Notifications.requestPermissionsAsync().catch(() => ({ granted: false }));
  return p.granted ? "" : "prNoPerm";
}
