export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0A0A1A]/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <div className="flex items-center gap-3"><span className="h-9 w-9 animate-pulse rounded-xl bg-[#FF7F24]/20" /><span className="h-4 w-40 animate-pulse rounded bg-white/10" /></div>
          <span className="h-8 w-24 animate-pulse rounded-lg bg-white/10" />
        </div>
      </div>
      <main className="mx-auto grid max-w-[1500px] gap-6 px-4 py-8 lg:grid-cols-[230px_1fr]">
        <aside className="h-[520px] animate-pulse rounded-2xl border border-white/10 bg-[#101023] p-4"><div className="h-3 w-32 rounded bg-white/10" /><div className="mt-6 space-y-3">{Array.from({ length: 9 }).map((_, index) => <div key={index} className="h-10 rounded-xl bg-white/[.06]" />)}</div></aside>
        <section className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-[#101023]" />)}</div><div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-[#101023]" /><div className="h-48 animate-pulse rounded-2xl border border-white/10 bg-[#101023]" /></section>
      </main>
    </div>
  );
}
