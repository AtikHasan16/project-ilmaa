import { Link } from "react-router";
import { HiArrowLeft, HiFlag, HiAcademicCap, HiUserGroup } from "react-icons/hi2";
import { FaLinkedin, FaGithub, FaXTwitter } from "react-icons/fa6";

const teamMembers = [
  {
    name: "Atik Hasan",
    designation: "Founder & Lead Architect",
    bio: "Full-stack engineer crafting high-performance learning software and AI integrations.",
    socials: {
      linkedin: "https://linkedin.com/in/atikhasan16",
      github: "https://github.com/AtikHasan16",
      twitter: "https://x.com",
    },
  },
  {
    name: "Academic Advisory Group",
    designation: "IELTS Curriculum Specialists",
    bio: "Senior IELTS instructors and phonetic linguists curating lexical items and orthographic rubrics.",
    socials: {
      linkedin: "https://linkedin.com",
      github: "https://github.com",
    },
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-plum/20 selection:text-plum">
      {/* Header */}
      <header className="border-b border-plum/15 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold transition text-base"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <div className="text-xl font-black text-plum tracking-tight">Imlaa</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full space-y-12">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-body-dark tracking-tight">
            About Imlaa
          </h1>
          <p className="text-lg text-muted-label max-w-2xl mx-auto">
            A focused orthographic and grammar training workspace engineered for academic IELTS preparation.
          </p>
        </div>

        {/* Section 1: Our Goal */}
        <div className="imlaa-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-3 text-plum">
            <div className="w-10 h-10 rounded-xl bg-plum/10 flex items-center justify-center">
              <HiFlag className="w-6 h-6 text-plum" />
            </div>
            <h2 className="text-2xl font-bold text-body-dark">Our Goal</h2>
          </div>
          <p className="text-base text-body-dark leading-relaxed">
            Imlaa eliminates visual crutches in vocabulary learning. By isolating pure phonemic listening and requiring active spelling recall, candidates form deep auditory-orthographic neural connections that prevent avoidable spelling errors in IELTS Academic listening and writing.
          </p>
        </div>

        {/* Section 2: Who Will Benefit */}
        <div className="imlaa-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-3 text-plum">
            <div className="w-10 h-10 rounded-xl bg-plum/10 flex items-center justify-center">
              <HiAcademicCap className="w-6 h-6 text-plum" />
            </div>
            <h2 className="text-2xl font-bold text-body-dark">Who Will Benefit</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 space-y-1.5">
              <div className="font-bold text-body-dark text-base">IELTS Candidates</div>
              <div className="text-sm text-muted-label leading-relaxed">
                Aiming for Band 7.5+ who lose marks on double consonants and subtle phonemic shifts.
              </div>
            </div>
            <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 space-y-1.5">
              <div className="font-bold text-body-dark text-base">Academic Writers</div>
              <div className="text-sm text-muted-label leading-relaxed">
                Students mastering formal academic word lists, parallelism, and grammatical coherence.
              </div>
            </div>
            <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 space-y-1.5">
              <div className="font-bold text-body-dark text-base">Educators & Trainers</div>
              <div className="text-sm text-muted-label leading-relaxed">
                Instructors seeking hardware-bound, distraction-free assessment environments for candidates.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: About The Team */}
        <div className="imlaa-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 text-plum">
            <div className="w-10 h-10 rounded-xl bg-plum/10 flex items-center justify-center">
              <HiUserGroup className="w-6 h-6 text-plum" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-body-dark">About the Team</h2>
              <p className="text-sm text-muted-label">The minds designing and curating the Imlaa workspace</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="p-5 rounded-xl border border-plum/20 bg-white shadow-xs space-y-3 flex flex-col justify-between hover:border-plum/40 transition"
              >
                <div className="space-y-1.5">
                  <div className="text-lg font-bold text-body-dark">{member.name}</div>
                  <div className="text-sm font-semibold text-plum">{member.designation}</div>
                  <p className="text-sm text-muted-label leading-relaxed pt-1">{member.bio}</p>
                </div>

                <div className="flex items-center space-x-3 pt-3 border-t border-plum/10 text-plum">
                  {member.socials.linkedin && (
                    <a
                      href={member.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="LinkedIn"
                      className="p-1.5 rounded-lg hover:bg-plum/10 transition"
                    >
                      <FaLinkedin className="w-4 h-4" />
                    </a>
                  )}
                  {member.socials.github && (
                    <a
                      href={member.socials.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="GitHub"
                      className="p-1.5 rounded-lg hover:bg-plum/10 transition"
                    >
                      <FaGithub className="w-4 h-4" />
                    </a>
                  )}
                  {member.socials.twitter && (
                    <a
                      href={member.socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="X / Twitter"
                      className="p-1.5 rounded-lg hover:bg-plum/10 transition"
                    >
                      <FaXTwitter className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-plum/15 py-8 text-center text-sm text-muted-label">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Imlaa IELTS Workspace. All rights reserved.</div>
          <div className="flex items-center space-x-6">
            <Link to="/" className="hover:text-plum transition">Home</Link>
            <Link to="/contact" className="hover:text-plum transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
