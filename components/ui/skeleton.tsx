"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// Minimal skeleton component used for loading placeholders across the app.
// It intentionally keeps styling generic; individual usages can override
// width/height/border-radius via the `className` prop.

const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("animate-pulse rounded-md bg-gray-700/70", className)}
      {...props}
    />
  ),
);

Skeleton.displayName = "Skeleton";

export { Skeleton };
