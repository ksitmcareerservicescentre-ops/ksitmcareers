export default function StaffLoading() {
  return <main className="min-h-screen bg-[#0A0A1A] px-4 py-8 text-white sm:px-6 lg:px-8" role="status" aria-label="Loading staff workspace"><div className="mx-auto max-w-7xl space-y-8"><div className="h-20 animate-pulse rounded-2xl bg-white/[.06]" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-white/[.06]" />)}</div><div className="h-96 animate-pulse rounded-2xl bg-white/[.06]" /></div></main>;
}
