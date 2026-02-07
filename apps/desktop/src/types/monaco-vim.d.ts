declare module "monaco-vim" {
  import type { editor } from "monaco-editor";

  export interface VimMode {
    dispose(): void;
  }

  export function initVimMode(
    editor: editor.IStandaloneCodeEditor,
    statusBar: HTMLElement | null,
  ): VimMode;
}
