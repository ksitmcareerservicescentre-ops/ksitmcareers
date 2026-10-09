import { createRoot } from "react-dom/client";
import { ModulesWorkspace } from "@/components/admin/modules-workspace";

createRoot(document.getElementById("root")!).render(
  <div className="min-h-screen bg-[#0A0A1A] p-4 text-white sm:p-8">
    <ModulesWorkspace />
  </div>,
);
