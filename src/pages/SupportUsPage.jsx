import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  HiHeart,
  HiClipboardDocument,
  HiCheck,
  HiArrowLeft,
  HiSparkles,
} from "react-icons/hi2";
import { SiBuymeacoffee, SiPaypal } from "react-icons/si";
import { showSuccessToast } from "../utils/sweetalert";

export default function SupportUsPage() {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(null);

  const bdMethods = [
    {
      id: "bkash",
      name: "bKash",
      number: "01789123456",
      type: "Personal (Send Money)",
      note: "Use 'Imlaa' in reference",
      tagColor: "bg-pink-50 text-pink-700 border-pink-200",
    },
    {
      id: "nagad",
      name: "Nagad",
      number: "01889123456",
      type: "Personal (Send Money)",
      note: "Use 'Imlaa' in reference",
      tagColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "rocket",
      name: "Rocket",
      number: "01989123456-7",
      type: "Personal",
      note: "Use *322# or app",
      tagColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  const handleCopy = async (id, text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      showSuccessToast("Copied!", `${text} copied to clipboard.`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-white text-body-dark flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-plum/15 px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold transition cursor-pointer"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
          <div className="flex items-center space-x-2 text-plum font-bold tracking-tight text-xl">
            <span>Imlaa</span>
            <span className="w-2 h-2 rounded-full bg-plum inline-block"></span>
          </div>
        </div>
      </header>

      {/* Main Content (Simple, clean, minimal text) */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-10 animate-slide-up">
        {/* Simple Title */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-plum/10 text-plum font-bold text-xs tracking-wide">
            <HiHeart className="w-3.5 h-3.5 text-plum" />
            <span>Support The Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-body-dark tracking-tight">
            Help Keep Imlaa Free
          </h1>
          <p className="text-base text-muted-label">
            Your contributions directly support cloud servers and Neural TTS voice synthesis for IELTS candidates.
          </p>
        </div>

        {/* 2 Simple Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* 1. International */}
          <div className="imlaa-card p-6 border border-plum/20 bg-white space-y-5">
            <div className="flex items-center space-x-2 pb-2 border-b border-plum/10">
              <HiSparkles className="w-4 h-4 text-plum" />
              <h2 className="text-lg font-bold text-body-dark">International</h2>
            </div>

            <div className="space-y-3">
              <a
                href="https://buymeacoffee.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100 transition group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-400 text-stone-900 flex items-center justify-center font-bold">
                    <SiBuymeacoffee className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-stone-900">Buy Me a Coffee</div>
                    <div className="text-xs text-stone-600">Card, Apple Pay, Google Pay</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800 group-hover:translate-x-0.5 transition">
                  Contribute &rarr;
                </span>
              </a>

              <a
                href="https://paypal.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-sky-200 bg-sky-50/80 hover:bg-sky-100 transition group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
                    <SiPaypal className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-stone-900">PayPal</div>
                    <div className="text-xs text-stone-600">Direct wallet / card payment</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-sky-800 group-hover:translate-x-0.5 transition">
                  Contribute &rarr;
                </span>
              </a>
            </div>
          </div>

          {/* 2. Bangladesh (bKash / Nagad / Rocket) */}
          <div className="imlaa-card p-6 border border-plum/20 bg-white space-y-5">
            <div className="flex items-center space-x-2 pb-2 border-b border-plum/10">
              <span className="text-sm">🇧🇩</span>
              <h2 className="text-lg font-bold text-body-dark">Mobile Banking (Bangladesh)</h2>
            </div>

            <div className="space-y-2.5">
              {bdMethods.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl border border-plum/15 bg-plum/5 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-body-dark">{m.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${m.tagColor}`}>
                        {m.type}
                      </span>
                    </div>
                    <div className="text-base font-mono font-bold text-plum mt-0.5 tracking-wide">
                      {m.number}
                    </div>
                    <div className="text-[11px] text-muted-label">{m.note}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(m.id, m.number)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-plum/25 hover:bg-plum/10 text-xs font-semibold text-plum flex items-center space-x-1 shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    {copiedId === m.id ? (
                      <>
                        <HiCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <HiClipboardDocument className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Small note */}
        <p className="text-xs text-muted-label text-center">
          Any amount helps maintain database servers and voice generation for students in need.
        </p>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-plum/15 py-5 text-center text-xs text-muted-label">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Imlaa IELTS Workspace</span>
          <Link to="/contact" className="hover:text-plum transition">
            Contact Support
          </Link>
        </div>
      </footer>
    </div>
  );
}
