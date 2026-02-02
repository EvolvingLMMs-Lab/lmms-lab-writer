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
  mainFile: string | null;
  compilePrompt: string;
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
  mainFile: null,
  compilePrompt: `Please compile the LaTeX document.

Main file: {mainFile}

Guidelines:
1. First, read .lmms_lab_writer/COMPILE_NOTES for previous compilation notes and preferences
2. If the main file does not exist, auto-detect the correct main .tex file (look for \\documentclass in .tex files)
3. Prefer xelatex or pdflatex, but feel free to choose the most appropriate compiler based on the document content
4. If packages are missing, try installing them with tlmgr
5. For bibliography or cross-references, consider running multiple passes or using latexmk
6. If compilation fails, check the .log file to diagnose and fix the issue
7. After compilation (success or failure), update .lmms_lab_writer/COMPILE_NOTES with any useful information: working compiler, installed packages, resolved issues, or tips for future compilations
8. After successful compilation, let me know the output PDF path`,
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
  stage: "starting" | "checking" | "downloading" | "installing" | "complete" | "error";
  message: string;
  progress: number | null;
}

export interface InstallResult {
  success: boolean;
  message: string;
  needs_restart: boolean;
}

// Main file detection types
export interface MainFileDetectionResult {
  main_file: string | null;
  tex_files: string[];
  detection_method: "configured" | "single_file" | "auto_detected" | "ambiguous" | "none";
  needs_user_input: boolean;
  message: string;
}
