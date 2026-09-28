import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { FiBell } from "react-icons/fi";
import { socketBaseURL } from "../baseUrl";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationPrefs,
  setNotificationPrefs,
} from "./api";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const socketRef = useRef(null);
  const token = localStorage.getItem("userToken");

  const refresh = async () => {
    if (!token) return;
    try {
      const { data } = await fetchNotifications();
      if (data.success) {
        setItems(data.data.notifications || []);
        setUnread(data.data.unreadCount || 0);
      }
    } catch {
      /* e.g. not logged in */
    }
  };

  useEffect(() => {
    refresh();
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    try {
      getNotificationPrefs().then(({ data }) => {
        if (data.success) setEmailOptIn(!!data.data.emailEnabled);
      });
    } catch {
      /* ignore */
    }

    const s = io(socketBaseURL(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = s;
    s.on("campus_notification", () => {
      refresh();
    });
    return () => {
      s.disconnect();
    };
  }, [token]);

  const onRead = async (id) => {
    try {
      await markNotificationRead(id);
      refresh();
    } catch {
      /* */
    }
  };

  const onReadAll = async () => {
    try {
      await markAllNotificationsRead();
      refresh();
    } catch {
      /* */
    }
  };

  const toggleEmail = async () => {
    const next = !emailOptIn;
    try {
      await setNotificationPrefs(next);
      setEmailOptIn(next);
    } catch {
      /* */
    }
  };

  if (!token) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) refresh();
        }}
        className="relative p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-slate-800 dark:text-slate-100"
      >
        <FiBell className="text-xl" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold flex items-center justify-center rounded-full bg-red-500 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col dark:border-slate-800">
            <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                Notifications
              </span>
              <button
                type="button"
                className="text-xs text-blue-600 dark:text-blue-400"
                onClick={onReadAll}
              >
                Mark all read
              </button>
            </div>
            <label className="flex items-center gap-2 px-3 py-2 text-xs border-b border-gray-100 dark:border-gray-800 cursor-pointer text-gray-700 dark:text-gray-300 dark:text-slate-300">
              <input type="checkbox" checked={emailOptIn} onChange={toggleEmail} />
              Email alerts (optional — server must set CAMPUS_NOTIFICATION_EMAILS=true)
            </label>
            <ul className="overflow-y-auto flex-1 text-sm">
              {items.length === 0 ? (
                <li className="p-4 text-gray-500 text-center dark:text-slate-400">No notifications yet</li>
              ) : (
                items.map((n) => (
                  <li
                    key={n.id}
                    className={`px-3 py-2 border-b border-gray-50 dark:border-gray-800 cursor-pointer ${
                      n.status === "unread" ? "bg-blue-50/80 dark:bg-blue-900/20" : ""
                    }`}
                    onClick={() => n.status === "unread" && onRead(n.id)}
                  >
                    <p className="text-gray-900 dark:text-gray-100 dark:text-white">{n.message}</p>
                    <p className="text-[10px] text-gray-500 mt-1 dark:text-slate-400">
                      {n.type} · {new Date(n.created_at).toLocaleString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
