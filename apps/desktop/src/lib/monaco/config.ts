/**
 * Monaco Editor Configuration
 *
 * Configures Monaco to load from local node_modules instead of CDN.
 * This is essential for Tauri apps and offline environments where
 * CDN loading would fail silently.
 *
 * Import this file BEFORE using any Monaco components.
 */

import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

// Configure loader to use local Monaco installation
loader.config({ monaco });

// Export for explicit initialization if needed
export function initMonaco(): void {
  // Monaco is already configured above, this is just for explicit calls
}

export { monaco };
