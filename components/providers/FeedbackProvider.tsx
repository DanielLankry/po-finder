"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PendingMessage = {
  message: string;
  confirmation: boolean;
  resolve: (accepted: boolean) => void;
  trigger: HTMLElement | null;
};
type Feedback = {
  confirmAction: (message: string) => Promise<boolean>;
  notify: (message: string) => Promise<boolean>;
};
const FeedbackContext = createContext<Feedback | null>(null);

/** Queue branded dialogs so concurrent requests cannot replace an unanswered confirmation. */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const pending = useRef<PendingMessage[]>([]);
  const [current, setCurrent] = useState<PendingMessage | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const enqueue = useCallback((message: string, confirmation: boolean) => new Promise<boolean>((resolve) => {
    const item = { message, confirmation, resolve, trigger: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    pending.current.push(item);
    if (pending.current.length === 1) setCurrent(item);
  }), []);

  const finish = useCallback((accepted: boolean) => {
    const item = pending.current.shift();
    if (!item) return;
    lastTrigger.current = item.trigger;
    item.resolve(accepted);
    setCurrent(pending.current[0] ?? null);
  }, []);

  useEffect(() => () => {
    pending.current.splice(0).forEach((item) => item.resolve(false));
  }, []);

  const value = useMemo(() => ({
    confirmAction: (message: string) => enqueue(message, true),
    notify: (message: string) => enqueue(message, false),
  }), [enqueue]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Dialog open={!!current} onOpenChange={(open) => { if (!open) finish(false); }}>
        <DialogContent dir="rtl" showCloseButton={false} onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (lastTrigger.current?.isConnected) lastTrigger.current.focus();
        }}>
          <DialogTitle className="font-display text-3xl text-ink">{current?.confirmation ? "אישור הפעולה" : "עדכון מהמערכת"}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap break-words text-start text-sm leading-relaxed text-stone-700">{current?.message}</DialogDescription>
          <DialogFooter className="gap-3">
            {current?.confirmation && <Button variant="outline" onClick={() => finish(false)}>ביטול</Button>}
            <Button onClick={() => finish(true)}>{current?.confirmation ? "אישור" : "הבנתי"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FeedbackContext.Provider>
  );
}

/** Keep destructive handlers awaiting a real answer, just as with native confirm. */
export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback requires FeedbackProvider");
  return context;
}
