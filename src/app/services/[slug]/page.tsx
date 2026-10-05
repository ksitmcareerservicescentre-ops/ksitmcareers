import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/features/public-content/content";
import { Icon } from "@/components/ui/icon";
import { site } from "@/config/site";

export const dynamicParams = false;
export function generateStaticParams() {
  return services.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  return {
    title: service?.title ?? "Service not found",
    description: service?.summary,
  };
}
export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();
  return (
    <div className="container detail-page">
      <Link href="/#services" className="text-link">
        ← All Career Services
      </Link>
      <div className="detail-grid">
        <div>
          <span className="icon-box">
            <Icon name={service.icon} />
          </span>
          <p className="eyebrow">Your career development</p>
          <h1>{service.title}</h1>
          <p className="detail-summary">{service.summary}</p>
        </div>
        <section className="entry-card" aria-labelledby="service-about">
          <h2 id="service-about">About this service</h2>
          <p>{service.description}</p>
          <div className="service-status">
            <span className="label">Portal service planned</span>
            <p>
              Online tools are being prepared. Contact the team for current
              guidance and availability.
            </p>
          </div>
          <a href={`mailto:${site.email}`} className="button">
            Contact Career Services <Icon name="arrow" />
          </a>
        </section>
      </div>
    </div>
  );
}
