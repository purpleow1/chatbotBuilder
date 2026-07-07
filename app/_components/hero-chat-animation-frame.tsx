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

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        setIsActive((current) => {
          if (entry.intersectionRatio >= 0.45) {
            return true;
          }

          if (!entry.isIntersecting || entry.intersectionRatio <= 0.05) {
            return false;
          }

          return current;
        });
      },
      { threshold: [0, 0.05, 0.45] }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(isActive && "hero-chat-active", className)}>
      {children}
    </div>
  );
}
