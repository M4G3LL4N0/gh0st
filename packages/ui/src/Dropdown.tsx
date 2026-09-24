import React, { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "./utils.js";

interface DropdownContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within Dropdown");
  }
  return context;
}

export interface DropdownProps {
  children: ReactNode;
}

export const Dropdown = ({ children }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        contentRef.current && !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
};

export interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const DropdownTrigger = ({ children, className, ...props }: DropdownTriggerProps) => {
  const { open, setOpen, triggerRef } = useDropdownContext();

  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="true"
      aria-expanded={open}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium",
        "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
};

export interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: "start" | "end";
  sideOffset?: number;
}

export const DropdownContent = ({ children, className, align = "start", sideOffset = 4, ...props }: DropdownContentProps) => {
  const { open, contentRef, triggerRef } = useDropdownContext();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const content = contentRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    let left = trigger.left;
    if (align === "end") {
      left = trigger.right - content.width;
    }

    if (left + content.width > viewportWidth - 8) {
      left = viewportWidth - content.width - 8;
    }
    if (left < 8) left = 8;

    setPosition({
      top: trigger.bottom + sideOffset,
      left
    });
  }, [open, align, sideOffset]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "fixed z-50 min-w-[8rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg",
        "dark:border-gray-700 dark:bg-gray-800",
        "animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
        className
      )}
      style={{ top: position.top, left: position.left }}
      {...props}
    >
      {children}
    </div>
  );
};

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
}

export const DropdownItem = ({ className, inset, children, onClick, ...props }: DropdownItemProps) => {
  const { setOpen } = useDropdownContext();

  return (
    <button
      className={cn(
        "flex w-full items-center px-3 py-2 text-sm text-gray-700",
        "hover:bg-gray-100 focus:outline-none focus:bg-gray-100",
        "dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700",
        inset && "pl-8",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export interface DropdownSeparatorProps extends React.HTMLAttributes<HTMLHRElement> {}

export const DropdownSeparator = ({ className, ...props }: DropdownSeparatorProps) => (
  <hr className={cn("h-px my-1 bg-gray-200 dark:bg-gray-700", className)} {...props} />
);

export interface DropdownLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  inset?: boolean;
}

export const DropdownLabel = ({ className, inset, children, ...props }: DropdownLabelProps) => (
  <span
    className={cn("px-3 py-2 text-xs font-medium text-gray-500", inset && "pl-8", className)}
    {...props}
  >
    {children}
  </span>
);