"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { baseApi } from "@/services/client/base-api";
import {
  connectRealtimeSocket,
  disconnectRealtimeSocket,
  userIdFromAccessToken,
} from "@/lib/realtime-socket";
import { authToken } from "@/utils/authToken";

const CHAT_EVENTS = [
  "newMessage",
  "newChat",
  "chatDeletedForUser",
  "unreadCountUpdate",
  "chatListUpdate",
  "messagePinned",
  "messageUnpinned",
] as const;

const LIVE_EVENTS = {
  ticketUpdated: ["Support"],
  bookingUpdated: ["Bookings", "Jobs"],
  jobUpdated: ["Jobs", "Quotes"],
  quoteUpdated: ["Quotes", "Jobs", "Bookings"],
} as const;

type LiveTag =
  | "Chats"
  | "Messages"
  | "Notifications"
  | "Support"
  | "Bookings"
  | "Jobs"
  | "Quotes";

export function RealtimeSync() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const pending = useRef(new Set<LiveTag>());
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const token = authToken.getAccessToken();
    if (!token || token === "demo-token") return;
    const id =
      userIdFromAccessToken(token) ||
      (userId && !userId.startsWith("pending-") ? userId : "");
    if (!id) return;

    const socket = connectRealtimeSocket(token);
    let connectedOnce = false;

    const bump = (tags: LiveTag[]) => {
      tags.forEach((tag) => pending.current.add(tag));
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const next = [...pending.current];
        pending.current.clear();
        if (next.length) dispatch(baseApi.util.invalidateTags(next));
      }, 150);
    };

    const onConnect = () => {
      socket.emit("register", { userId: id });
      if (connectedOnce) {
        bump([
          "Chats",
          "Messages",
          "Notifications",
          "Support",
          "Bookings",
          "Jobs",
          "Quotes",
        ]);
      }
      connectedOnce = true;
    };

    const refreshChat = () => bump(["Chats", "Messages"]);

    const tagsForNotification = (payload: unknown): LiveTag[] => {
      const record =
        payload && typeof payload === "object"
          ? (payload as { referenceModel?: unknown; title?: unknown; text?: unknown })
          : {};
      const model = String(record.referenceModel || "").toLowerCase();
      const title = `${record.title || ""} ${record.text || ""}`.toLowerCase();
      const tags = new Set<LiveTag>(["Notifications"]);
      if (
        model === "jobrequest" ||
        model === "quotation" ||
        title.includes("job request") ||
        title.includes("quotation") ||
        title.includes("request declined")
      ) {
        tags.add("Jobs");
        tags.add("Quotes");
      }
      if (
        model === "booking" ||
        title.includes("booking") ||
        title.includes("appointment") ||
        title.includes("on the way") ||
        title.includes("work ")
      ) {
        tags.add("Bookings");
        tags.add("Jobs");
      }
      if (model === "support" || title.includes("ticket")) tags.add("Support");
      return [...tags];
    };

    const onAny = (eventName: string, payload: unknown) => {
      if (eventName === `send-notification::${id}`) {
        bump(tagsForNotification(payload));
        return;
      }
      const live = (Object.keys(LIVE_EVENTS) as (keyof typeof LIVE_EVENTS)[]).find(
        (name) => eventName === `${name}::${id}`,
      );
      if (live) bump([...LIVE_EVENTS[live]]);
    };

    const onReconnectAttempt = () => {
      const latest = authToken.getAccessToken();
      if (!latest) return;
      socket.auth = { token: latest };
      const opts = socket.io.opts as { query?: Record<string, string> };
      opts.query = { ...(opts.query || {}), token: latest };
    };

    socket.on("connect", onConnect);
    if (socket.connected) onConnect();
    for (const name of CHAT_EVENTS) {
      socket.on(`${name}::${id}`, refreshChat);
    }
    socket.onAny(onAny);
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      socket.off("connect", onConnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      for (const name of CHAT_EVENTS) socket.off(`${name}::${id}`, refreshChat);
      socket.offAny(onAny);
      disconnectRealtimeSocket();
    };
  }, [dispatch, userId]);

  return null;
}
