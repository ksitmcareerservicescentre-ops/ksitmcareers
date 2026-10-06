"use client";

import { useEffect, useRef, useState } from "react";
import { parseTrainingMedia } from "@/lib/training-media";

type Props = { title: string; videoUrl: string; videoId?: string | null; videoProvider?: string | null; poster?: string | null };
type Player = { playVideo(): void; pauseVideo(): void; seekTo(seconds: number, allow: boolean): void; setVolume(value: number): void; mute(): void; unMute(): void; isMuted(): boolean; getVolume(): number; getCurrentTime(): number; getDuration(): number; destroy(): void; getIframe(): HTMLIFrameElement };
type API = { Player: new (element: HTMLElement, options: Record<string, unknown>) => Player };
declare global { interface Window { YT?: API; onYouTubeIframeAPIReady?: () => void } }
let apiPromise: Promise<API> | undefined;
function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) apiPromise = new Promise<API>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("YouTube did not respond.")), 20000);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); window.clearTimeout(timeout); if (window.YT) resolve(window.YT); };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { window.clearTimeout(timeout); reject(new Error("YouTube could not load.")); };
    document.head.appendChild(script);
  });
  return apiPromise;
}
const time = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;

export function MediaPlayer(props: Props) {
  return <PlayerInstance key={props.videoUrl} {...props} />;
}
function PlayerInstance({ title, videoUrl, poster }: Props) {
  const media = parseTrainingMedia(videoUrl);
  const youtube = media?.provider === "youtube";
  const id = media?.id;
  const container = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const player = useRef<Player | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!youtube || !id) return;
    let disposed = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    let instance: Player | undefined;
    void loadYouTube().then((api) => {
      if (disposed || !mount.current) return;
      const target = document.createElement("div");
      mount.current.replaceChildren(target);
      instance = new api.Player(target, {
        host: "https://www.youtube-nocookie.com", videoId: id, width: "100%", height: "100%",
        playerVars: { controls: 0, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: () => {
            if (disposed || !instance) return;
            player.current = instance;
            instance.getIframe().title = title;
            setReady(true);
            interval = setInterval(() => {
              if (!instance) return;
              setCurrent(instance.getCurrentTime() || 0); setDuration(instance.getDuration() || 0);
              setMuted(instance.isMuted()); setVolume(instance.getVolume() / 100);
            }, 250);
          },
          onStateChange: (event: { data: number }) => { if (!disposed) setPlaying(event.data === 1); },
          onError: () => { if (!disposed) { setError("This video is unavailable or cannot be embedded."); setReady(false); } },
        },
      });
    }).catch(() => { if (!disposed) setError("Unable to load YouTube. Reload the page to try again."); });
    return () => { disposed = true; clearInterval(interval); instance?.destroy(); player.current = null; };
  }, [youtube, id, title]);
  const seek = (seconds: number) => {
    if (youtube) player.current?.seekTo(seconds, true);
    else if (video.current) video.current.currentTime = seconds;
    setCurrent(seconds);
  };
  const pause = () => { if (youtube) player.current?.pauseVideo(); else video.current?.pause(); };
  const toggle = () => {
    if (playing) pause();
    else if (youtube) player.current?.playVideo();
    else void video.current?.play().catch(() => setError("Playback failed. Check the video URL and browser format support."));
  };
  const changeVolume = (value: number) => {
    setVolume(value); setMuted(value === 0);
    if (youtube) { player.current?.setVolume(value * 100); if (value) player.current?.unMute(); else player.current?.mute(); }
    else if (video.current) { video.current.volume = value; video.current.muted = value === 0; }
  };
  const mute = () => {
    if (youtube) { if (muted) player.current?.unMute(); else player.current?.mute(); }
    else if (video.current) video.current.muted = !muted;
    setMuted(!muted);
  };
  if (!media) return <p role="alert" className="p-6">This video URL is not supported.</p>;
  return <div ref={container} className="flex flex-col bg-black text-white fullscreen:h-screen">
    <div className="aspect-video min-h-[200px] flex-1">
      {youtube ? <div ref={mount} className="h-full w-full" /> : <video ref={video} aria-label={title} src={videoUrl} poster={poster || undefined} playsInline preload="metadata" className="h-full w-full object-contain" onLoadedMetadata={(event) => { setReady(true); setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0); }} onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)} onVolumeChange={(event) => { setMuted(event.currentTarget.muted); setVolume(event.currentTarget.volume); }} onError={() => { setError("Unable to play this file. Check the URL, access permissions, and video format."); setReady(false); }} />}
    </div>
    {error && <p role="alert" className="px-3 py-2 text-sm text-red-300">{error}</p>}
    <div role="group" aria-label={`${title} playback controls`} className="space-y-2 bg-[#101023] p-3">
      <input aria-label="Video timeline" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(current, duration || 1)} disabled={!ready || !duration} onChange={(event) => seek(Number(event.target.value))} className="w-full accent-[#FF7F24]" />
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <button type="button" disabled={!ready} onClick={toggle} aria-label={playing ? "Pause video" : "Play video"}>{playing ? "Pause" : "Play"}</button>
        <button type="button" disabled={!ready} onClick={() => { seek(0); pause(); }} aria-label="Stop video">Stop</button>
        <button type="button" disabled={!ready} onClick={mute} aria-label={muted ? "Unmute video" : "Mute video"}>{muted ? "Unmute" : "Mute"}</button>
        <input aria-label="Video volume" type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} disabled={!ready} onChange={(event) => changeVolume(Number(event.target.value))} className="w-16 accent-[#FF7F24]" />
        <span aria-label="Playback time">{time(current)} / {time(duration)}</span>
        <button type="button" className="ml-auto" aria-label="Toggle fullscreen" onClick={() => {
          const action = document.fullscreenElement ? document.exitFullscreen() : container.current?.requestFullscreen?.();
          if (action) void action.catch(() => setError("Fullscreen is unavailable in this browser."));
          else setError("Fullscreen is unavailable in this browser.");
        }}>Fullscreen</button>
      </div>
    </div>
  </div>;
}
