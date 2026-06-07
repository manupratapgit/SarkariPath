"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase-browser";
import { useUser } from "@/hooks/useUser";

interface Profile {
  full_name: string;
  date_of_birth: string;
  gender: string;
  highest_qualification: string;
  field_of_study: string;
  category: string;
  preferred_exams: string[];
}

const EXAMS = ["UPSC","SSC","Banking","Railways","State PSC","Teaching","Defence","PSU"];
const QUALIFICATIONS = ["10th Pass","12th Pass","Diploma","Graduation","Post Graduation","PhD"];
const CATEGORIES = ["General","OBC","SC","ST","EWS"];
const FIELDS_OF_STUDY = [
  "Engineering","Arts & Humanities","Commerce","Science","Mathematics",
  "Agriculture","Law","Medicine & Healthcare","Management & MBA",
  "Computer Science & IT","Education & Teaching","Social Sciences",
  "Economics","Political Science","History","Geography","Hindi Literature",
  "English Literature","Other",
];

const EMPTY: Profile = {
  full_name: "", date_of_birth: "", gender: "",
  highest_qualification: "", field_of_study: "", category: "", preferred_exams: [],
};

export default function ProfilePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) setProfile({ ...EMPTY, ...data });
      setFetching(false);
    });
  }, [user]);

  const toggleExam = (exam: string) => {
    setProfile((p) => ({
      ...p,
      preferred_exams: p.preferred_exams.includes(exam)
        ? p.preferred_exams.filter((e) => e !== exam)
        : [...p.preferred_exams, exam],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Signed in as <strong>{user?.email}</strong></p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Personal Info */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                <input value={profile.full_name} onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                <input type="date" value={profile.date_of_birth} onChange={(e) => setProfile(p => ({ ...p, date_of_birth: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                <select value={profile.gender} onChange={(e) => setProfile(p => ({ ...p, gender: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">Select gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
          </section>

          {/* Education */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Education & Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <select value={profile.category} onChange={(e) => setProfile(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Highest Qualification</label>
                <select value={profile.highest_qualification} onChange={(e) => setProfile(p => ({ ...p, highest_qualification: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">Select qualification</option>
                  {QUALIFICATIONS.map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Field of Study</label>
                <select value={profile.field_of_study} onChange={(e) => setProfile(p => ({ ...p, field_of_study: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">Select field of study</option>
                  {FIELDS_OF_STUDY.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Exam Preferences */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Exam Preferences</h2>
            <p className="text-sm text-gray-500">Select exams you&apos;re interested in — we&apos;ll personalise your digest.</p>
            <div className="flex flex-wrap gap-2">
              {EXAMS.map((exam) => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => toggleExam(exam)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    profile.preferred_exams.includes(exam)
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                  }`}
                >
                  {exam}
                </button>
              ))}
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Profile"}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
