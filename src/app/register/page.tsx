import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Student Registration — KSITM Careers",
  description:
    "Register your KSITM student account to access Career Services, consultations, and employability tools.",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
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
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-gradient-to-br from-[#FF7F24]/10 to-[#40297B]/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      ></div>
      <RegisterForm />
    </main>
  );
}
