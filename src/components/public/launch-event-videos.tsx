import type { LaunchEventVideoRecord } from "@/db/schema";

export function LaunchEventVideos({
  videos = [],
}: {
  videos?: LaunchEventVideoRecord[];
}) {
  if (!videos || videos.length === 0) return null;

  return (
    <section id="launch-videos" className="bg-[#101023] py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-[#FF7F24]">
            Career Services Centre
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-white md:text-4xl">
            Launch event videos
          </h2>
          <p className="mt-3 max-w-2xl text-gray-400">
            Highlights from the launch of the KSITM Career Services Centre.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {videos.map((video) => (
            <article
              key={video.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] shadow-xl"
            >
              <video
                className="aspect-video w-full bg-black object-cover"
                controls
                preload="metadata"
                src={video.videoUrl}
              >
                <track kind="captions" />
                <span>Your browser does not support video playback.</span>
              </video>
              <div className="p-5">
                <h3 className="font-bold text-white">{video.title}</h3>
                <p className="mt-1 text-xs text-gray-400">
                  {video.description || "Public event archive"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
