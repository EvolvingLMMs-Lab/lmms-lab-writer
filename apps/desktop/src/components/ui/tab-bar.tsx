"use client";

import { useCallback, useState } from "react";
import {
  X,
  XCircle,
  CaretLineLeft,
  CaretLineRight,
  Trash,
} from "@phosphor-icons/react";
import { ContextMenu, ContextMenuItem } from "./context-menu";

export interface TabItem {
  id: string;
  label: string;
  title?: string;
  badge?: string | number;
}

export interface TabBarProps<T extends TabItem> {
  tabs: T[];
  activeTab: string;
  onTabSelect: (id: string) => void;
  onTabClose?: (id: string) => void;
  onCloseOthers?: (id: string) => void;
  onCloseToLeft?: (id: string) => void;
  onCloseToRight?: (id: string) => void;
  onCloseAll?: () => void;
  variant?: "sidebar" | "editor";
  className?: string;
}

export function TabBar<T extends TabItem>({
  tabs,
  activeTab,
  onTabSelect,
  onTabClose,
  onCloseOthers,
  onCloseToLeft,
  onCloseToRight,
  onCloseAll,
  variant = "editor",
  className = "",
}: TabBarProps<T>) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      // Middle click to close
      if (e.button === 1 && onTabClose) {
        e.preventDefault();
        onTabClose(tabId);
      }
    },
    [onTabClose],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      if (onTabClose) {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, tabId });
      }
    },
    [onTabClose],
  );

  const getContextMenuItems = useCallback(
    (tabId: string): ContextMenuItem[] => {
      const tabIndex = tabs.findIndex((t) => t.id === tabId);
      const items: ContextMenuItem[] = [];

      if (onTabClose) {
        items.push({
          label: "Close",
          onClick: () => onTabClose(tabId),
          icon: <X className="w-4 h-4" />,
        });
      }

      if (onCloseOthers) {
        items.push({
          label: "Close Others",
          onClick: () => onCloseOthers(tabId),
          disabled: tabs.length <= 1,
          icon: <XCircle className="w-4 h-4" />,
        });
      }

      if (onCloseToLeft) {
        items.push({
          label: "Close to the Left",
          onClick: () => onCloseToLeft(tabId),
          disabled: tabIndex === 0,
          icon: <CaretLineLeft className="w-4 h-4" />,
        });
      }

      if (onCloseToRight) {
        items.push({
          label: "Close to the Right",
          onClick: () => onCloseToRight(tabId),
          disabled: tabIndex === tabs.length - 1,
          icon: <CaretLineRight className="w-4 h-4" />,
        });
      }

      if (onCloseAll) {
        items.push({
          label: "Close All",
          onClick: onCloseAll,
          danger: true,
          icon: <Trash className="w-4 h-4" />,
        });
      }

      return items;
    },
    [tabs, onTabClose, onCloseOthers, onCloseToLeft, onCloseToRight, onCloseAll],
  );

  if (variant === "sidebar") {
    return (
      <div className={`flex items-center border-b border-border ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className={`flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                isActive
                  ? "text-black border-b-2 border-black -mb-px"
                  : "text-muted hover:text-black"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className="ml-1 text-xs bg-neutral-200 px-1 tabular-nums">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Editor variant
  return (
    <>
      <div
        className={`flex items-center border-b border-border bg-neutral-50 overflow-x-auto min-h-[34px] ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <div
              key={tab.id}
              className={`group flex items-center border-r border-border transition-colors ${
                isActive
                  ? "bg-white text-black"
                  : "text-muted hover:text-black hover:bg-white/50"
              }`}
              title={tab.title ?? tab.label}
              onMouseDown={(e) => handleMouseDown(e, tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
            >
              <button
                onClick={() => onTabSelect(tab.id)}
                className="px-3 py-1.5 text-sm truncate max-w-[120px]"
              >
                {tab.label}
              </button>
              {onTabClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className={`w-6 h-full flex items-center justify-center hover:bg-neutral-200 ${
                    isActive
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  aria-label="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={getContextMenuItems(contextMenu.tabId)}
        />
      )}
    </>
  );
}
