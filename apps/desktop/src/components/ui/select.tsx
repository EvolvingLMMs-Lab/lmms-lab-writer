"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";

/* ── Root re-exports ── */
export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

/* ── Trigger ── */
export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    className?: string;
  }
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={`
      inline-flex items-center justify-between gap-2
      px-3 py-2 text-sm min-w-[140px] cursor-pointer
      border border-border bg-background
      hover:border-border-dark transition-colors
      focus:outline-none focus:border-foreground
      data-[placeholder]:text-muted-foreground
      disabled:cursor-not-allowed disabled:opacity-50
      ${className ?? ""}
    `.trim()}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <CaretDownIcon className="size-3.5 text-muted shrink-0" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

/* ── Content (dropdown) ── */
export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    className?: string;
  }
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={4}
      className={`
        z-[10000] overflow-hidden
        bg-background border border-border shadow-md
        ${position === "popper" ? "w-[var(--radix-select-trigger-width)] max-h-[min(var(--radix-select-content-available-height),240px)]" : ""}
        ${className ?? ""}
      `.trim()}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={position === "popper" ? "p-1" : "p-1"}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

/* ── Item ── */
export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    className?: string;
  }
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={`
      relative flex items-center gap-2
      px-2 py-1.5 text-sm cursor-pointer select-none outline-none
      text-foreground-secondary
      data-[highlighted]:bg-surface-secondary data-[highlighted]:text-foreground
      data-[state=checked]:font-medium
      data-[disabled]:pointer-events-none data-[disabled]:opacity-50
      ${className ?? ""}
    `.trim()}
    {...props}
  >
    <span className="w-4 shrink-0 flex items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="size-3.5" weight="bold" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";
