export type LaTeXCompiler = "pdflatex" | "xelatex" | "lualatex" | "latexmk";

export interface CompilerInfo {
  name: string;
  path: string | null;
  available: boolean;
  version: string | null;
}

export interface LaTeXCompilersStatus {
  pdflatex: CompilerInfo;
  xelatex: CompilerInfo;
  lualatex: CompilerInfo;
  latexmk: CompilerInfo;
}

export interface LaTeXSettings {
  compiler: LaTeXCompiler;
  customPath: string | null;
  arguments: string[];
  mainFile: string | null;
  synctex: boolean;
  cleanAuxFiles: boolean;
  autoCompileOnSave: boolean;
  autoOpenPdf: boolean;
}

export type CompilationStatus = "idle" | "compiling" | "success" | "error";

export interface CompilationResult {
  success: boolean;
  exit_code: number | null;
  pdf_path: string | null;
  error: string | null;
}

export interface CompileOutputEvent {
  line: string;
  is_error: boolean;
  is_warning: boolean;
}

export const DEFAULT_LATEX_SETTINGS: LaTeXSettings = {
  compiler: "xelatex",
  customPath: null,
  arguments: [],
  mainFile: null,
  synctex: true,
  cleanAuxFiles: false,
  autoCompileOnSave: false,
  autoOpenPdf: true,
};

export const COMPILER_DISPLAY_NAMES: Record<LaTeXCompiler, string> = {
  pdflatex: "pdfLaTeX",
  xelatex: "XeLaTeX",
  lualatex: "LuaLaTeX",
  latexmk: "Latexmk",
};

export const COMPILER_DESCRIPTIONS: Record<LaTeXCompiler, string> = {
  pdflatex: "Standard LaTeX compiler, fast but limited CJK support",
  xelatex: "Recommended for CJK - native Unicode and system fonts support",
  lualatex: "Modern Lua-based compiler with Unicode support, slower than XeLaTeX",
  latexmk: "Automated build tool that runs LaTeX the right number of times",
};

// LaTeX Installation Types
export interface LaTeXDistribution {
  name: string;
  id: string;
  description: string;
  install_command: string | null;
  download_url: string | null;
}

export interface InstallProgress {
  stage: "starting" | "checking" | "installing" | "complete" | "error";
  message: string;
  progress: number | null;
}

export interface InstallResult {
  success: boolean;
  message: string;
  needs_restart: boolean;
}
