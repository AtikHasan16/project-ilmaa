import { useState } from "react";
import { Link } from "react-router";
import {
  HiHeart,
  HiClipboardDocument,
  HiCheck,
  HiSparkles,
  HiServerStack,
  HiSpeakerWave,
  HiShieldCheck,
  HiArrowLeft,
} from "react-icons/hi2";
import { SiBuymeacoffee, SiPaypal } from "react-icons/si";
import { showSuccessToast } from "../utils/sweetalert";

export default function ContributePage() {
  const [copiedKey, setCopiedKey] = useState(null);

  const bdPaymentMethods = [
    {
      id: "bkash",
      name: "bKash",
      type: "Personal (Send Money)",
      number: "01789123456", // Placeholder easily customizable by user
      color: "bg-pink-50 text-pink-700 border-pink-200",
      accent: "text-pink-600",
      instructions: "Go to bKash App -> Send Money -> Enter number.",
    },
    {
      id: "nagad",
      name: "Nagad",
      type: "Personal (Send Money)",
      number: "01889123456",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      accent: "text-amber-600",
      instructions: "Go to Nagad App -> Send Money -> Enter number.",
    },
    {
      id: "rocket",
      name: "Rocket",
      type: "Personal",
      number: "01989123456-7",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      accent: "text-purple-600",
      instructions: "Go to Rocket App / *322# -> Send Money.",
    },
  ];

  const handleCopy = async (id, text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedKey(id);
      showSuccessToast("Copied to Clipboard", `${text} is ready to paste.`);
      setTimeout(() => setCopiedKey(null), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-white text-body-dark flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-plum/15 px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold transition"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2 text-plum font-bold tracking-tight text-xl">
            <span>Imlaa</span>
            <span className="w-2 h-2 rounded-full bg-plum inline-block"></span>
          </div>
        </div>
      </header>

      {/* Main Hero & Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-12 animate-slide-up">
        {/* Hero Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-plum/10 text-plum font-bold text-sm tracking-wide">
            <HiHeart className="w-4 h-4 text-plum" />
            <span>Community Supported Learning</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-body-dark tracking-tight leading-tight">
            Support Imlaa & Keep It Free for Everyone.
          </h1>
          <p className="text-lg text-muted-label leading-relaxed">
            Imlaa was built to empower IELTS candidates with high-fidelity auditory dictation and active spelling recall. Your contributions directly fund cloud servers, Microsoft Neural TTS voice synthesis, and continuous platform development.
          </p>
        </div>

        {/* Impact Transparency Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="imlaa-card p-6 border border-plum/20 bg-white space-y-2">
            <div className="w-12 h-12 rounded-xl bg-plum/10 text-plum flex items-center justify-center mb-3">
              <HiSpeakerWave className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-body-dark">Neural Speech Synthesis</h3>
            <p className="text-sm text-muted-label leading-relaxed">
              Provides crystal-clear, standard academic British and American pronunciations for every vocabulary item without compression.
            </p>
          </div>

          <div className="imlaa-card p-6 border border-plum/20 bg-white space-y-2">
            <div className="w-12 h-12 rounded-xl bg-plum/10 text-plum flex items-center justify-center mb-3">
              <HiServerStack className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-body-dark">Reliable Infrastructure</h3>
            <p className="text-sm text-muted-label leading-relaxed">
              Keeps backend APIs, Supabase databases, and real-time candidate progress synchronization fast, scalable, and uninterrupted.
            </p>
          </div>

          <div className="imlaa-card p-6 border border-plum/20 bg-white space-y-2">
            <div className="w-12 h-12 rounded-xl bg-plum/10 text-plum flex items-center justify-center mb-3">
              <HiShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-body-dark">100% Free & Ad-Free</h3>
            <p className="text-sm text-muted-label leading-relaxed">
              Zero distracting advertisements, commercial tracking, or paywalled word banks. Every candidate gets equal learning opportunities.
            </p>
          </div>
        </div>

        {/* Contribution Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* 1. International Donors */}
          <div className="imlaa-card p-6 sm:p-8 border border-plum/20 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-plum mb-1">
                <HiSparkles className="w-4 h-4" />
                <span>Global Supporters</span>
              </div>
              <h2 className="text-2xl font-bold text-body-dark">International Contribution</h2>
              <p className="text-sm text-muted-label mt-1">
                Support via credit/debit card, Apple Pay, Google Pay, or PayPal.
              </p>
            </div>

            <div className="space-y-4">
              {/* Buy Me a Coffee */}
              <a
                href="https://buymeacoffee.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/70 transition group cursor-pointer"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-lg bg-amber-400 text-stone-900 flex items-center justify-center shadow-xs">
                    <SiBuymeacoffee className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900">Buy Me a Coffee</div>
                    <div className="text-xs text-stone-600">Quick tip with Card, Apple Pay, or Google Pay</div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-amber-800 group-hover:translate-x-1 transition">
                  Donate &rarr;
                </span>
              </a>

              {/* PayPal */}
              <a
                href="https://paypal.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100/70 transition group cursor-pointer"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                    <SiPaypal className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900">PayPal</div>
                    <div className="text-xs text-stone-600">Direct donation via balance or linked card</div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-sky-800 group-hover:translate-x-1 transition">
                  Donate &rarr;
                </span>
              </a>
            </div>

            <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 text-xs text-muted-label leading-relaxed">
              💡 Please mention your registered email in the donation note if you would like your account upgraded to an early <strong>Advance/Supporter</strong> badge!
            </div>
          </div>

          {/* 2. Bangladeshi Candidates & Donors */}
          <div className="imlaa-card p-6 sm:p-8 border border-plum/20 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-plum mb-1">
                <span>🇧🇩</span>
                <span>Bangladesh Candidates</span>
              </div>
              <h2 className="text-2xl font-bold text-body-dark">Mobile Banking (bKash / Nagad / Rocket)</h2>
              <p className="text-sm text-muted-label mt-1">
                Easily contribute via personal Send Money from any wallet in Bangladesh.
              </p>
            </div>

            <div className="space-y-3.5">
              {bdPaymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 rounded-xl border ${method.color} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-body-dark">{method.name}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/70 border border-current/20">
                        {method.type}
                      </span>
                    </div>
                    <div className="text-lg font-mono font-bold mt-1 tracking-wider text-body-dark">
                      {method.number}
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">{method.instructions}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(method.id, method.number)}
                    className="self-start sm:self-auto px-3.5 py-2 rounded-lg bg-white border border-plum/20 hover:bg-plum/5 text-sm font-semibold text-plum flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    {copiedKey === method.id ? (
                      <>
                        <HiCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <HiClipboardDocument className="w-4 h-4" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-label text-center pt-2">
              Any amount, even ৳50 or ৳100, helps maintain the cloud database and audio server for candidates in need!
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-plum/15 py-6 text-center text-sm text-muted-label mt-12">
        <div className="max-w-5xl mx-auto px-4">
          © {new Date().getFullYear()} Imlaa IELTS Workspace • Built with dedication for candidates worldwide.
        </div>
      </footer>
    </div>
  );
}
