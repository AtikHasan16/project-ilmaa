import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router";
import { HiVolumeUp } from "react-icons/hi";
import { HiArrowRight } from "react-icons/hi2";
import { FaLinkedin, FaGithub, FaDiscord } from "react-icons/fa6";
import { speakWithMicrosoftTTS } from "../utils/speechTts";

export default function LandingPage() {
  const [name, setName] = useState("");
  const [accessId, setAccessId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [playingAudio, setPlayingAudio] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/workspace/vocab");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const cleanId = accessId.replace(/\D/g, "");
    if (cleanId.length !== 10) {
      setErrorMessage("Access ID must be exactly 10 numeric digits.");
      return;
    }

    setSubmitting(true);
    const result = await login(name, cleanId);
    setSubmitting(false);

    if (result.success) {
      if (result.status === "approved") {
        navigate("/workspace/vocab");
      } else if (result.status === "pending") {
        navigate("/access/pending");
      }
    } else {
      if (result.status === "rejected") {
        navigate("/access/rejected");
      } else {
        setErrorMessage(
          result.message || "Invalid credentials or login request failed.",
        );
      }
    }
  };

  const playPhonemeSample = () => {
    speakWithMicrosoftTTS("Imlaa", {
      voice: "en-US-ChristopherNeural",
      onStart: () => setPlayingAudio(true),
      onEnd: () => setPlayingAudio(false),
      onError: () => setPlayingAudio(false),
    });
  };

  return (
    <div className="min-h-screen w-full bg-white text-body-dark flex flex-col justify-center items-center px-4 sm:px-8  pt-10">
      <main className="w-full max-w-6xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Hero, Framework & Phoneme Sample */}
        <div className="lg:col-span-7 flex flex-col space-y-7">
          <div>
            <div className="flex items-center space-x-2 text-base uppercase font-bold tracking-[0.2em] text-plum mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-plum inline-block"></span>
              <span>Linguistic Mastery Platform</span>
            </div>

            <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-body-dark leading-none mb-3">
              Imlaa<span className="text-plum">.</span>
            </h1>

            <h2 className="text-2xl sm:text-3xl font-medium text-plum tracking-tight mb-4">
              Hear it. Spell it. Own it.
            </h2>

            <p className="text-lg text-muted-label leading-relaxed max-w-xl">
              A focused orthography and auditory spelling mastery tool. Listen
              to precise pronunciation, test recall without visual bias, and
              achieve instinctive vocabulary retention.
            </p>
          </div>

          {/* Pedagogical Framework Card */}
          <div className="imlaa-card p-6 sm:p-7">
            <div className="text-base font-bold uppercase tracking-[0.2em] text-plum mb-5">
              Pedagogical Framework
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-2xl font-bold text-body-dark mb-1">01</div>
                <div className="text-lg font-semibold text-body-dark mb-1.5">
                  Zero Distraction
                </div>
                <div className="text-base text-muted-label leading-relaxed">
                  Absence of visual cues forces purely auditory-orthographic
                  neuro-mapping.
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-body-dark mb-1">02</div>
                <div className="text-lg font-semibold text-body-dark mb-1.5">
                  Acoustic Accuracy
                </div>
                <div className="text-base text-muted-label leading-relaxed">
                  Calibrated studio enunciations covering high-friction phonemic
                  transitions.
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-body-dark mb-1">03</div>
                <div className="text-lg font-semibold text-body-dark mb-1.5">
                  Systematic Retention
                </div>
                <div className="text-base text-muted-label leading-relaxed">
                  Targeted spaced repetition rooted in active phoneme
                  reconstruction.
                </div>
              </div>
            </div>
          </div>

          {/* Phoneme Sample Banner */}
          <div className="imlaa-card p-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={playPhonemeSample}
                title="Play Phoneme Sample"
                className="w-14 h-14 rounded-xl bg-plum hover:bg-plum-hover text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95"
              >
                <HiVolumeUp
                  className={`w-7 h-7 ${playingAudio ? "animate-pulse" : ""}`}
                />
              </button>
              <div>
                <div className="text-lg font-bold text-body-dark">
                  Phoneme Sample:{" "}
                  <span className="font-mono text-plum">/ɪmˈlɑːʔ/</span>
                </div>
                <div className="text-base text-muted-label mt-0.5">
                  Isolated articulation • Standard Academic
                </div>
              </div>
            </div>

            {/* Audio Wave Graphic Simulation */}
            <div className="flex items-center space-x-1.5 pr-2">
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-8 animate-pulse" : "h-4"}`}
              ></span>
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-11" : "h-7"}`}
              ></span>
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-6" : "h-3"}`}
              ></span>
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-10" : "h-6"}`}
              ></span>
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-7" : "h-4"}`}
              ></span>
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-4" : "h-2"}`}
              ></span>
            </div>
          </div>
        </div>

        {/* Right Column: Access Workspace Card */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="imlaa-card p-6 sm:p-9">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-body-dark tracking-tight">
                Access Workspace
              </h2>
              <span className="text-base font-mono px-3 py-1 rounded-full border border-plum/25 text-plum font-semibold">
                v1.0
              </span>
            </div>

            <p className="text-base sm:text-lg text-muted-label mb-7 leading-relaxed">
              Authenticate using your registered academic credentials.
            </p>

            {errorMessage && (
              <div className="mb-5 p-4 rounded-xl border border-plum/30 bg-plum/5 text-base text-plum font-medium leading-relaxed">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-semibold text-body-dark mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="imlaa-input py-3.5 px-4 text-base"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-base font-semibold text-body-dark">
                    10-Digit ID
                  </label>
                  <span className="text-base text-muted-label font-medium">
                    Numeric only
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="• • • • • • • • • •"
                  value={accessId}
                  onChange={(e) =>
                    setAccessId(e.target.value.replace(/\D/g, ""))
                  }
                  className="imlaa-input py-3.5 px-4 text-base font-mono tracking-widest text-center"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="imlaa-btn-primary w-full py-4 text-base sm:text-lg space-x-2"
              >
                <span>
                  {submitting ? "Authenticating..." : "Enter Workspace"}
                </span>
                <HiArrowRight className="w-5 h-5" />
              </button>
            </form>

            <div className="mt-4">
              <p className="text-muted-label text-center text-sm">
                For Access please{" "}
                <Link
                  to="/contact"
                  className="text-plum font-semibold hover:underline"
                >
                  contact us
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Clean Footer */}
      <footer className="border-t border-plum/15 bg-white py-8 mt-16 text-muted-label text-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand & Copyright */}
          <div className="flex flex-col sm:flex-row items-center sm:space-x-3 text-center sm:text-left">
            <span className="font-black text-plum tracking-tight text-base">Imlaa</span>
            <span className="hidden sm:inline text-plum/30">•</span>
            <span>© {new Date().getFullYear()} Imlaa IELTS Workspace. All rights reserved.</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6 text-body-dark font-medium">
            <Link to="/about" className="hover:text-plum transition">
              About
            </Link>
            <Link to="/contact" className="hover:text-plum transition">
              Contact
            </Link>
          </div>

          {/* Social Icons */}
          <div className="flex items-center space-x-4 text-plum">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              className="p-2 rounded-lg hover:bg-plum/10 transition"
            >
              <FaLinkedin className="w-5 h-5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="p-2 rounded-lg hover:bg-plum/10 transition"
            >
              <FaGithub className="w-5 h-5" />
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Discord"
              className="p-2 rounded-lg hover:bg-plum/10 transition"
            >
              <FaDiscord className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
