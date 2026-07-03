"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastInput = Omit<Toast, "id" | "tone"> & {
  tone?: ToastTone;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID();
      const nextToast = {
        id,
        tone: toast.tone ?? "info",
        title: toast.title,
        description: toast.description
      };

      setToasts((current) => [...current.slice(-2), nextToast]);
      window.setTimeout(() => dismissToast(id), 5_000);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex gap-3 rounded-md border bg-card p-4 text-sm shadow-lg",
              toast.tone === "success" && "border-emerald-200",
              toast.tone === "error" && "border-destructive/30"
            )}
            role="status"
          >
            {toast.tone === "error" ? (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{toast.title}</p>
              {toast.description ? <p className="mt-1 text-muted-foreground">{toast.description}</p> : null}
            </div>
            <Button type="button" variant="ghost" size="icon" className="-mr-2 -mt-2 size-8" onClick={() => dismissToast(toast.id)}>
              <X className="size-4" />
              <span className="sr-only">Dismiss notification</span>
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return value;
}
