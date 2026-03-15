import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  // Auto-inject Firebase config into service worker
  const swContent = `importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "${env.VITE_FIREBASE_API_KEY}",
  authDomain: "${env.VITE_FIREBASE_AUTH_DOMAIN}",
  projectId: "${env.VITE_FIREBASE_PROJECT_ID}",
  messagingSenderId: "${env.VITE_FIREBASE_SENDER_ID}",
  appId: "${env.VITE_FIREBASE_APP_ID}",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/gold-icon.png",
  });
});
`
  writeFileSync(resolve(__dirname, 'public/firebase-messaging-sw.js'), swContent)

  return {
    plugins: [react()],
  }
})
