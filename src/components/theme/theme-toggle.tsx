"use client";

import { Moon, SunMedium } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  orientation?: "horizontal" | "vertical";
};

const THEME_TRANSITION_CLASS = "theme-changing";

export function ThemeToggle({
  className,
  orientation = "horizontal",
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const isVertical = orientation === "vertical";

  function handleToggleTheme() {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add(THEME_TRANSITION_CLASS);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        document.documentElement.classList.remove(THEME_TRANSITION_CLASS);
        timeoutRef.current = null;
      }, 450);
    }

    setTheme(isDark ? "light" : "dark");
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      className={cn(
        buttonVariants({ variant: "outline", size: "default" }),
        "relative rounded-full border-border/70 bg-card/85 px-1 shadow-sm hover:bg-muted",
        isVertical ? "h-[4.8rem] w-10 py-1" : "h-10 w-[4.8rem]",
        className,
      )}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={handleToggleTheme}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-0 text-muted-foreground/80",
          isVertical
            ? "flex flex-col items-center justify-between py-2"
            : "flex items-center justify-between px-2",
        )}
      >
        <SunMedium
          className={cn(
            "size-4 transition-opacity duration-300",
            isDark ? "opacity-35" : "opacity-100",
          )}
        />
        <Moon
          className={cn(
            "size-4 transition-opacity duration-300",
            isDark ? "opacity-100" : "opacity-35",
          )}
        />
      </span>

      <motion.span
        layout
        className={cn(
          "absolute top-1 left-1 flex size-8 items-center justify-center rounded-full bg-foreground text-background shadow-sm",
        )}
        animate={isVertical ? { y: isDark ? 36 : 0 } : { x: isDark ? 36 : 0 }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 28,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ opacity: 0, rotate: isDark ? 24 : -24, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: isDark ? -24 : 24, scale: 0.8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            {isDark ? (
              <Moon className="size-4" />
            ) : (
              <SunMedium className="size-4" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </motion.button>
  );
}
