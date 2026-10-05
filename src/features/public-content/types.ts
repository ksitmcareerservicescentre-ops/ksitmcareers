export type PublicImage = { src: string; alt: string };
export type GalleryItem = PublicImage & {
  id: string;
  title: string;
  caption: string;
};
export type Leader = PublicImage & {
  id: string;
  name: string;
  position: string;
  summary: string;
  biography: readonly string[];
};
export type Service = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  icon:
    | "calendar"
    | "people"
    | "document"
    | "play"
    | "laptop"
    | "briefcase"
    | "check";
};
export type Announcement = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
};
export type SocialLink = { platform: string; url: string; active: boolean };
