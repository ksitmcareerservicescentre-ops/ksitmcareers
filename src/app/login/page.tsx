import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
      {/* Background glow effects */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-gradient-to-br from-[#FF7F24]/10 to-[#40297B]/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      ></div>
      <LoginForm />
    </main>
  );
}
