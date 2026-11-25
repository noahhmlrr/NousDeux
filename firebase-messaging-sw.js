importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDV4-fHCK5RWR9lUcqwpmibo2n6A9OWCGo",
  authDomain: "nousdeux-7915c.firebaseapp.com",
  projectId: "nousdeux-7915c",
  messagingSenderId: "726911335726",
  appId: "1:726911335726:web:8d9852ebd8606c8b764ebf"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const data = payload.data || {};
  return self.registration.showNotification(data.title || "Nous deux", {
    body: data.body || "Tu as un nouveau message.",
    icon: new URL("./icon-180.png", self.registration.scope).href,
    data: { url: data.url || "./" }
  });
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "./", self.registration.scope).href;
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const windowClient of windows) {
      if (windowClient.url.startsWith(self.registration.scope)) return windowClient.focus();
    }
    return clients.openWindow(url);
  })());
});
