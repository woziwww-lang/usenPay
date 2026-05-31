import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4 text-ink">
          <section className="max-w-md rounded-lg border border-line bg-white p-6 shadow-panel">
            <p className="text-xs font-semibold uppercase text-coral">Console error</p>
            <h1 className="mt-2 text-xl font-semibold">The operations console could not render.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Refresh the page and try again. If the issue repeats, check the active API mode and local
              service logs.
            </p>
            <button
              className="mt-5 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload console
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
