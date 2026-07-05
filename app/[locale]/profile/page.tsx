"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { updateProfile, uploadProfilePhoto } from "@/lib/kyc-api";
import { ChangePhoneModal } from "@/components/ChangePhoneModal";
import { Camera, User, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOROCCO_CITIES } from "@/lib/moroccan-cities";

function ProfilePageContent() {
  const { user, token, tokenType, refreshUser } = useAuth();
  const { t, localePath } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [showChangePhone, setShowChangePhone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(user?.full_name ?? "");
    setEmail(user?.email ?? "");
    setCity(user?.city ?? "");
  }, [user]);

  const getToken = () => (tokenType === "jwt" ? token : null);

  const hasPhoto = !!(user?.profile_photo_url && String(user.profile_photo_url).trim().length > 0);

  // Full name and date of birth are always locked; user can edit email, city (phone requires backend support)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await updateProfile(
        {
          email: email || undefined,
          city: city || undefined,
        },
        getToken
      );
      await refreshUser();
      setMessage({ type: "success", text: t("profile.profileUpdated") });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : t("profile.updateFailed"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setUploading(true);
    try {
      await uploadProfilePhoto(file, getToken);
      await refreshUser();
      setMessage({ type: "success", text: t("profile.photoUpdated") });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : t("profile.photoFailed"),
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen bg-nexa-bg">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="bg-white rounded-[22px] border border-nexa-line shadow-nexa-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-nexa-ink to-nexa-ink-2 p-8">
              <h1 className="text-white text-2xl font-display font-bold mb-1">{t("profile.title")}</h1>
              <p className="text-white/70 text-sm">{t("profile.subtitle")}</p>
            </div>

            <div className="p-8">
              {/* Profile photo */}
              <div className="flex flex-col items-center mb-10">
                <div className="relative group">
                  <ProfileAvatar
                    hasPhoto={hasPhoto}
                    token={getToken()}
                    size="lg"
                    className="ring-4 ring-white shadow-nexa-md"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-nexa-primary text-white flex items-center justify-center shadow-lg hover:bg-nexa-primary-dark transition-colors disabled:opacity-60"
                    aria-label="Change photo"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <p className="text-sm text-nexa-ink-4 mt-2">
                  {uploading ? t("common.uploading") : t("profile.tapToChange")}
                </p>
              </div>

              {message && (
                <div
                  className={cn(
                    "mb-6 p-4 rounded-xl text-sm",
                    message.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  )}
                >
                  {message.text}
                </div>
              )}

              {/* Profile form - full name and date of birth locked; email, city editable */}
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-nexa-ink mb-2">
                    <User className="h-4 w-4" />
                    {t("profile.fullName")}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-nexa-line bg-nexa-bg-2 text-nexa-ink cursor-not-allowed"
                  />
                  <p className="text-xs text-nexa-ink-4 mt-1">{t("profile.locked")}</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-nexa-ink mb-2">
                    <Phone className="h-4 w-4" />
                    {t("profile.phoneNumber")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowChangePhone(true)}
                    className="w-full px-4 py-3 rounded-xl border border-nexa-line bg-white text-nexa-ink text-left hover:border-nexa-primary hover:bg-nexa-primary-soft/30 transition-colors"
                  >
                    {user?.phone_number ?? "—"}
                  </button>
                  <p className="text-xs text-nexa-ink-4 mt-1">{t("profile.tapToChangePhone")}</p>
                  {showChangePhone && user?.phone_number && (
                    <ChangePhoneModal
                      currentPhone={user.phone_number}
                      getToken={getToken}
                      onClose={() => setShowChangePhone(false)}
                      onSuccess={() => {
                        refreshUser();
                        setShowChangePhone(false);
                      }}
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-nexa-ink mb-2">
                    <Calendar className="h-4 w-4" />
                    {t("profile.dateOfBirth")}
                  </label>
                  <input
                    type="text"
                    value={
                      user?.date_of_birth
                        ? new Date(user.date_of_birth).toLocaleDateString("en-CA", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })
                        : ""
                    }
                    readOnly
                    disabled
                    placeholder="Not set"
                    className="w-full px-4 py-3 rounded-xl border border-nexa-line bg-nexa-bg-2 text-nexa-ink cursor-not-allowed"
                  />
                  <p className="text-xs text-nexa-ink-4 mt-1">{t("profile.locked")}</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-nexa-ink mb-2">
                    <Mail className="h-4 w-4" />
                    {t("profile.email")}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-nexa-line bg-white text-nexa-ink placeholder:text-nexa-ink-4"
                  />
                  <p className="text-xs text-nexa-ink-4 mt-1">You can change this anytime</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-nexa-ink mb-2">
                    <MapPin className="h-4 w-4" />
                    {t("profile.city")}
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-nexa-line bg-white text-nexa-ink outline-none focus:border-nexa-primary min-h-[44px]"
                  >
                    <option value="">Select city</option>
                    {city && !MOROCCO_CITIES.includes(city) ? (
                      <option value={city}>{city}</option>
                    ) : null}
                    {MOROCCO_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-nexa-ink-4 mt-1">You can change this anytime</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-nexa-ink mb-2 block">{t("profile.kycStatus")}</label>
                  <span
                    className={cn(
                      "inline-flex px-3 py-1 rounded-full text-sm font-medium",
                      user?.kyc_status === "APPROVED" || user?.kyc_status === "VERIFIED"
                        ? "bg-green-100 text-green-800"
                        : user?.kyc_status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {user?.kyc_status ?? "PENDING"}
                  </span>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? t("common.saving") : t("profile.saveChanges")}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={localePath("/listings")}>{t("profile.backToStays")}</Link>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
