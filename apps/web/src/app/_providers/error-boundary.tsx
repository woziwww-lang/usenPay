"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error boundary captured an error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] p-4 text-ink">
          <section className="w-full max-w-lg rounded-lg border border-line bg-white p-5 shadow-panel">
            <p className="text-xs font-semibold uppercase text-red-600">Global error</p>
            <h1 className="mt-2 text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{this.state.error.message}</p>
            <button
              className="mt-4 rounded-md bg-payblue px-3 py-2 text-sm font-semibold text-white"
              onClick={() => this.setState({ error: null })}
              type="button"
            >
              Try again
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
