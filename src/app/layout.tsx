import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { site } from "@/config/site";
import "./globals.css";

const heading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});
const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "KSITM Careers — Advancing Futures",
    template: "%s | KSITM Careers",
  },
  description:
    "Explore career guidance, mentorship and employability development at Katsina State Institute of Technology and Management. Your next chapter starts here.",
  icons: { icon: site.shield, apple: site.shield },
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: site.name,
    title: "KSITM Careers — Advancing Futures",
    description: "Connecting learning with opportunity at KSITM.",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
