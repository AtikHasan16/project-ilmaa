import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { HiVolumeUp } from "react-icons/hi";
import { HiChevronDown, HiArrowRight } from "react-icons/hi2";

export default function LandingPage() {
  const [name, setName] = useState("");
  const [accessId, setAccessId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showIdAccordion, setShowIdAccordion] = useState(false);
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
    if (!("speechSynthesis" in window)) return;
    setPlayingAudio(true);
    const utterance = new SpeechSynthesisUtterance("Imlaa");
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.onend = () => setPlayingAudio(false);
    utterance.onerror = () => setPlayingAudio(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen w-full bg-white text-body-dark flex flex-col justify-center items-center px-4 sm:px-8  pt-10">
      <main className="w-full max-w-6xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Hero, Framework & Phoneme Sample */}
        <div className="lg:col-span-7 flex flex-col space-y-7">
          <div>
            <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-[0.2em] text-plum mb-3">
              <span className="w-2 h-2 rounded-full bg-plum inline-block"></span>
              <span>Linguistic Mastery Platform</span>
            </div>

            <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-body-dark leading-none mb-3">
              Imlaa<span className="text-plum">.</span>
            </h1>

            <h2 className="text-2xl sm:text-3xl font-medium text-plum tracking-tight mb-4">
              Hear it. Spell it. Own it.
            </h2>

            <p className="text-base sm:text-lg text-muted-label leading-relaxed max-w-xl">
              A focused orthography and auditory spelling mastery tool. Listen
              to precise pronunciation, test recall without visual bias, and
              achieve instinctive vocabulary retention.
            </p>
          </div>

          {/* Pedagogical Framework Card */}
          <div className="border border-plum/20 rounded-2xl p-6 sm:p-7 bg-white shadow-xs">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-plum mb-5">
              Pedagogical Framework
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-lg font-bold text-body-dark mb-1">01</div>
                <div className="text-sm font-semibold text-body-dark mb-1.5">
                  Zero Distraction
                </div>
                <div className="text-xs text-muted-label leading-relaxed">
                  Absence of visual cues forces purely auditory-orthographic
                  neuro-mapping.
                </div>
              </div>

              <div>
                <div className="text-lg font-bold text-body-dark mb-1">02</div>
                <div className="text-sm font-semibold text-body-dark mb-1.5">
                  Acoustic Accuracy
                </div>
                <div className="text-xs text-muted-label leading-relaxed">
                  Calibrated studio enunciations covering high-friction phonemic
                  transitions.
                </div>
              </div>

              <div>
                <div className="text-lg font-bold text-body-dark mb-1">03</div>
                <div className="text-sm font-semibold text-body-dark mb-1.5">
                  Systematic Retention
                </div>
                <div className="text-xs text-muted-label leading-relaxed">
                  Targeted spaced repetition rooted in active phoneme
                  reconstruction.
                </div>
              </div>
            </div>
          </div>

          {/* Phoneme Sample Banner */}
          <div className="border border-plum/20 rounded-2xl p-5 flex items-center justify-between bg-white shadow-xs">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={playPhonemeSample}
                title="Play Phoneme Sample"
                className="w-12 h-12 rounded-xl bg-plum hover:bg-plum-hover text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95"
              >
                <HiVolumeUp
                  className={`w-6 h-6 ${playingAudio ? "animate-pulse" : ""}`}
                />
              </button>
              <div>
                <div className="text-sm sm:text-base font-bold text-body-dark">
                  Phoneme Sample:{" "}
                  <span className="font-mono text-plum">/ɪmˈlɑːʔ/</span>
                </div>
                <div className="text-xs text-muted-label mt-0.5">
                  Isolated articulation • Standard Academic
                </div>
              </div>
            </div>

            {/* Audio Wave Graphic Simulation */}
            <div className="flex items-center space-x-1.5 pr-2">
              <span
                className={`w-1 rounded-full bg-plum transition-all ${playingAudio ? "h-7 animate-pulse" : "h-3"}`}
              ></span>
              <span
                className={`w-1 rounded-full bg-plum transition-all ${playingAudio ? "h-9" : "h-6"}`}
              ></span>
              <span
                className={`w-1 rounded-full bg-plum transition-all ${playingAudio ? "h-5" : "h-2"}`}
              ></span>
              <span
                className={`w-1 rounded-full bg-plum transition-all ${playingAudio ? "h-8" : "h-5"}`}
              ></span>
              <span
                className={`w-1 rounded-full bg-plum transition-all ${playingAudio ? "h-6" : "h-3"}`}
              ></span>
              <span
                className={`w-1 rounded-full bg-plum transition-all ${playingAudio ? "h-3" : "h-1.5"}`}
              ></span>
            </div>
          </div>
        </div>

        {/* Right Column: Access Workspace Card */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="border border-plum/20 rounded-2xl p-4 sm:p-9 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-body-dark tracking-tight">
                Access Workspace
              </h2>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded border border-plum/25 text-plum font-semibold">
                v2.4
              </span>
            </div>

            <p className="text-sm text-muted-label mb-7 leading-relaxed">
              Authenticate using your registered academic credentials.
            </p>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl border border-plum/30 bg-plum/5 text-xs sm:text-sm text-plum font-medium leading-relaxed">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-body-dark mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 text-sm sm:text-base rounded-xl border border-plum/25 focus:outline-none focus:border-plum focus:ring-1 focus:ring-plum placeholder:text-gray-400 text-body-dark transition"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs sm:text-sm font-semibold text-body-dark">
                    10-Digit ID
                  </label>
                  <span className="text-xs text-muted-label font-medium">
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
                  className="w-full px-4 py-3.5 text-sm sm:text-base font-mono tracking-widest text-center rounded-xl border border-plum/25 focus:outline-none focus:border-plum focus:ring-1 focus:ring-plum placeholder:text-gray-400 text-body-dark transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-5 rounded-xl bg-plum hover:bg-plum-hover text-white font-medium text-sm sm:text-base flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <span>
                  {submitting ? "Authenticating..." : "Enter Workspace"}
                </span>
                <HiArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* Accordion: Where to find ID? */}
            <div className="mt-7 pt-5 border-t border-plum/15">
              <button
                type="button"
                onClick={() => setShowIdAccordion(!showIdAccordion)}
                className="w-full flex items-center justify-between text-xs sm:text-sm text-muted-label hover:text-body-dark transition text-left cursor-pointer"
              >
                <span>Where to find ID? Request administrator access</span>
                <HiChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showIdAccordion ? "rotate-180" : ""}`}
                />
              </button>

              {showIdAccordion && (
                <div className="mt-3.5 p-4 rounded-xl border border-plum/20 bg-plum/5 text-xs sm:text-sm text-muted-label space-y-2.5 leading-relaxed">
                  <p>
                    10-digit IDs are issued directly upon academic enrollment.
                    If you don't have one, please contact your supervisor or
                    course administrator.
                  </p>
                  <div className="pt-2.5 border-t border-plum/15 font-mono text-xs text-body-dark space-y-1">
                    <div>
                      Demo Admin:{" "}
                      <span className="text-plum font-bold">Admin User</span>
                    </div>
                    <div>
                      Demo Key:{" "}
                      <span className="text-plum font-bold">1234567890</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Under Card Status Indicators */}
          <div className="mt-4 px-2 flex items-center justify-between text-xs text-muted-label">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-plum"></span>
              <span>Dictation Node: Online (ASR 44.1kHz)</span>
            </div>
            <span className="font-mono text-xs">Secure TLS 1.3</span>
          </div>
        </div>
      </main>
    </div>
  );
}
