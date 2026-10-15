/* Receipt Cycle: shows push notifications while the site is closed or in the background.
   The public Firebase settings arrive in this file's address (?cfg=...), so nothing secret lives here. */
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

try {
  const cfg = JSON.parse(new URL(self.location.href).searchParams.get("cfg") || "{}");
  if (cfg.projectId) {
    firebase.initializeApp(cfg);
    // The message carries a `webpush.notification` and a link; Firebase shows it and opens the link on click.
    firebase.messaging();
  }
} catch (e) {
  /* a broken config must never break the site */
}
