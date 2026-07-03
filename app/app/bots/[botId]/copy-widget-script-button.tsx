"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyWidgetScriptButtonProps = {
  script: string;
};

export function CopyWidgetScriptButton({ script }: CopyWidgetScriptButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyScript() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button type="button" variant="outline" onClick={copyScript}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : "Copy script"}
    </Button>
  );
}
