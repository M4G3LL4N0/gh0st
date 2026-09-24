import React, { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "./utils.js";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}

export const Tooltip = ({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 200
}: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (side) {
      case "top":
        top = trigger.top - tooltip.height - gap;
        left = trigger.left + (trigger.width - tooltip.width) / 2;
        break;
      case "bottom":
        top = trigger.bottom + gap;
        left = trigger.left + (trigger.width - tooltip.width) / 2;
        break;
      case "left":
        top = trigger.top + (trigger.height - tooltip.height) / 2;
        left = trigger.left - tooltip.width - gap;
        break;
      case "right":
        top = trigger.top + (trigger.height - tooltip.height) / 2;
        left = trigger.right + gap;
        break;
    }

    if (align === "start") {
      if (side === "top" || side === "bottom") left = trigger.left;
      else top = trigger.top;
    } else if (align === "end") {
      if (side === "top" || side === "bottom") left = trigger.right - tooltip.width;
      else top = trigger.bottom - tooltip.height;
    }

    if (left < 8) left = 8;
    if (left + tooltip.width > viewportWidth - 8) left = viewportWidth - tooltip.width - 8;
    if (top < 8) top = 8;
    if (top + tooltip.height > viewportHeight - 8) top = viewportHeight - tooltip.height - 8;

    setPosition({ top, left });
  };

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(true);
      requestAnimationFrame(updatePosition);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  return (
    <div
      ref={triggerRef}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {open && (
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-50 rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white shadow-lg",
            "animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
            "dark:bg-gray-100 dark:text-gray-900"
          )}
          style={{ top: position.top, left: position.left }}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};