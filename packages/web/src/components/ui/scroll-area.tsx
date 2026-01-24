"use client";

import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type { ComponentPropsWithoutRef } from "react";

type ScrollAreaProps = ComponentPropsWithoutRef<"div"> & {
  autoHide?: "never" | "scroll" | "leave" | "move";
};

export function ScrollArea({
  children,
  className = "",
  autoHide = "leave",
  ...props
}: ScrollAreaProps) {
  return (
    <OverlayScrollbarsComponent
      className={className}
      options={{
        scrollbars: {
          theme: "os-theme-monochrome",
          autoHide,
          autoHideDelay: 400,
        },
      }}
      {...props}
    >
      {children}
    </OverlayScrollbarsComponent>
  );
}
