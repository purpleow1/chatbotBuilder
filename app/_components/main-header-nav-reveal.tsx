"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type HeaderNavLink = readonly [label: string, href: Route, key: string];

type MainHeaderNavRevealProps = {
  active?: string;
  links: readonly HeaderNavLink[];
};

export function MainHeaderNavReveal({ active, links }: MainHeaderNavRevealProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeKey, setActiveKey] = useState(active ?? links[0]?.[2]);

  useEffect(() => {
    const updateNavState = () => {
      if (window.scrollY > 12) {
        setHasScrolled(true);
      }

      const sectionOffset = 140;
      const scrollPosition = window.scrollY + sectionOffset;
      let currentKey = active ?? links[0]?.[2];

      for (const [, href, key] of links) {
        const hashIndex = href.indexOf("#");
        const sectionId = hashIndex >= 0 ? href.slice(hashIndex + 1) : "";
        const section = sectionId ? document.getElementById(sectionId) : null;

        if (section && section.offsetTop <= scrollPosition) {
          currentKey = key;
        }
      }

      setActiveKey(currentKey);
    };

    updateNavState();
    window.addEventListener("scroll", updateNavState, { passive: true });
    window.addEventListener("resize", updateNavState);

    return () => {
      window.removeEventListener("scroll", updateNavState);
      window.removeEventListener("resize", updateNavState);
    };
  }, [active, links]);

  return (
    <nav
      className={cn(
        "hidden items-center gap-1 transition duration-200 ease-out md:flex",
        hasScrolled ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0 pointer-events-none"
      )}
      aria-hidden={!hasScrolled}
    >
      {links.map(([label, href, key]) => (
        <Link
          key={label}
          href={href}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
            activeKey === key && "bg-muted text-foreground"
          )}
          tabIndex={hasScrolled ? undefined : -1}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
