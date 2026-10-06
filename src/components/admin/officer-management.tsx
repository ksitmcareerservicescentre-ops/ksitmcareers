"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createCareerOfficerAction,
  toggleStaffStatusAction,
  type OfficerActionResult,
} from "@/actions/admin";

interface Officer {
  id: string;
  userId: string;
  fullName: string;
  staffCode: string | null;
  designation: string | null;
  email: string;
  isActive: boolean;
  canManageAppointments: boolean;
  canManageServices: boolean;
  createdAt: Date;
}

interface OfficerManagementProps {
  initialOfficers: Officer[];
}

export function OfficerManagement({ initialOfficers }: OfficerManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [state, formAction, isPending] = useActionState<
    OfficerActionResult | null,
    FormData
  >(async (prev, formData) => {
    const res = await createCareerOfficerAction(prev, formData);
    if (res.success) {
      setShowAddModal(false);
    }
    return res;
  }, null);

  const [isToggling, startTransition] = useTransition();

  const handleToggle = (userId: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleStaffStatusAction(userId, currentStatus);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Career Officers Directory & Management
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Super Admin CRUD: Create, authorize, and manage Career Officer
            accounts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#FF7F24] text-[#0A0A1A] font-extrabold text-xs sm:text-sm hover:bg-[#40297B] hover:text-white transition-all shadow-lg shadow-[#FF7F24]/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <i className="fas fa-user-plus" aria-hidden="true"></i>
          <span>Add Career Officer</span>
        </button>
      </div>

      {state?.message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <i
            className="fas fa-check-circle text-emerald-400"
            aria-hidden="true"
          ></i>
          <span>{state.message}</span>
        </div>
      )}

      {/* Officers Table */}
      <div className="bg-[#101023] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Officer / Staff Code</th>
                <th className="px-6 py-4">Institutional Email</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Permissions</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {initialOfficers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No Career Officers created yet. Click &quot;Add Career
                    Officer&quot; to create one.
                  </td>
                </tr>
              ) : (
                initialOfficers.map((officer) => (
                  <tr
                    key={officer.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">
                        {officer.fullName}
                      </div>
                      <div className="text-xs text-[#FF7F24] font-mono mt-0.5">
                        {officer.staffCode || "NO_CODE"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {officer.email}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-300">
                      {officer.designation || "Career Services Officer"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {officer.canManageAppointments && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-semibold border border-blue-500/20">
                            Appointments
                          </span>
                        )}
                        {officer.canManageServices && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-semibold border border-purple-500/20">
                            Entitlements
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          officer.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${officer.isActive ? "bg-emerald-400" : "bg-red-400"}`}
                        ></span>
                        {officer.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() =>
                          handleToggle(officer.userId, officer.isActive)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                          officer.isActive
                            ? "border-red-500/30 text-red-300 hover:bg-red-500/10"
                            : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                        }`}
                      >
                        {officer.isActive
                          ? "Disable Access"
                          : "Activate Access"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Career Officer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#101023] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Add New Career Officer
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Create staff login credentials for KSITM Career Services
                  advisors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white text-lg p-2 cursor-pointer"
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            {state?.error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Malam Lawal Katsina"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#FF7F24] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Staff Code
                  </label>
                  <input
                    name="staffCode"
                    type="text"
                    required
                    placeholder="KSITM/STAFF/CO/003"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#FF7F24] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Designation
                  </label>
                  <input
                    name="designation"
                    type="text"
                    defaultValue="Career Guidance Officer"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#FF7F24] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Institutional Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. careerofficer3@ksitmcareers.edu.ng"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#FF7F24] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Initial Password
                </label>
                <input
                  name="password"
                  type="text"
                  defaultValue="12345678"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:border-[#FF7F24] outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Default set to 12345678 for easy initial testing.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer">
                  <input
                    name="canManageAppointments"
                    type="checkbox"
                    defaultChecked
                    className="rounded text-[#FF7F24] focus:ring-0"
                  />
                  <span>Can schedule and manage student appointments</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer">
                  <input
                    name="canManageServices"
                    type="checkbox"
                    defaultChecked
                    className="rounded text-[#FF7F24] focus:ring-0"
                  />
                  <span>
                    Can assess student needs and modify service entitlements
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-gray-300 text-xs font-bold hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#FF7F24] text-[#0A0A1A] text-xs font-extrabold hover:bg-[#40297B] hover:text-white transition-all shadow-lg shadow-[#FF7F24]/20 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Creating..." : "Create Career Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
