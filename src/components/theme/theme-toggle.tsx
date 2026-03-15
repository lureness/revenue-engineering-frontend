"use client";

import { Moon, SunMedium } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

const THEME_TRANSITION_CLASS = "theme-changing";

export function ThemeToggle({ className }: ThemeToggleProps) {
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
        "relative h-10 w-[4.8rem] rounded-full border-border/70 bg-card/85 px-1 shadow-sm hover:bg-muted",
        className,
      )}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={handleToggleTheme}
    >
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 text-muted-foreground/80">
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
        animate={{ x: isDark ? 36 : 0, rotate: isDark ? 180 : 0 }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 28,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
            transition={{ duration: 0.2 }}
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
