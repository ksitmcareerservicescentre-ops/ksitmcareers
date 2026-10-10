"use client";

import { useEffect, useState } from "react";
import {
  getCurrentUserProfileDetailAction,
  updateUserProfileAction,
  resetPasswordAction,
  type UserProfileData,
} from "@/actions/profile";
import { isValidLinkedInUrl } from "@/lib/validators";

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";

const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

export function ProfileSettingsModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");

  // Password Reset Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    getCurrentUserProfileDetailAction()
      .then((data) => {
        if (data) {
          setProfile(data);
          setFullName(data.fullName);
          setPhone(data.phone || "");
          setBio(data.bio || "");
          setAvatarUrl(data.avatarUrl || "");
          setLinkedInUrl(data.linkedInUrl || "");
          setDesignation(data.designation || "");
          setDepartment(data.department || "");
          setLevel(data.level || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (linkedInUrl.trim() && !isValidLinkedInUrl(linkedInUrl.trim())) {
      setError("LinkedIn link must be an official LinkedIn URL (e.g. https://www.linkedin.com/in/username).");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await updateUserProfileAction({
        fullName,
        phone,
        bio,
        avatarUrl,
        linkedInUrl,
        designation,
        department,
        level,
      });

      if (!res.success) throw new Error(res.error);
      setSuccessMsg("Profile details updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (profile?.role === "SUPER_ADMIN") {
      setError("Super Administrator accounts are excluded from self-service password reset.");
      return;
    }

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await resetPasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!res.success) throw new Error(res.error);
      setSuccessMsg(res.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        {/* Sticky Header with Proportionate Space and Prominent Close Button */}
        <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block">
              User Identity & Security Gateway
            </span>
            <h2 className="font-academic text-xl font-bold text-white sm:text-2xl">
              Profile & Account Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition-all shadow-sm cursor-pointer"
            title="Close"
          >
            <i className="fas fa-times text-sm text-orange-400" />
            <span>Close</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
            <i className="fas fa-check-circle text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-white/[0.08] gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "profile"
                ? "border-b-2 border-orange-500 text-orange-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-user-edit mr-1.5" />
            Personal Profile & Bio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "password"
                ? "border-b-2 border-orange-500 text-orange-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-shield-alt mr-1.5" />
            Password Reset
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">Loading user profile…</div>
        ) : activeTab === "profile" ? (
          /* Profile Details Form */
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-300">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputStyle}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className={inputStyle}
                />
              </div>
            </div>

            {/* Profile Picture / Avatar & LinkedIn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-300">Avatar / Photo URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or image link"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-blue-400 flex items-center justify-between">
                  <span>LinkedIn Profile Link</span>
                  <span className="text-[10px] text-gray-500 font-normal">Only LinkedIn supported</span>
                </label>
                <input
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/yourname"
                  className={inputStyle}
                />
              </div>
            </div>

            {/* Role Specific fields */}
            {profile?.role === "STAFF" && (
              <div>
                <label className="text-xs font-semibold text-gray-300">Academic / Staff Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Career Advisory Officer / Senior Lecturer"
                  className={inputStyle}
                />
              </div>
            )}

            {profile?.role === "STUDENT" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300">Level</label>
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-300">About Me / Professional Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a concise academic or career summary. This appears on your educational resource shares and public identity."
                className={`${inputStyle} resize-none`}
              />
            </div>

            <div className="flex justify-end border-t border-white/[0.08] pt-4">
              <button
                type="submit"
                disabled={savingProfile}
                className={orangeButton}
              >
                {savingProfile ? "Saving…" : "Save Profile Details"}
              </button>
            </div>
          </form>
        ) : (
          /* Password Reset Form */
          <div className="space-y-4">
            {profile?.role === "SUPER_ADMIN" ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <i className="fas fa-shield-alt text-base" />
                  <span>Super Administrator Protection Policy</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Super Administrator accounts are excluded from web self-service password resets. To maintain institutional security governance, Super Admin credentials can only be reconfigured through authorized server-level environment variables or database administrators.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-gray-400">
                  Enter your current password followed by your new password (minimum 8 characters).
                </p>

                <div>
                  <label className="text-xs font-semibold text-gray-300">Current Password *</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className={inputStyle}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300">New Password *</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300">Confirm New Password *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className={inputStyle}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-white/[0.08] pt-4">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className={orangeButton}
                  >
                    {savingPassword ? "Updating Password…" : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
