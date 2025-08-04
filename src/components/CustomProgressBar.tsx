"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface CustomProgressBarProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const CustomProgressBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  CustomProgressBarProps
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full bg-muted", // Track color set to bg-muted (grey)
      className // Additional classes for the track
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-transform duration-500 ease-in-out",
        indicatorClassName // Apply custom indicator color here
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
CustomProgressBar.displayName = "CustomProgressBar";

export { CustomProgressBar };