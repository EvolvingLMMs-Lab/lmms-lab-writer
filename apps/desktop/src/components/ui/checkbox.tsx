"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@phosphor-icons/react";

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={`
      peer size-4 shrink-0 border cursor-pointer transition-colors
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-50
      data-[state=checked]:bg-black data-[state=checked]:border-black
      data-[state=unchecked]:border-neutral-300 data-[state=unchecked]:hover:border-black
      ${className ?? ""}
    `.trim()}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <CheckIcon className="size-3 text-white" weight="bold" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";
