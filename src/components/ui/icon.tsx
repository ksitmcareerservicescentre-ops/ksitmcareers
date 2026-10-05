import type { SVGProps } from "react";

const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  down: "m6 9 6 6 6-6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  calendar:
    "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2m3 11 3 3 5-5",
  people:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  document: "M14 2H4v20h16V8l-6-6v6h6M8 13h8m-8 4h5",
  play: "m10 8 6 4-6 4V8m12 4a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  laptop: "M4 4h16v12H4V4M2 20h20l-2-4H4l-2 4",
  briefcase: "M8 6V3h8v3M3 6h18v15H3V6m0 6 9 3 9-3m-9 0v4",
  check: "M9 12l2 2 4-4M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  mail: "M3 5h18v14H3V5m0 0 9 7 9-7",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18",
  pause: "M9 5v14M15 5v14",
} as const;
export type IconName = keyof typeof paths;

export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
