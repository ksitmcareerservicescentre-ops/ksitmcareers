import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container status-page">
      <p className="eyebrow">404 · Page not found</p>
      <h1>Let&apos;s find your way back.</h1>
      <p>This page may have moved or the address may be incorrect.</p>
      <Link href="/" className="button">
        Return to KSITM Careers
      </Link>
    </div>
  );
}
