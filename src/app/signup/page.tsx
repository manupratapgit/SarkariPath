"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

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

interface Step1Data { fullName: string; email: string; password: string; confirm: string; }
interface Step2Data {
  dob: string; gender: string;
  qualification: string; fieldOfStudy: string; category: string; preferredExams: string[];
}

const EMPTY2: Step2Data = {
  dob: "", gender: "",
  qualification: "", fieldOfStudy: "", category: "", preferredExams: [],
};

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
      />
    </div>
  );
}

function SelectField({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        {...props}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
      >
        {children}
      </select>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [s1, setS1] = useState<Step1Data>({ fullName: "", email: "", password: "", confirm: "" });
  const [s2, setS2] = useState<Step2Data>(EMPTY2);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (s1.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (s1.password !== s1.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: s1.email,
      password: s1.password,
      options: { data: { full_name: s1.fullName } },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setUserId(data.user?.id ?? null);
    setLoading(false);
    setStep(2);
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Get session user, or fall back to userId from signUp response
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id ?? userId;

    if (!uid) {
      // Email confirmation still pending — send to login with notice
      router.push("/login?notice=confirm");
      setLoading(false);
      return;
    }

    // Save profile via server API (uses service role key, bypasses RLS)
    const profileRes = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: uid,
        full_name: s1.fullName,
        date_of_birth: s2.dob || null,
        gender: s2.gender,
        highest_qualification: s2.qualification,
        field_of_study: s2.fieldOfStudy,
        category: s2.category,
        preferred_exams: s2.preferredExams,
      }),
    });

    if (!profileRes.ok) {
      const { error: e } = await profileRes.json();
      setError(e ?? "Failed to save profile. Please try again.");
      setLoading(false);
      return;
    }

    // Send welcome email (non-blocking)
    fetch("/api/auth/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: s1.email, name: s1.fullName }),
    }).catch(() => {});

    router.push("/dashboard");
    setLoading(false);
  };

  const toggleExam = (exam: string) =>
    setS2((p) => ({
      ...p,
      preferredExams: p.preferredExams.includes(exam)
        ? p.preferredExams.filter((e) => e !== exam)
        : [...p.preferredExams, exam],
    }));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold">SP</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Sarkari<span className="text-orange-500">Path</span></span>
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === n ? "bg-orange-500 text-white" : step > n ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>{step > n ? "✓" : n}</div>
              {n < 2 && <div className={`w-12 h-0.5 ${step > n ? "bg-green-400" : "bg-gray-200"}`} />}
            </div>
          ))}
          <span className="ml-2 text-sm text-gray-500">{step === 1 ? "Create account" : "Complete profile"}</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {step === 1 ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
              <p className="text-gray-500 text-sm mb-6">Free forever. No credit card needed.</p>
              <form onSubmit={handleSignup} className="space-y-4">
                <InputField label="Full Name" value={s1.fullName} onChange={(e) => setS1(p => ({ ...p, fullName: e.target.value }))} placeholder="Manu Pratap" required />
                <InputField label="Email address" type="email" value={s1.email} onChange={(e) => setS1(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" required />
                <InputField label="Password" type="password" value={s1.password} onChange={(e) => setS1(p => ({ ...p, password: e.target.value }))} placeholder="Minimum 8 characters" required minLength={8} />
                <InputField label="Confirm Password" type="password" value={s1.confirm} onChange={(e) => setS1(p => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter password" required />
                {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 mt-2">
                  {loading ? "Creating account…" : "Create Account →"}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-orange-500 font-medium hover:underline">Log in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Complete your profile</h1>
              <p className="text-gray-500 text-sm mb-6">Help us personalise job recommendations for you.</p>
              <form onSubmit={handleProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Date of Birth" type="date" value={s2.dob} onChange={(e) => setS2(p => ({ ...p, dob: e.target.value }))} />
                  <SelectField label="Gender" value={s2.gender} onChange={(e) => setS2(p => ({ ...p, gender: e.target.value }))}>
                    <option value="">Select gender</option>
                    {["Male","Female","Other"].map(g => <option key={g}>{g}</option>)}
                  </SelectField>
                  <SelectField label="Category" value={s2.category} onChange={(e) => setS2(p => ({ ...p, category: e.target.value }))}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </SelectField>
                  <SelectField label="Highest Qualification" value={s2.qualification} onChange={(e) => setS2(p => ({ ...p, qualification: e.target.value }))}>
                    <option value="">Select qualification</option>
                    {QUALIFICATIONS.map(q => <option key={q}>{q}</option>)}
                  </SelectField>
                  <div className="sm:col-span-2">
                    <SelectField label="Field of Study" value={s2.fieldOfStudy} onChange={(e) => setS2(p => ({ ...p, fieldOfStudy: e.target.value }))}>
                      <option value="">Select field of study</option>
                      {FIELDS_OF_STUDY.map(f => <option key={f}>{f}</option>)}
                    </SelectField>
                  </div>
                </div>

                {/* Exam preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Exams</label>
                  <div className="flex flex-wrap gap-2">
                    {EXAMS.map((exam) => (
                      <button key={exam} type="button" onClick={() => toggleExam(exam)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          s2.preferredExams.includes(exam)
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                        }`}>
                        {exam}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60">
                  {loading ? "Saving…" : "Save & Continue →"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          By signing up you agree to our{" "}
          <Link href="/terms" className="hover:underline">Terms</Link> &{" "}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
