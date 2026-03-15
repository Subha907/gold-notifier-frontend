importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBVqwIesRvwBYu0Tz69oP-H0HF1b4D6nzo",
  authDomain: "gold-notifier-1fad9.firebaseapp.com",
  projectId: "gold-notifier-1fad9",
  messagingSenderId: "371878580107",
  appId: "1:371878580107:web:4df85bc650dc404020e98e",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/gold-icon.png",
  });
});
