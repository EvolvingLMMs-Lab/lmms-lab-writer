"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DockviewReact,
  type AddPanelPositionOptions,
  type DockviewApi,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
} from "dockview-react";

const PANEL_COMPONENT_ID = "workspace-panel-content";

type PanelParams = {
  panelId: string;
  content: ReactNode;
};

export type DockviewPanelItem = {
  id: string;
  title: string;
  content: ReactNode;
  inactive?: boolean;
  position?: AddPanelPositionOptions;
};

type DockviewPanelLayoutProps = {
  panels: DockviewPanelItem[];
  className?: string;
  activePanelId?: string;
  onActivePanelChange?: (panelId: string | undefined) => void;
  onApiReady?: (api: DockviewApi) => void;
};

export function DockviewPanelLayout({
  panels,
  className = "",
  activePanelId,
  onActivePanelChange,
  onApiReady,
}: DockviewPanelLayoutProps) {
  const [api, setApi] = useState<DockviewApi | null>(null);

  const PanelContent = useCallback(
    ({ params }: IDockviewPanelProps<PanelParams>) => (
      <div className="h-full min-h-0 overflow-hidden">
        {params.content ?? null}
      </div>
    ),
    [],
  );

  const components = useMemo(
    () => ({
      [PANEL_COMPONENT_ID]: PanelContent,
    }),
    [PanelContent],
  );

  const handleReady = useCallback(
    (event: DockviewReadyEvent) => {
      setApi(event.api);
      onApiReady?.(event.api);
    },
    [onApiReady],
  );

  useEffect(() => {
    if (!api || !onActivePanelChange) return;

    const disposable = api.onDidActivePanelChange((panel) => {
      onActivePanelChange(panel?.id);
    });

    return () => {
      disposable.dispose();
    };
  }, [api, onActivePanelChange]);

  useEffect(() => {
    if (!api) return;

    const expectedPanelSet = new Set(panels.map((p) => p.id));

    for (const panel of [...api.panels]) {
      if (!expectedPanelSet.has(panel.id)) {
        api.removePanel(panel);
      }
    }

    for (const panel of panels) {
      const existing = api.getPanel(panel.id);

      if (existing) {
        if ((existing.title ?? "") !== panel.title) {
          existing.api.setTitle(panel.title);
        }
        existing.api.updateParameters({
          panelId: panel.id,
          content: panel.content,
        });
        continue;
      }

      if (api.panels.length === 0) {
        api.addPanel<PanelParams>({
          id: panel.id,
          component: PANEL_COMPONENT_ID,
          title: panel.title,
          params: {
            panelId: panel.id,
            content: panel.content,
          },
          inactive: panel.inactive ?? true,
        });
        continue;
      }

      const fallbackReferencePanel = api.panels[0]?.id;
      if (!fallbackReferencePanel) continue;

      api.addPanel<PanelParams>({
        id: panel.id,
        component: PANEL_COMPONENT_ID,
        title: panel.title,
        params: {
          panelId: panel.id,
          content: panel.content,
        },
        inactive: panel.inactive ?? true,
        position:
          panel.position ?? {
            referencePanel: fallbackReferencePanel,
            direction: "right",
          },
      });
    }
  }, [api, panels]);

  useEffect(() => {
    if (!api || !activePanelId) return;
    api.getPanel(activePanelId)?.api.setActive();
  }, [api, activePanelId]);

  return (
    <DockviewReact
      className={`h-full w-full dockview-theme-light ${className}`}
      components={components}
      onReady={handleReady}
      hideBorders={false}
      disableFloatingGroups
      singleTabMode="default"
      noPanelsOverlay="emptyGroup"
      scrollbars="native"
      disableTabsOverflowList
    />
  );
}
