"use client";

import { useCallback, useState } from "react";
import {
  XIcon,
  XCircleIcon,
  CaretLineLeftIcon,
  CaretLineRightIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { ContextMenu, ContextMenuItem } from "./context-menu";

export interface TabItem {
  id: string;
  label: string;
  title?: string;
  badge?: string | number;
}

export type TabReorderPosition = "before" | "after";

export interface TabBarProps<T extends TabItem> {
  tabs: T[];
  activeTab: string;
  onTabSelect: (id: string) => void;
  onTabClose?: (id: string) => void;
  onTabReorder?: (
    draggedId: string,
    targetId: string,
    position: TabReorderPosition,
  ) => void;
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
  onTabReorder,
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
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    tabId: string;
    position: TabReorderPosition;
  } | null>(null);

  const resetDragState = useCallback(() => {
    setDraggedTabId(null);
    setDropIndicator(null);
  }, []);

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
          icon: <XIcon className="w-4 h-4" />,
        });
      }

      if (onCloseOthers) {
        items.push({
          label: "Close Others",
          onClick: () => onCloseOthers(tabId),
          disabled: tabs.length <= 1,
          icon: <XCircleIcon className="w-4 h-4" />,
        });
      }

      if (onCloseToLeft) {
        items.push({
          label: "Close to the Left",
          onClick: () => onCloseToLeft(tabId),
          disabled: tabIndex === 0,
          icon: <CaretLineLeftIcon className="w-4 h-4" />,
        });
      }

      if (onCloseToRight) {
        items.push({
          label: "Close to the Right",
          onClick: () => onCloseToRight(tabId),
          disabled: tabIndex === tabs.length - 1,
          icon: <CaretLineRightIcon className="w-4 h-4" />,
        });
      }

      if (onCloseAll) {
        items.push({
          label: "Close All",
          onClick: onCloseAll,
          danger: true,
          icon: <TrashIcon className="w-4 h-4" />,
        });
      }

      return items;
    },
    [tabs, onTabClose, onCloseOthers, onCloseToLeft, onCloseToRight, onCloseAll],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
      if (!onTabReorder) return;
      setDraggedTabId(tabId);
      setDropIndicator(null);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", tabId);
    },
    [onTabReorder],
  );

  const handleDragOverTab = useCallback(
    (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
      if (!onTabReorder || !draggedTabId || draggedTabId === tabId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const rect = e.currentTarget.getBoundingClientRect();
      const position: TabReorderPosition =
        e.clientX < rect.left + rect.width / 2 ? "before" : "after";
      setDropIndicator({ tabId, position });
    },
    [onTabReorder, draggedTabId],
  );

  const handleDropOnTab = useCallback(
    (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
      if (!onTabReorder || !draggedTabId) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const position: TabReorderPosition =
        e.clientX < rect.left + rect.width / 2 ? "before" : "after";
      if (draggedTabId !== tabId) {
        onTabReorder(draggedTabId, tabId, position);
      }
      resetDragState();
    },
    [onTabReorder, draggedTabId, resetDragState],
  );

  const handleContainerDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!onTabReorder || !draggedTabId) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-tab-id]")) return;
      e.preventDefault();
      const lastTab = tabs[tabs.length - 1];
      if (lastTab) {
        setDropIndicator({ tabId: lastTab.id, position: "after" });
      }
    },
    [onTabReorder, draggedTabId, tabs],
  );

  const handleContainerDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!onTabReorder || !draggedTabId) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-tab-id]")) return;
      e.preventDefault();
      const lastTab = tabs[tabs.length - 1];
      if (lastTab && lastTab.id !== draggedTabId) {
        onTabReorder(draggedTabId, lastTab.id, "after");
      }
      resetDragState();
    },
    [onTabReorder, draggedTabId, tabs, resetDragState],
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
                  ? "text-foreground border-b-2 border-foreground -mb-px"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className="ml-1 text-xs bg-surface-tertiary px-1 tabular-nums">
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
        onDragOver={handleContainerDragOver}
        onDrop={handleContainerDrop}
        className={`flex items-center border-b border-border bg-accent-hover overflow-x-auto min-h-[34px] ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const isDragged = draggedTabId === tab.id;
          const showDropBefore =
            dropIndicator?.tabId === tab.id &&
            dropIndicator.position === "before";
          const showDropAfter =
            dropIndicator?.tabId === tab.id &&
            dropIndicator.position === "after";
          return (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              draggable={Boolean(onTabReorder)}
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOverTab(e, tab.id)}
              onDrop={(e) => handleDropOnTab(e, tab.id)}
              onDragEnd={resetDragState}
              className={`group relative flex items-center border-r border-border transition-colors ${
                isActive
                  ? "bg-background text-foreground"
                  : "text-muted hover:text-foreground hover:bg-background/50"
              } ${onTabReorder ? "cursor-grab active:cursor-grabbing" : ""} ${isDragged ? "opacity-60" : ""}`}
              title={tab.title ?? tab.label}
              onMouseDown={(e) => handleMouseDown(e, tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
            >
              {showDropBefore && (
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-0.5 bg-accent z-10" />
              )}
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
                  draggable={false}
                  onDragStart={(e) => {
                    e.preventDefault();
                  }}
                  className={`w-6 h-full flex items-center justify-center hover:bg-surface-tertiary ${
                    isActive
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  aria-label="Close tab"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              )}
              {showDropAfter && (
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-0.5 bg-accent z-10" />
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
