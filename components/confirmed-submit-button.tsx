"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmedSubmitButtonProps = ButtonProps & {
  cancelLabel?: string;
  confirmActionLabel?: string;
  confirmMessage: string;
  confirmTitle?: string;
  pendingLabel: string;
};

export function ConfirmedSubmitButton({
  cancelLabel = "Cancel",
  children,
  confirmActionLabel = "Delete",
  confirmMessage,
  confirmTitle = "Confirm deletion",
  onClick,
  pendingLabel,
  ...props
}: ConfirmedSubmitButtonProps) {
  const { pending } = useFormStatus();
  const [isConfirming, setIsConfirming] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const descriptionId = useId();
  const titleId = useId();

  useEffect(() => {
    if (!isConfirming) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsConfirming(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isConfirming]);

  function handleConfirm() {
    setIsConfirming(false);
    buttonRef.current?.form?.requestSubmit(buttonRef.current);
  }

  return (
    <>
      <Button
        ref={buttonRef}
        type="submit"
        disabled={pending}
        onClick={(event) => {
          onClick?.(event);

          if (event.defaultPrevented) {
            return;
          }

          event.preventDefault();
          setIsConfirming(true);
        }}
        {...props}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {pendingLabel}
          </>
        ) : (
          children
        )}
      </Button>

      {isConfirming ? (
        <div
          aria-describedby={descriptionId}
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-2xl">
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0 space-y-2">
                <h2 className="text-lg font-semibold" id={titleId}>
                  {confirmTitle}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground" id={descriptionId}>
                  {confirmMessage}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsConfirming(false)}>
                {cancelLabel}
              </Button>
              <Button type="button" variant="destructive" onClick={handleConfirm}>
                {confirmActionLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
