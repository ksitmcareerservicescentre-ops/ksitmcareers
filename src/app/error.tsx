"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container status-page">
      <p className="eyebrow">Something went wrong</p>
      <h1>We couldn&apos;t load this page.</h1>
      <p>Please try again in a moment.</p>
      <button type="button" className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
