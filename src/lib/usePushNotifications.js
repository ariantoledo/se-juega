import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

async function registerPush(userEmail) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  // Get VAPID public key from backend
  const keyRes = await base44.functions.invoke("getVapidPublicKey", {});
  const vapidPublicKey = keyRes.data?.publicKey;
  if (!vapidPublicKey) return;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();

  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  // Save subscription to DB
  const existing = await base44.entities.PushSubscription.filter({ user_email: userEmail });
  const subJson = JSON.stringify(sub.toJSON());

  if (existing.length === 0) {
    await base44.entities.PushSubscription.create({
      user_email: userEmail,
      subscription: subJson,
      user_agent: navigator.userAgent.substring(0, 200),
    });
  } else {
    await base44.entities.PushSubscription.update(existing[0].id, { subscription: subJson });
  }
}

export function usePushNotifications(userEmail) {
  useEffect(() => {
    if (!userEmail) return;

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(() => {
        registerPush(userEmail).catch(() => {});
      }).catch(() => {});
    }
  }, [userEmail]);
}