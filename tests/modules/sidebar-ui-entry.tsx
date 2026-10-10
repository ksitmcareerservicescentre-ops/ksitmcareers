import { createRoot } from "react-dom/client";
import { AdminControlCenter } from "@/components/admin/admin-control-center";

createRoot(document.getElementById("root")!).render(
  <div className="min-h-screen bg-[#0A0A1A] text-white">
    <header className="fixed inset-x-0 top-0 z-40 bg-[#0A0A1A]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-[#FF7F24]/10 border border-[#FF7F24]/30 text-[#FF7F24] flex items-center justify-center font-bold text-sm">
          K
        </span>
        <div>
          <span className="text-sm font-extrabold tracking-tight text-white block">
            KSITM Careers
          </span>
          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block -mt-1">
            Super Admin Central
          </span>
        </div>
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
