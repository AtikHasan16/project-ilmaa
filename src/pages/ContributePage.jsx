import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import {
  HiBeaker,
  HiAcademicCap,
  HiArrowLeft,
  HiCheckCircle,
} from "react-icons/hi2";
import { showSuccessToast } from "../utils/sweetalert";

export default function ContributePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith("/workspace");
  const [participated, setParticipated] = useState({});

  const dummyStudies = [
    {
      id: "phonetics",
      title: "IELTS Listening Phoneme Contrast Study",
      focus: "Bengali L1 perception of English /θ/ vs /t/ and /f/ vs /pʰ/",
      time: "10 mins",
      status: "Open Pilot",
    },
    {
      id: "memory",
      title: "Spaced Repetition & AWL Lexical Retention",
      focus: "Recall latency and spaced rehearsal curve measurement",
      time: "5 mins/day",
      status: "Active Cohort",
    },
    {
      id: "syntax",
      title: "Clause Embedding in Task 2 Academic Essays",
      focus: "Subordinate clause transfer patterns in writing samples",
      time: "15 mins",
      status: "Recruiting",
    },
  ];

  const handleParticipate = (id, title) => {
    setParticipated((prev) => ({ ...prev, [id]: true }));
    showSuccessToast("Participation Registered", `Thank you for contributing to "${title}".`);
  };

  const researchContent = (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-10 animate-slide-up pb-12">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-plum/10 text-plum font-bold text-xs tracking-wide">
          <HiBeaker className="w-3.5 h-3.5 text-plum" />
          <span>Linguistic Research Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-body-dark tracking-tight">
          Research Participation & Experiments
        </h1>
        <p className="text-base text-muted-label">
          Participate in open applied linguistics studies or collaborate as an independent researcher.
        </p>
      </div>

      {/* Dummy Studies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {dummyStudies.map((study) => (
          <div
            key={study.id}
            className="imlaa-card p-5 border border-plum/20 bg-white flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-plum/10 text-plum border border-plum/15">
                {study.status}
              </span>
              <h2 className="font-bold text-base text-body-dark leading-snug">
                {study.title}
              </h2>
              <p className="text-xs text-muted-label leading-relaxed">
                {study.focus}
              </p>
            </div>

            <div className="pt-3 border-t border-plum/10 flex items-center justify-between">
              <span className="text-xs text-muted-label font-mono">
                {study.time}
              </span>

              {participated[study.id] ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                  <HiCheckCircle className="w-4 h-4" />
                  <span>Enrolled</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleParticipate(study.id, study.title)}
                  className="imlaa-btn-primary py-1.5 px-3 text-xs font-semibold cursor-pointer"
                >
                  Join Pilot
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Researcher Note Box */}
      <div className="imlaa-card p-6 border border-plum/20 bg-plum/5 text-center space-y-3 max-w-xl mx-auto">
        <div className="w-10 h-10 rounded-xl bg-plum/10 text-plum flex items-center justify-center mx-auto">
          <HiAcademicCap className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-body-dark">
          For Independent Researchers
        </h2>
        <p className="text-xs text-muted-label max-w-md mx-auto">
          If you are a student or researcher wanting to run an experiment or study Bengali L1 English acquisition, get in touch with our team.
        </p>
        <div className="pt-1">
          <Link to="/contact" className="imlaa-btn-secondary py-2 px-4 text-xs font-semibold inline-block">
            Submit Research Inquiry
          </Link>
        </div>
      </div>
    </div>
  );

  if (isWorkspace) {
    return researchContent;
  }

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
            <span>Research Contribution</span>
            <span className="w-2 h-2 rounded-full bg-plum inline-block"></span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full animate-slide-up">
        {researchContent}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-plum/15 py-5 text-center text-xs text-muted-label">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Imlaa IELTS Workspace • Linguistic Research</span>
          <Link to="/" className="hover:text-plum transition">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
