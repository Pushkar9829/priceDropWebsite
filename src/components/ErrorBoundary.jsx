import { Component } from 'react';

const RELOAD_KEY = 'pc_chunk_reload_at';

/** A lazy chunk from a previous deploy is gone (SPA fallback served index.html instead). */
const isChunkLoadError = (err) =>
  /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    String(err?.message || err)
  );

/**
 * Catches render errors so one broken widget can't blank the whole app.
 * After a redeploy, stale tabs fail to load lazy chunks — reload once to pick up the new build.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error)) {
      let last = 0;
      try {
        last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
      } catch {
        /* storage unavailable */
      }
      // Guard against reload loops: at most once per 30s
      if (Date.now() - last > 30_000) {
        try {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        } catch {
          /* storage unavailable */
        }
        window.location.reload();
      }
    }
  }

  componentDidUpdate(prevProps) {
    // Navigating elsewhere clears the error so the next page can render
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    const chunk = isChunkLoadError(this.state.error);
    return (
      <div className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold">{chunk ? 'A new version is available' : 'Something went wrong'}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {chunk ? 'Reload to get the latest version of the site.' : 'This page hit an unexpected error. Reloading usually fixes it.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
