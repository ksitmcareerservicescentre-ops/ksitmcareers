/* eslint-disable @next/next/no-img-element */
import { createRoot } from "react-dom/client";
import { AdminControlCenter } from "@/components/admin/admin-control-center";

createRoot(document.getElementById("root")!).render(
  <div className="min-h-screen bg-[#0A0A1A] text-white">
    <header className="fixed inset-x-0 top-0 z-40 bg-[#0A0A1A]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img
          src="https://res.cloudinary.com/djkudkxmx/image/upload/v1790374243/KSITM_shield_pfusir.png"
          alt="KSITM Logo"
          className="h-7 w-auto object-contain"
        />
        <span className="sr-only">Super Admin Central</span>
      </div>
      <div className="text-xs text-gray-300 font-semibold">
        superadmin@ksitmcareers.org.ng
      </div>
    </header>

    <main className="min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <AdminControlCenter
        appointments={[]}
        gallery={[]}
        leadership={[]}
        announcements={[]}
        training={[]}
        officers={[]}
        students={[]}
        logs={[]}
        defaultTab="modules"
      />
    </main>
  </div>,
);
