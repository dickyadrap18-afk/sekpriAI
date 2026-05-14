"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-10 gap-4 text-center">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}>
            <AlertCircle className="h-5 w-5 text-red-400/60" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/50">Something went wrong</p>
            {this.state.message && (
              <p className="text-xs text-white/20 font-mono max-w-xs truncate">{this.state.message}</p>
            )}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, message: "" })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
