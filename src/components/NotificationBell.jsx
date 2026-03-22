import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X, CheckCheck, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const TYPE_COLORS = {
  match: "bg-primary/10 text-primary",
  request: "bg-accent/10 text-accent",
  reservation: "bg-blue-500/10 text-blue-500",
  system: "bg-muted text-muted-foreground",
};

const TYPE_DOT = {
  match: "bg-primary",
  request: "bg-accent",
  reservation: "bg-blue-500",
  system: "bg-muted-foreground",
};

export default function NotificationBell({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const panelRef = useRef(null);

  // Request browser push permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((p) => setPermissionGranted(p === "granted"));
    } else if ("Notification" in window && Notification.permission === "granted") {
      setPermissionGranted(true);
    }
  }, []);

  // Load notifications
  useEffect(() => {
    if (!userEmail) return;
    base44.entities.Notification.filter({ user_email: userEmail }, "-created_date", 30)
      .then(setNotifications)
      .catch(() => {});
  }, [userEmail]);

  // Real-time subscription
  useEffect(() => {
    if (!userEmail) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email !== userEmail) return;
      if (event.type === "create") {
        setNotifications((prev) => [event.data, ...prev]);
        // Show browser push notification
        if (permissionGranted && document.hidden) {
          new Notification(event.data.title, {
            body: event.data.message,
            icon: "https://media.base44.com/images/public/69af676714ee0899079240af/b369c31da_fc25c6634_logo.png",
            badge: "https://media.base44.com/images/public/69af676714ee0899079240af/b369c31da_fc25c6634_logo.png",
          });
        }
      } else if (event.type === "update") {
        setNotifications((prev) =>
          prev.map((n) => (n.id === event.id ? event.data : n))
        );
      } else if (event.type === "delete") {
        setNotifications((prev) => prev.filter((n) => n.id !== event.id));
      }
    });
    return unsub;
  }, [userEmail, permissionGranted]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter((n) => !n.is_read);

  const markAllRead = async () => {
    const unreadOnes = notifications.filter((n) => !n.is_read);
    await Promise.all(unreadOnes.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (notif) => {
    if (!notif.is_read) {
      await base44.entities.Notification.update(notif.id, { is_read: true });
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
    }
    if (notif.link) window.location.href = notif.link;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Notificaciones</span>
              {unread.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {unread.length} nueva{unread.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Leídas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Sin notificaciones
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors flex gap-3 ${!notif.is_read ? "bg-primary/5" : ""}`}
                >
                  <div className="shrink-0 mt-1">
                    <div className={`w-2 h-2 rounded-full ${!notif.is_read ? TYPE_DOT[notif.type] || "bg-primary" : "bg-transparent"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium leading-snug ${!notif.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      {notif.link && <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}