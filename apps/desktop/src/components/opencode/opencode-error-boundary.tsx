"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { WarningIcon } from "@phosphor-icons/react";

type Props = {
  children: ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class OpenCodeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("OpenCode Panel Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="size-12 border border-border flex items-center justify-center mb-4">
            <WarningIcon className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">
            OpenCode Panel Error
          </h3>
          <p className="text-xs text-muted mb-4 max-w-[200px]">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 text-xs border border-foreground bg-background hover:bg-accent-hover transition-colors"
            style={{ boxShadow: "2px 2px 0 0 var(--foreground)" }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
