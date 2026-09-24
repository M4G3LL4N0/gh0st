import React, { type HTMLAttributes } from "react";
import { cn } from "./utils.js";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      secondary: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      destructive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      outline: "border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300",
      success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", ...props }, ref) => {
    const sizes = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-lg"
    };

    const [imageError, setImageError] = React.useState(false);

    if (src && !imageError) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative inline-flex shrink-0 overflow-hidden rounded-full",
            sizes[size],
            className
          )}
          {...props}
        >
          <img
            src={src}
            alt={alt || ""}
            onError={() => setImageError(true)}
            className="aspect-square h-full w-full object-cover"
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-gray-100 font-medium text-gray-700",
          "dark:bg-gray-700 dark:text-gray-300",
          sizes[size],
          className
        )}
        {...props}
      >
        {fallback || alt?.charAt(0).toUpperCase() || "?"}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export interface SeparatorProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <hr
      ref={ref}
      className={cn(
        "shrink-0 bg-gray-200 border-0",
        "dark:bg-gray-700",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      {...props}
    />
  )
);

Separator.displayName = "Separator";