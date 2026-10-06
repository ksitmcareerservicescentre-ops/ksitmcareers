export default function DashboardLoading() {
  return <main className="min-h-screen bg-[#0A0A1A] px-4 py-8 text-white sm:px-6 lg:px-8" role="status" aria-label="Loading student dashboard"><div className="mx-auto max-w-7xl space-y-8"><div className="h-24 animate-pulse rounded-3xl bg-white/[.06]" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-white/[.06]" />)}</div><div className="h-72 animate-pulse rounded-2xl bg-white/[.06]" /></div></main>;
}
