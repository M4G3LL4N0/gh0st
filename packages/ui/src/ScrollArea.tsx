import React, { useRef, useEffect, type ReactNode, type HTMLAttributes } from "react";
import { cn } from "./utils.js";

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  type?: "auto" | "always" | "hover" | "scroll";
  scrollHideDelay?: number;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, type = "auto", scrollHideDelay = 1000, ...props }, ref) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const [showScrollbar, setShowScrollbar] = React.useState(false);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const show = () => {
      setShowScrollbar(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };

    const hide = () => {
      if (type === "always") return;
      hideTimeoutRef.current = setTimeout(() => setShowScrollbar(false), scrollHideDelay);
    };

    const handleScroll = () => {
      if (!viewportRef.current || !thumbRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      thumbRef.current.style.transform = `translateY(${scrollPercentage * 100}%)`;
      const thumbHeight = (clientHeight / scrollHeight) * 100;
      thumbRef.current.style.height = `${Math.max(thumbHeight, 20)}%`;
      show();
    };

    const handleWheel = (e: React.WheelEvent) => {
      if (type === "scroll") {
        show();
      }
    };

    const handleMouseEnter = () => {
      if (type === "hover" || type === "auto") show();
    };

    const handleMouseLeave = () => {
      if (type === "hover" || type === "auto") hide();
    };

    useEffect(() => {
      handleScroll();
      return () => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      };
    }, []);

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <div
          ref={viewportRef}
          className="h-full w-full overflow-auto"
          onScroll={handleScroll}
          onWheel={handleWheel}
        >
          {children}
        </div>
        <div
          ref={scrollbarRef}
          className={cn(
            "fixed right-1 top-1 bottom-1 w-2 rounded-full bg-transparent transition-opacity duration-200 pointer-events-none",
            "dark:bg-transparent",
            showScrollbar ? "opacity-100" : "opacity-0"
          )}
          style={{ right: 4, top: 4, bottom: 4 }}
        >
          <div
            ref={thumbRef}
            className="relative w-full rounded-full bg-gray-400/50 hover:bg-gray-400 transition-colors"
            style={{ transformOrigin: "top center" }}
          />
        </div>
      </div>
    );
  }
);

ScrollArea.displayName = "ScrollArea";