import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  staffProfiles,
  studentProfiles,
  consultationRequests,
  appointments,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/actions/auth";

export const metadata: Metadata = {
  title: "Career Officer Portal — KSITM Careers",
  description:
    "Student advisory portal, appointment scheduling, and career service entitlements management.",
};

export const dynamic = "force-dynamic";

export default async function CareerOfficerPortalPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "STAFF" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // 1. Fetch staff profile
  const [officer] = await db
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, user.id))
    .limit(1);

  // 2. Fetch students and entitlements
  const students = await db
    .select({
      id: studentProfiles.id,
      fullName: studentProfiles.fullName,
      regNumber: studentProfiles.regNumber,
      department: studentProfiles.department,
      level: studentProfiles.level,
      phone: studentProfiles.phone,
      email: users.email,
    })
    .from(studentProfiles)
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .orderBy(desc(studentProfiles.createdAt))
    .limit(10);

  // 3. Fetch consultation requests
  const consultations = await db
    .select({
      id: consultationRequests.id,
      category: consultationRequests.category,
      reason: consultationRequests.reason,
      preferredDate: consultationRequests.preferredDate,
      preferredTimeSlot: consultationRequests.preferredTimeSlot,
      status: consultationRequests.status,
      studentName: studentProfiles.fullName,
      studentRegNumber: studentProfiles.regNumber,
    })
    .from(consultationRequests)
    .innerJoin(
      studentProfiles,
      eq(consultationRequests.studentId, studentProfiles.id),
    )
    .orderBy(desc(consultationRequests.createdAt))
    .limit(10);

  // 4. Fetch upcoming appointments
  const appts = await db
    .select({
      id: appointments.id,
      scheduledStart: appointments.scheduledStart,
      scheduledEnd: appointments.scheduledEnd,
      status: appointments.status,
      meetingLocation: appointments.meetingLocation,
      studentName: studentProfiles.fullName,
      studentRegNumber: studentProfiles.regNumber,
    })
    .from(appointments)
    .innerJoin(studentProfiles, eq(appointments.studentId, studentProfiles.id))
    .orderBy(desc(appointments.scheduledStart))
    .limit(5);

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white">
      {/* Top Officer Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A1A]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#FF7F24]/10 border border-[#FF7F24]/30 text-[#FF7F24] flex items-center justify-center font-bold text-sm">
              K
            </span>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white block">
                KSITM Careers
              </span>
              <span className="text-[10px] text-[#FF7F24] font-bold uppercase tracking-widest block -mt-1">
                Career Officer Portal
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white">
              {officer?.fullName || user.email}
            </div>
            <div className="text-[10px] text-[#FF7F24] font-mono">
              {officer?.staffCode || "STAFF_OFFICER"} •{" "}
              {officer?.designation || "Career Officer"}
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="py-1.5 px-3 rounded-lg border border-white/15 hover:border-red-500/50 hover:bg-red-500/10 text-gray-300 hover:text-red-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Welcome Banner */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#40297B]/30 via-[#101023] to-[#FF7F24]/10 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#FF7F24]/10 border border-[#FF7F24]/30 text-[#FF7F24] text-[11px] font-bold uppercase tracking-wider inline-block mb-2">
                Career Advisory Workspace
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {officer?.fullName || "Career Officer"}
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-2xl">
                Assess student career needs, schedule institutional
                consultations, and activate individualized service entitlements.
              </p>
            </div>
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Assigned Students
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {students.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Enrolled at KSITM</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Consultations
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#FF7F24] mt-1">
              {consultations.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Student guidance requests
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Appointments
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1">
              {appts.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Scheduled sessions</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Officer Role
            </div>
            <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-1 truncate">
              {officer?.designation || "Advisory Staff"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Full advisory rights</p>
          </div>
        </section>

        {/* Consultation Requests & Appointments */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Consultations */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white">
                Consultation Requests
              </h2>
              <span className="text-xs text-gray-400">
                {consultations.length} Total
              </span>
            </div>

            <div className="bg-[#101023] border border-white/10 rounded-2xl p-4 divide-y divide-white/5 space-y-3">
              {consultations.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  No consultation requests found.
                </div>
              ) : (
                consultations.map((c) => (
                  <div key={c.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {c.studentName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FF7F24]/10 text-[#FF7F24] border border-[#FF7F24]/20">
                        {c.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {c.studentRegNumber} • {c.category}
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2">
                      {c.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Appointments */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white">
                Confirmed Appointments
              </h2>
              <span className="text-xs text-gray-400">
                {appts.length} Scheduled
              </span>
            </div>

            <div className="bg-[#101023] border border-white/10 rounded-2xl p-4 divide-y divide-white/5 space-y-3">
              {appts.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  No appointments scheduled yet.
                </div>
              ) : (
                appts.map((a) => (
                  <div key={a.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {a.studentName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {a.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#FF7F24]">
                      <i className="fas fa-clock mr-1" aria-hidden="true"></i>
                      {new Date(a.scheduledStart).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      <i
                        className="fas fa-map-marker-alt mr-1"
                        aria-hidden="true"
                      ></i>
                      {a.meetingLocation}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Student Roster & Entitlements Management */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Student Directory & Needs Assessment
            </h2>
            <p className="text-gray-400 text-xs">
              Review registered students and manage their individual career
              service access.
            </p>
          </div>

          <div className="bg-[#101023] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Reg Number</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Department & Level</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Entitlements Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-mono font-bold text-[#FF7F24] text-xs">
                        {st.regNumber}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {st.fullName}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div>{st.department}</div>
                        <div className="text-gray-500">{st.level}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        <div>{st.email}</div>
                        <div className="text-gray-500">
                          {st.phone || "No phone"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active Enrolment
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
