"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmedSubmitButtonProps = ButtonProps & {
  confirmMessage: string;
  pendingLabel: string;
};

export function ConfirmedSubmitButton({
  children,
  confirmMessage,
  onClick,
  pendingLabel,
  ...props
}: ConfirmedSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
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
  );
}
