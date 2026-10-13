import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { careerServices } from "@/db/schema";
import { Icon } from "@/components/ui/icon";
import { site } from "@/config/site";

export const dynamicParams = true;

export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) return [];
  try {
    const items = await db
      .select({ slug: careerServices.slug })
      .from(careerServices)
      .where(eq(careerServices.isActive, true));
    return items.map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [service] = await db
      .select()
      .from(careerServices)
      .where(eq(careerServices.slug, slug))
      .limit(1);

    return {
      title: service ? `${service.title} — KSITM Careers` : "Service not found",
      description: service?.summary,
    };
  } catch {
    return {
      title: "Career Services — KSITM Careers",
    };
  }
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service] = await db
    .select()
    .from(careerServices)
    .where(eq(careerServices.slug, slug))
    .limit(1);

  if (!service) notFound();

  return (
    <div className="container detail-page">
      <Link href="/#services" className="text-link">
        ← All Career Services
      </Link>
      <div className="detail-grid">
        <div>
          <span className="icon-box">
            <Icon name={(service.icon as "phone" | "calendar" | "people" | "document" | "play" | "laptop" | "briefcase" | "check" | "arrow" | "down" | "menu" | "close" | "mail" | "pin" | "globe" | "pause") || "briefcase"} />
          </span>
          <p className="eyebrow">Your career development</p>
          <h1>{service.title}</h1>
          <p className="detail-summary">{service.summary}</p>
        </div>
        <section className="entry-card" aria-labelledby="service-about">
          <h2 id="service-about">About this service</h2>
          <p>{service.description}</p>
          <div className="service-status">
            <span className="label">Active institutional service</span>
            <p>
              Available to verified KSITM students and partner employers through the portal.
            </p>
          </div>
          <Link href="/dashboard" className="button">
            Access in Portal <Icon name="arrow" />
          </Link>
        </section>
      </div>
    </div>
  );
}
