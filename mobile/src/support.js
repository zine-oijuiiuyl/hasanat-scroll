// Optional "Support us" link on the Done screen (Zine, 2026-11-05: a donation button instead of ads).
// Put the donation page here, for example "https://ko-fi.com/yourname" or "https://buymeacoffee.com/yourname".
// While it is empty the button still shows, and a tap only says the link is coming soon.
export const SUPPORT_URL = "";

// Only https links to these donation sites are opened, so a typo can't send people somewhere else.
const HOSTS = ["ko-fi.com", "buymeacoffee.com", "www.buymeacoffee.com", "patreon.com", "www.patreon.com", "launchgood.com", "www.launchgood.com", "paypal.me", "www.paypal.me"];

export function supportLink(url = SUPPORT_URL) {
  if (typeof url !== "string" || url.length > 300) return null;
  let u;
  try { u = new URL(url); } catch (e) { return null; }
  if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
  return HOSTS.includes(u.hostname.toLowerCase()) ? u.href : null;
}
