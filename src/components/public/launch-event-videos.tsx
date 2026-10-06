const launchVideos = [
  { title: "Career Services Centre Launch", src: "https://res.cloudinary.com/njlhwruu/video/upload/v1791260400/WhatsApp_Video_2026-09-29_at_6.53.04_PM.mp4" },
  { title: "Career Services Centre Launch Highlights", src: "https://res.cloudinary.com/njlhwruu/video/upload/v1791260396/WhatsApp_Video_2026-09-29_at_6.53.05_PM.mp4" },
];

export function LaunchEventVideos() {
  return <section id="launch-videos" className="bg-[#101023] py-20 scroll-mt-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mb-10"><p className="text-sm font-bold uppercase tracking-[.2em] text-[#FF7F24]">Career Services Centre</p><h2 className="mt-3 text-3xl font-extrabold text-white md:text-4xl">Launch event videos</h2><p className="mt-3 max-w-2xl text-gray-400">Highlights from the launch of the KSITM Career Services Centre.</p></div><div className="grid gap-6 md:grid-cols-2">{launchVideos.map((video) => <article key={video.src} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] shadow-xl"><video className="aspect-video w-full bg-black object-cover" controls preload="metadata" src={video.src}><track kind="captions" /><span>Your browser does not support video playback.</span></video><div className="p-5"><h3 className="font-bold text-white">{video.title}</h3><p className="mt-1 text-xs text-gray-500">Public event archive</p></div></article>)}</div></div></section>;
}
