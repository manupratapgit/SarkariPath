import Link from "next/link";

const LINKS = {
  Jobs: [
    "/jobs?examType=UPSC",
    "/jobs?examType=SSC",
    "/jobs?examType=Railways+%28RRB%29",
    "/jobs?examType=Banking+%28IBPS%2FSBI%29",
    "/jobs?examType=Defence",
    "/jobs?examType=Teaching",
  ],
  Resources: [
    "/jobs?status=Result+Out",
    "/jobs?status=Admit+Card+Out",
    "/jobs?status=Open",
    "/jobs?status=Open",
    "/jobs",
  ],
  Company: ["/about", "/contact", "/privacy", "/terms"],
};

const LINK_LABELS: Record<string, string[]> = {
  Jobs: ["UPSC", "SSC", "Railways", "Banking", "Defence", "Teaching"],
  Resources: ["Results", "Admit Cards", "Syllabus", "Cut-off", "Previous Papers"],
  Company: ["About", "Contact", "Privacy Policy", "Terms of Use"],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-14 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <span className="font-bold text-lg text-white">
                Sarkari<span className="text-orange-400">Path</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              India&apos;s most trusted government job portal. AI-powered, always accurate, always official.
            </p>
            <div className="flex gap-3">
              {["Twitter", "Telegram", "YouTube"].map((s) => (
                <a key={s} href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors text-xs font-medium">
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.keys(LINKS).map((cat) => (
            <div key={cat}>
              <h4 className="text-white text-sm font-semibold mb-3">{cat}</h4>
              <ul className="space-y-2">
                {LINK_LABELS[cat].map((label, i) => (
                  <li key={label}>
                    <Link
                      href={LINKS[cat as keyof typeof LINKS][i]}
                      className="text-sm hover:text-orange-400 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© {new Date().getFullYear()} SarkariPath. All rights reserved.</p>
          <p>Made with ❤️ for India&apos;s crore+ government job aspirants.</p>
        </div>
      </div>
    </footer>
  );
}
