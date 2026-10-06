import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Student Sign In — KSITM Careers",
  description: "Sign in to your KSITM institutional Career Services portal.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.role === "SUPER_ADMIN") redirect("/admin");
    if (user.role === "STAFF") redirect("/staff");
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0A0A1A] py-12 px-4 flex items-center justify-center relative overflow-hidden">
      <Link href="/" className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl bg-[#FF7F24] px-4 py-2.5 text-sm font-extrabold text-[#0A0A1A] shadow-lg shadow-orange-950/30 transition hover:bg-[#40297B] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7F24]">
        <i className="fas fa-arrow-left" aria-hidden="true" />
        Home
      </Link>
      {/* Background glow effects */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-gradient-to-br from-[#FF7F24]/10 to-[#40297B]/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      ></div>
      <LoginForm />
    </main>
  );
}
