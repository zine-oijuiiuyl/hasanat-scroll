// Prayer reminders as real phone notifications that ring even when the app is closed
// (notify.web.js: the browser version, which only rings while the page is open or in the background).
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const WEB_NOTE = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

// Android only rings a notification with sound on a channel of high importance (Android 8+).
const CHANNEL = "prayer";
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync(CHANNEL, {
    name: "Prayer reminders",
    importance: Notifications.AndroidImportance.HIGH,   // eslint-disable-line import/namespace -- exported at run time from a .types file
    sound: "default",
    vibrationPattern: [0, 250, 150, 250],
    lightColor: "#f5b83d",
  }).catch(() => {});
}

export async function clearReminders(prefix) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(all.filter(n => String(n.identifier).startsWith(prefix)).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}
export function addReminder(id, at, title, body) {
  return Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: CHANNEL },
  });
}
// Resolves to "" when allowed, or the key of the message to show.
export async function askNotify() {
  const p = await Notifications.requestPermissionsAsync().catch(() => ({ granted: false }));
  return p.granted ? "" : "prNoPerm";
}
