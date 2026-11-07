// Offline support and home-screen install (sw.js). A file of its own so the page's CSP can stay script-src 'self'.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
}
