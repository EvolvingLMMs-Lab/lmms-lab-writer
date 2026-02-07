"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  className?: string;
}

export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={`
      peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center
      border border-border transition-colors
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-50
      data-[state=checked]:bg-foreground data-[state=checked]:border-foreground
      data-[state=unchecked]:bg-surface-secondary data-[state=unchecked]:hover:border-border-dark
      ${className ?? ""}
    `.trim()}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={`
        pointer-events-none block h-3.5 w-3.5 shadow-sm transition-transform
        data-[state=checked]:translate-x-[15px] data-[state=checked]:bg-background
        data-[state=unchecked]:translate-x-[3px] data-[state=unchecked]:bg-border-dark
      `.trim()}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
