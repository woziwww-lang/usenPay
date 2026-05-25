"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { type ToastTone, useToastStore } from "@/shared/model/toast-store";

const toneClass: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

export function ToastViewport() {
  const messages = useToastStore((state) => state.messages);
  const dismissToast = useToastStore((state) => state.dismissToast);

  useEffect(() => {
    const timers = messages.map((message) => window.setTimeout(() => dismissToast(message.id), 3200));
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [dismissToast, messages]);

  if (messages.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 grid w-[min(360px,calc(100vw-2rem))] gap-3">
      {messages.map((message) => (
        <article
          className={`rounded-lg border p-3 shadow-panel transition duration-300 ${toneClass[message.tone]}`}
          key={message.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{message.title}</p>
              {message.description ? <p className="mt-1 text-sm opacity-80">{message.description}</p> : null}
            </div>
            <button
              aria-label="Dismiss message"
              className="rounded p-1 hover:bg-white/60"
              onClick={() => dismissToast(message.id)}
              type="button"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
