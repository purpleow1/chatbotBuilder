"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type HeroChatAnimationFrameProps = {
  children: ReactNode;
  className?: string;
};

export function HeroChatAnimationFrame({ children, className }: HeroChatAnimationFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element || isActive) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.intersectionRatio >= 0.5) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [isActive]);

  return (
    <div ref={ref} className={cn(isActive && "hero-chat-active", className)}>
      {children}
    </div>
  );
}
