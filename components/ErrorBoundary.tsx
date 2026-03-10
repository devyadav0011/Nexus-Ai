'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 bg-black/50 border border-red-900/50 rounded-2xl">
          <div className="p-4 bg-red-500/20 rounded-full text-red-400">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-red-400 uppercase tracking-widest">System Failure</h2>
            <p className="text-sm text-red-300/70 font-mono max-w-md mx-auto">
              {this.state.error?.message || 'An unexpected error occurred in this module.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 transition-all uppercase tracking-widest text-sm font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reboot Module</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
