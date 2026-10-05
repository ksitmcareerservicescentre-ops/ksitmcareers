type PublicAnnouncement = { id: string; title: string; summary: string; content: string };

export function Updates({ announcements }: { announcements?: PublicAnnouncement[] }) {
  return (
    <section id="updates" className="py-24 bg-[#101023] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[#FF7F24] font-bold uppercase tracking-[.2em] text-sm mb-3">
          What&apos;s happening
        </p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-10">
          Updates
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {announcements && announcements.length > 0 ? announcements.map((item) => <article key={item.id} className="rounded-2xl bg-white/5 border border-white/10 p-8"><i className="fas fa-bullhorn text-[#FF7F24] text-3xl mb-5" aria-hidden="true"></i><h3 className="text-white text-xl font-bold mb-3">{item.title}</h3><p className="text-gray-400">{item.summary}</p><p className="mt-3 text-sm leading-6 text-gray-500">{item.content}</p></article>) : <>
          <article className="rounded-2xl bg-white/5 border border-white/10 p-8">
            <i
              className="fas fa-bullhorn text-[#FF7F24] text-3xl mb-5"
              aria-hidden="true"
            ></i>
            <h3 className="text-white text-xl font-bold mb-3">
              Career opportunities
            </h3>
            <p className="text-gray-400">
              Keep an eye on this space for upcoming career events and
              opportunities.
            </p>
          </article>
          <article className="rounded-2xl bg-white/5 border border-white/10 p-8">
            <i
              className="fas fa-calendar-alt text-[#FF7F24] text-3xl mb-5"
              aria-hidden="true"
            ></i>
            <h3 className="text-white text-xl font-bold mb-3">
              Campus announcements
            </h3>
            <p className="text-gray-400">
              News and dates will appear here as they are confirmed.
            </p>
          </article>
          </>}
        </div>
      </div>
    </section>
  );
}
