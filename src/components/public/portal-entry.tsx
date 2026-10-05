import Link from "next/link";
import { site } from "@/config/site";
import { Icon } from "@/components/ui/icon";
export function PortalEntry({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  return (
    <div className="container entry-page">
      <div className="entry-intro">
        <p className="eyebrow">KSITM Careers · Student portal</p>
        <h1>
          Your next chapter.
          <br />
          <span className="text-accent">Your own path.</span>
        </h1>
        <p>
          Guidance, skills and opportunities to help you move forward with
          confidence.
        </p>
        <Link href="/#services" className="text-link">
          Explore Career Services <Icon name="arrow" />
        </Link>
      </div>
      <section className="entry-card" aria-labelledby="entry-title">
        <span className="icon-box">
          <Icon name={isLogin ? "people" : "document"} />
        </span>
        <h2 id="entry-title">{isLogin ? "Student Login" : "Create Account"}</h2>
        <span className="label">Opening soon</span>
        <p>
          {isLogin
            ? "Student sign-in is not available yet. When the portal opens, you will sign in with your registration number and password."
            : "Student registration is not available yet. When it opens, you will be able to create your account using your full name, registration number, email and password."}
        </p>
        <p>
          For career guidance in the meantime, contact the Career Services
          Centre.
        </p>
        <a href={`mailto:${site.email}`} className="button">
          Contact the team <Icon name="arrow" />
        </a>
        <Link href={isLogin ? "/register" : "/login"} className="text-link">
          {isLogin ? "About student registration" : "About student sign-in"}
          <Icon name="arrow" />
        </Link>
      </section>
    </div>
  );
}
