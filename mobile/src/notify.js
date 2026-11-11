// Prayer reminders as real phone notifications that ring even when the app is closed
// (notify.web.js: the browser version, which only rings while the page is open or in the background).
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const WEB_NOTE = false;

// The adhan notification is not shown while the app is open: the app plays the adhan itself (adhan.js).
Notifications.setNotificationHandler({
  handleNotification: async n => {
    const adhan = !!(n && n.request && n.request.content && n.request.content.data && n.request.content.data.adhan);
    return { shouldShowBanner: !adhan, shouldShowList: !adhan, shouldPlaySound: !adhan, shouldSetBadge: false };
  },
});

// Android only rings a notification with sound on a channel of high importance (Android 8+).
const CHANNEL = "prayer";
const base = { importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 250, 150, 250], lightColor: "#f5b83d" };   // eslint-disable-line import/namespace -- exported at run time from a .types file
// One channel per adhan voice, since Android fixes a channel's sound when it is made. The sound files are in
// the APK from version 2 on (app.json, expo-notifications "sounds"); on an older APK the channel would get the
// normal sound for good, so it is deleted again and the plain prayer channel is used.
const adhanChannels = {};
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync(CHANNEL, { name: "Prayer reminders", sound: "default", ...base }).catch(() => {});
}
async function adhanChannel(voice, sound) {
  if (Platform.OS !== "android") return CHANNEL;
  if (!(voice in adhanChannels)) {
    adhanChannels[voice] = (async () => {
      const id = "adhan-" + voice;
      try {
        await Notifications.setNotificationChannelAsync(id, { name: "Adhan (" + voice + ")", sound, ...base });
        const ch = await Notifications.getNotificationChannelAsync(id);
        if (ch && ch.sound === "custom") return id;
        await Notifications.deleteNotificationChannelAsync(id);
      } catch (e) {}
      return CHANNEL;
    })();
  }
  return adhanChannels[voice];
}

export async function clearReminders(prefix) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(all.filter(n => String(n.identifier).startsWith(prefix)).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}
// adhan: { voice, sound, k } to ring with the adhan (Android) and play it when tapped.
export async function addReminder(id, at, title, body, adhan) {
  const channelId = adhan ? await adhanChannel(adhan.voice, adhan.sound) : CHANNEL;
  return Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title, body,
      sound: adhan && Platform.OS === "android" ? adhan.sound : true,
      data: adhan ? { adhan: true, k: adhan.k, at } : {},
      ...(Platform.OS === "android" && adhan ? { priority: "max" } : null),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId },
  });
}
// Resolves to "" when allowed, or the key of the message to show.
export async function askNotify() {
  const p = await Notifications.requestPermissionsAsync().catch(() => ({ granted: false }));
  return p.granted ? "" : "prNoPerm";
}

// Tapping a notification (also the one that opened the app).
export function onNotificationTap(fn) {
  Notifications.getLastNotificationResponseAsync().then(r => {
    if (!r) return;
    fn(r.notification.request.content.data);
    Notifications.clearLastNotificationResponseAsync().catch(() => {});   // so the next start doesn't play it again
  }).catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener(r => fn(r.notification.request.content.data));
  return () => sub.remove();
}
