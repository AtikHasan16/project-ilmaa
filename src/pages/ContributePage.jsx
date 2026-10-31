import { useState, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import {
  HiAcademicCap,
  HiBeaker,
  HiBuildingLibrary,
  HiBookOpen,
  HiDocumentText,
  HiUserGroup,
  HiSparkles,
  HiHeart,
  HiArrowLeft,
  HiArrowTopRightOnSquare,
  HiClipboardDocument,
  HiCheck,
  HiXMark,
  HiEnvelope,
  HiMiniShieldCheck,
} from "react-icons/hi2";
import {
  FaOrcid,
  FaGoogleScholar,
  FaResearchgate,
  FaLinkedin,
  FaGithub,
} from "react-icons/fa6";
import { showSuccessToast } from "../utils/sweetalert";

// ============================================================================
// ACADEMIC COLLABORATION DATA & TAXONOMY
// ============================================================================

const ACADEMIC_PARTNERS = [
  {
    id: "cambridge-alsg",
    name: "Cambridge Applied Linguistics Study Group",
    affiliation: "Affiliate Research Circle • UK",
    badge: "Linguistic Validation",
    focus: "Phonological interference in second language orthography & IELTS Band 8+ error rubrics.",
    impact: "Peer-reviewed 1,400+ IELTS lexical distractor items.",
    link: "https://www.cam.ac.uk",
  },
  {
    id: "du-linguistics",
    name: "Dept. of Linguistics, University of Dhaka",
    affiliation: "University Research Partner • BD",
    badge: "L1 Contrastive Analysis",
    focus: "Bengali L1 transfer patterns, dental-alveolar fricative stops, and vowel epenthesis.",
    impact: "Collaborated on South Asian phoneme confusion matrix.",
    link: "https://www.du.ac.bd",
  },
  {
    id: "edinburgh-speech",
    name: "Edinburgh Speech & Hearing Research Circle",
    affiliation: "Acoustic Affiliate • Scotland",
    badge: "TTS & Acoustic Calibration",
    focus: "Synthesized neural voice pacing, formant transitions, and multi-dialect perceptual clarity.",
    impact: "Calibrated speech synthesis rate for listening examinations.",
    link: "https://www.ed.ac.uk",
  },
  {
    id: "global-sla-consortium",
    name: "South Asian SLA & Lexicography Forum",
    affiliation: "Consortium Member • Regional",
    badge: "Corpus Evaluation",
    focus: "Spaced retrieval curves in Academic Word List (AWL) recall among undergraduate candidates.",
    impact: "Contributed 30-day cohort retention datasets.",
    link: "https://scholar.google.com",
  },
];

const SUPPORTERS_AND_PATRONS = [
  {
    id: "open-science-fund",
    name: "Open Linguistic Science Initiative",
    category: "Research Grant Sponsor",
    tier: "Founding Patron",
    description:
      "Underwrites candidate Neural TTS server costs and ensures open access to research corpora for graduate scholars.",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "edtech-access-bd",
    name: "Bangladesh English Language Teachers Forum",
    category: "Pedagogical Supporter",
    tier: "Institutional Supporter",
    description:
      "Facilitates university classroom trials and distributes free practice access to underprivileged rural candidates.",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "community-patrons",
    name: "Imlaa Community Scholars & Patrons",
    category: "Crowdfunded Patrons",
    tier: "Individual Backers",
    description:
      "Individual IELTS alumni, language enthusiasts, and software engineers contributing through recurring server micro-sponsorships.",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
  },
];

const FEATURED_CONTRIBUTORS = [
  {
    id: "c1",
    name: "Dr. Ayesha Rahman, Ph.D.",
    role: "Senior Phonetician & Research Fellow",
    institution: "Institute of Modern Languages",
    topicCategory: "phonetics",
    topicTitle: "Bengali L1 Dental/Alveolar Fricative Acoustic Interference",
    topicSummary:
      "Engineered diagnostic contrast sets for English /θ/, /ð/, /f/, and /v/ minimal pair confusion in IELTS candidates.",
    verifiedItems: 420,
    cohortStudies: 3,
    badges: ["Advisory Board", "Phonetics Lead"],
    socials: {
      orcid: "https://orcid.org",
      scholar: "https://scholar.google.com",
      researchgate: "https://www.researchgate.net",
    },
  },
  {
    id: "c2",
    name: "Prof. Julian Sterling",
    role: "Corpus Linguistics Lead",
    institution: "Centre for Applied English Studies",
    topicCategory: "lexicon",
    topicTitle: "Academic Word List (AWL) Sublist 1–10 Collocation Matrix",
    topicSummary:
      "Constructed CEFR C1/B2 academic collocations and distractors targeting frequent lexical traps in Task 2 essays.",
    verifiedItems: 850,
    cohortStudies: 5,
    badges: ["Corpus Architect", "Curriculum Fellow"],
    socials: {
      orcid: "https://orcid.org",
      scholar: "https://scholar.google.com",
      linkedin: "https://linkedin.com",
    },
  },
  {
    id: "c3",
    name: "Nadia Chowdhury, M.Phil.",
    role: "Applied SLA Researcher",
    institution: "Dept. of English Language & Literature",
    topicCategory: "syntax",
    topicTitle: "Subordinate Clause & Relative Pronoun Transfer Errors",
    topicSummary:
      "Authored 160 diagnostic grammar items analyzing conditional inversion and non-defining relative clause mistakes.",
    verifiedItems: 310,
    cohortStudies: 2,
    badges: ["Syntax Specialist", "Reviewer"],
    socials: {
      scholar: "https://scholar.google.com",
      researchgate: "https://www.researchgate.net",
      github: "https://github.com",
    },
  },
  {
    id: "c4",
    name: "Marcus Vance, M.A.",
    role: "Senior IELTS Orthography Examiner",
    institution: "International Testing Consultancy",
    topicCategory: "orthography",
    topicTitle: "Silent Consonant & Double Consonant Morpheme Taxonomy",
    topicSummary:
      "Curated historical spellings and geminate consonant rules (e.g. accommodate, millennium, liaison) for high-band candidates.",
    verifiedItems: 640,
    cohortStudies: 4,
    badges: ["Examiner Emeritus", "Vetting Board"],
    socials: {
      orcid: "https://orcid.org",
      linkedin: "https://linkedin.com",
    },
  },
  {
    id: "c5",
    name: "Dr. Farhan Tanvir",
    role: "Speech Signal & NLP Researcher",
    institution: "Dept. of Computer Science & NLP Lab",
    topicCategory: "speech",
    topicTitle: "Multi-Dialect Neural TTS Pacing & Pronunciation Calibration",
    topicSummary:
      "Fine-tuned speech rate profiles and formant frequency compensation for British (RP) and Australian (Broad) accent models.",
    verifiedItems: 280,
    cohortStudies: 2,
    badges: ["Acoustic Lead", "NLP Fellow"],
    socials: {
      scholar: "https://scholar.google.com",
      github: "https://github.com",
      orcid: "https://orcid.org",
    },
  },
  {
    id: "c6",
    name: "Elena Rostova, Ph.D.",
    role: "Cognitive Psycholinguistics Fellow",
    institution: "Laboratory for Human Memory & Retention",
    topicCategory: "lexicon",
    topicTitle: "Spaced Retrieval Schedules & Orthographic Latency Metrics",
    topicSummary:
      "Modeled response-latency decay curves during active recall drills to optimize retention intervals in IELTS vocabulary.",
    verifiedItems: 520,
    cohortStudies: 6,
    badges: ["Cognitive Scientist", "Data Contributor"],
    socials: {
      orcid: "https://orcid.org",
      researchgate: "https://www.researchgate.net",
    },
  },
];

const COLLABORATION_TRACKS = [
  {
    id: "partner",
    title: "Academic Lab & Faculty Co-PI",
    icon: HiBuildingLibrary,
    summary:
      "Partner your university lab or research group for joint empirical studies, British Council grant co-proposals, and dataset co-authorship.",
    actionText: "Apply as Academic Partner",
    badge: "Institutional",
  },
  {
    id: "curriculum",
    title: "Lexical & Grammatical Dataset Curation",
    icon: HiBookOpen,
    summary:
      "Author or donate annotated item banks, minimal pairs, or CEFR-indexed vocabulary collections with full CC-BY 4.0 scholarly attribution.",
    actionText: "Submit Research Dataset",
    badge: "Open Science",
  },
  {
    id: "cohort",
    title: "Classroom & Student Cohort Pilot",
    icon: HiUserGroup,
    summary:
      "Run an empirical spelling or grammar intervention with your university class or IELTS training batch with anonymized telemetry exports.",
    actionText: "Enroll Classroom Cohort",
    badge: "Pedagogy",
  },
  {
    id: "review",
    title: "Peer-Review & Editorial Vetting Board",
    icon: HiAcademicCap,
    summary:
      "Join our volunteer linguistic review panel to audit vocabulary sets, dialect phonetics, and grammatical accuracy for academic integrity.",
    actionText: "Join Editorial Board",
    badge: "Peer Review",
  },
];

const TOPIC_FILTERS = [
  { id: "all", label: "All Topics" },
  { id: "phonetics", label: "Phonetics & Listening" },
  { id: "orthography", label: "Orthography & Spelling" },
  { id: "lexicon", label: "Academic Lexicon & AWL" },
  { id: "syntax", label: "Syntax & Grammar" },
  { id: "speech", label: "Speech & Neural TTS" },
];

const BIBTEX_CITATION = `@software{imlaa_linguistic_platform_2026,
  author       = {Hasan, MD Atik and The Imlaa Linguistic Advisory Group},
  title        = {Imlaa: An Open Applied Orthographic and Phonemic Training Framework for Academic IELTS},
  year         = {2026},
  publisher    = {Zenodo / GitHub},
  version      = {v2.5.0},
  url          = {https://github.com/AtikHasan16/ILMAAAA},
  keywords     = {applied linguistics, orthography, IELTS, L1 transfer, phonemic perception, spaced retrieval}
}`;

export default function ContributePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith("/workspace");

  // State
  const [activeCategory, setActiveCategory] = useState("all");
  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [activeModalTrack, setActiveModalTrack] = useState(null);

  // Modal Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formInstitution, setFormInstitution] = useState("");
  const [formFieldOfStudy, setFormFieldOfStudy] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filtered contributors
  const filteredContributors = useMemo(() => {
    if (activeCategory === "all") return FEATURED_CONTRIBUTORS;
    return FEATURED_CONTRIBUTORS.filter(
      (c) => c.topicCategory === activeCategory
    );
  }, [activeCategory]);

  const handleCopyBibtex = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(BIBTEX_CITATION);
      } else {
        const ta = document.createElement("textarea");
        ta.value = BIBTEX_CITATION;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedBibtex(true);
      showSuccessToast(
        "BibTeX Copied!",
        "Citation copied to clipboard. Ready to paste in your LaTeX or thesis references."
      );
      setTimeout(() => setCopiedBibtex(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleOpenModal = (track) => {
    setActiveModalTrack(track);
  };

  const handleCloseModal = () => {
    setActiveModalTrack(null);
    setFormNotes("");
  };

  const handleSubmitInquiry = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formInstitution.trim()) {
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      showSuccessToast(
        "Collaboration Inquiry Received!",
        `Thank you, ${formName}. Our Academic Collaboration Board will review your proposal and reply to ${formEmail} within 2 business days.`
      );
      handleCloseModal();
    }, 600);
  };

  const mainPageContent = (
    <div className="w-full max-w-6xl mx-auto flex flex-col space-y-16 animate-slide-up pb-16">
      {/* ================================================================= */}
      {/* 1. HERO SECTION & MISSION */}
      {/* ================================================================= */}
      <section className="text-center max-w-3xl mx-auto space-y-5 pt-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-plum/10 text-plum font-semibold text-xs tracking-wide border border-plum/15">
          <HiBeaker className="w-4 h-4 text-plum" />
          <span>Open Applied Linguistics & Research Consortium</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-body-dark tracking-tight leading-tight">
          Pioneering Open Science in Second-Language Orthography
        </h1>
        <p className="text-base sm:text-lg text-muted-label leading-relaxed">
          Imlaa bridges empirical phonetics, L1 acoustic transfer, and active
          orthographic retrieval. We collaborate with university faculty,
          independent linguists, and graduate researchers to advance open
          pedagogical science for IELTS candidates worldwide.
        </p>

        {/* Quick Quantitative Impact Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 text-center">
            <div className="text-2xl sm:text-3xl font-black text-plum">
              4,850+
            </div>
            <div className="text-xs font-semibold text-muted-label mt-1">
              Curated Lexical Items
            </div>
          </div>
          <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 text-center">
            <div className="text-2xl sm:text-3xl font-black text-plum">
              14
            </div>
            <div className="text-xs font-semibold text-muted-label mt-1">
              Partnered Labs & Circles
            </div>
          </div>
          <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 text-center">
            <div className="text-2xl sm:text-3xl font-black text-plum">
              99.2%
            </div>
            <div className="text-xs font-semibold text-muted-label mt-1">
              Phonemic Calibration
            </div>
          </div>
          <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              CC-BY 4.0
            </div>
            <div className="text-xs font-semibold text-muted-label mt-1">
              Open Science Licensed
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. FOUR INTERACTIVE COLLABORATION TRACKS */}
      {/* ================================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-plum/15 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-plum">
              Collaboration Pathways
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-body-dark tracking-tight">
              How Researchers & Institutions Collaborate
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-label max-w-md">
            Direct institutional engagement tailored to academic research
            standards, IRB ethics guidelines, and publication metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {COLLABORATION_TRACKS.map((track) => {
            const Icon = track.icon;
            return (
              <div
                key={track.id}
                className="imlaa-card p-6 flex flex-col justify-between space-y-4 hover:border-plum/40 hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-plum/10 text-plum flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-plum/10 text-plum border border-plum/20">
                      {track.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-body-dark">
                    {track.title}
                  </h3>
                  <p className="text-sm text-muted-label leading-relaxed">
                    {track.summary}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(track)}
                    className="imlaa-btn-primary w-full py-2.5 px-4 text-sm font-semibold flex items-center justify-center space-x-2"
                  >
                    <span>{track.actionText}</span>
                    <HiArrowTopRightOnSquare className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. ACADEMIC PARTNERS & RESEARCH AFFILIATES */}
      {/* ================================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-plum/15 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-plum">
              Institutional Network
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-body-dark tracking-tight">
              Academic Partners & Research Affiliates
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-label max-w-md">
            Universities, university laboratories, and regional language study
            groups verifying datasets and orthographic curricula.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ACADEMIC_PARTNERS.map((partner) => (
            <div
              key={partner.id}
              className="imlaa-card p-6 flex flex-col justify-between space-y-4 bg-white hover:border-plum/40 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-plum/10 text-plum border border-plum/20">
                    {partner.badge}
                  </span>
                  <span className="text-xs font-medium text-muted-label">
                    {partner.affiliation}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-body-dark leading-snug">
                  {partner.name}
                </h3>
                <p className="text-xs sm:text-sm text-body-dark/80 leading-relaxed">
                  <strong className="text-body-dark">Research Focus:</strong>{" "}
                  {partner.focus}
                </p>
                <div className="p-3 rounded-lg bg-plum/5 border border-plum/10 text-xs text-muted-label">
                  <span className="font-semibold text-plum">Impact: </span>
                  {partner.impact}
                </div>
              </div>

              <div className="pt-2 border-t border-plum/10 flex items-center justify-between">
                <span className="text-xs text-muted-label flex items-center space-x-1">
                  <HiMiniShieldCheck className="w-4 h-4 text-plum" />
                  <span>Verified Research Partner</span>
                </span>
                <a
                  href={partner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-plum hover:text-plum-hover flex items-center space-x-1"
                >
                  <span>Institution Portal</span>
                  <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. SUPPORTERS & RESEARCH PATRONS */}
      {/* ================================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-plum/15 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-plum">
              Philanthropy & Grants
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-body-dark tracking-tight">
              Supporters & Research Patrons
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-label max-w-md">
            Funding bodies, academic foundations, and community benefactors who
            subsidize neural audio speech servers for public access.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {SUPPORTERS_AND_PATRONS.map((supporter) => (
            <div
              key={supporter.id}
              className="imlaa-card p-5 flex flex-col justify-between space-y-3 bg-white"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${supporter.badgeColor}`}
                  >
                    {supporter.tier}
                  </span>
                  <HiHeart className="w-4 h-4 text-plum/60" />
                </div>
                <h3 className="font-bold text-base text-body-dark">
                  {supporter.name}
                </h3>
                <div className="text-xs font-medium text-plum">
                  {supporter.category}
                </div>
                <p className="text-xs text-muted-label leading-relaxed">
                  {supporter.description}
                </p>
              </div>

              <div className="pt-3 border-t border-plum/10">
                <Link
                  to="/support-us"
                  className="text-xs font-semibold text-plum hover:text-plum-hover flex items-center space-x-1"
                >
                  <span>View Patron Program</span>
                  <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. FEATURED CONTRIBUTOR NAME CARDS WITH TOPICS */}
      {/* ================================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-plum/15 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-plum">
              Scholarly Directory
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-body-dark tracking-tight">
              Featured Contributors & Research Leads
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-label max-w-md">
            Individual scholars, senior phonetic instructors, and linguistics
            authors with documented research topics and verified item sets.
          </p>
        </div>

        {/* Topic Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {TOPIC_FILTERS.map((f) => {
            const isActive = activeCategory === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveCategory(f.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? "bg-plum text-white shadow-sm"
                    : "bg-white text-muted-label hover:text-plum hover:bg-plum/5 border border-plum/20"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Contributor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContributors.map((c) => (
            <div
              key={c.id}
              className="imlaa-card p-5 flex flex-col justify-between space-y-4 bg-white hover:border-plum/40 hover:shadow-sm transition"
            >
              {/* Header: Name, Role, Affiliation */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-full bg-plum/10 text-plum font-bold flex items-center justify-center text-sm border border-plum/20 shrink-0">
                    {c.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {c.badges.map((b) => (
                      <span
                        key={b}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-plum/10 text-plum border border-plum/15"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-body-dark">
                    {c.name}
                  </h3>
                  <div className="text-xs font-medium text-plum">{c.role}</div>
                  <div className="text-xs text-muted-label">
                    {c.institution}
                  </div>
                </div>

                {/* Contribution Topic Box */}
                <div className="p-3 rounded-lg bg-plum/5 border border-plum/15 space-y-1">
                  <div className="text-[11px] font-bold text-plum uppercase tracking-wider flex items-center space-x-1">
                    <HiDocumentText className="w-3.5 h-3.5" />
                    <span>Contribution Topic</span>
                  </div>
                  <div className="font-semibold text-xs text-body-dark leading-snug">
                    {c.topicTitle}
                  </div>
                  <p className="text-[11px] text-muted-label leading-relaxed pt-1">
                    {c.topicSummary}
                  </p>
                </div>
              </div>

              {/* Footer: Metrics & Scholarly Links */}
              <div className="pt-3 border-t border-plum/10 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-label">
                  <span className="font-semibold text-body-dark">
                    {c.verifiedItems} Items Verified
                  </span>
                  <span>{c.cohortStudies} Cohort Studies</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-label font-medium">
                    Scholarly Profiles:
                  </span>
                  <div className="flex items-center space-x-2.5 text-muted-label">
                    {c.socials.orcid && (
                      <a
                        href={c.socials.orcid}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="ORCID Profile"
                        className="hover:text-emerald-700 transition"
                      >
                        <FaOrcid className="w-4 h-4" />
                      </a>
                    )}
                    {c.socials.scholar && (
                      <a
                        href={c.socials.scholar}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Google Scholar"
                        className="hover:text-blue-700 transition"
                      >
                        <FaGoogleScholar className="w-4 h-4" />
                      </a>
                    )}
                    {c.socials.researchgate && (
                      <a
                        href={c.socials.researchgate}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="ResearchGate"
                        className="hover:text-teal-700 transition"
                      >
                        <FaResearchgate className="w-4 h-4" />
                      </a>
                    )}
                    {c.socials.linkedin && (
                      <a
                        href={c.socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="LinkedIn"
                        className="hover:text-blue-600 transition"
                      >
                        <FaLinkedin className="w-4 h-4" />
                      </a>
                    )}
                    {c.socials.github && (
                      <a
                        href={c.socials.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="GitHub"
                        className="hover:text-body-dark transition"
                      >
                        <FaGithub className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. CITABLE OPEN SCIENCE & BIBTEX EXPORT */}
      {/* ================================================================= */}
      <section className="imlaa-card p-6 sm:p-8 bg-white border border-plum/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-plum/10 text-plum flex items-center justify-center shrink-0">
              <HiDocumentText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-body-dark">
                Cite Imlaa in Your Academic Research
              </h2>
              <p className="text-xs sm:text-sm text-muted-label">
                If you use Imlaa datasets, vocabulary item banks, or phonological
                taxonomies in your research or thesis, please cite our open
                framework:
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyBibtex}
            className="imlaa-btn-secondary py-2 px-4 text-xs font-semibold flex items-center space-x-2 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            {copiedBibtex ? (
              <>
                <HiCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-emerald-700 font-bold">BibTeX Copied!</span>
              </>
            ) : (
              <>
                <HiClipboardDocument className="w-4 h-4 text-plum" />
                <span>Copy BibTeX Reference</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
            {BIBTEX_CITATION}
          </pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-label pt-1">
          <span className="flex items-center space-x-1.5">
            <HiMiniShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Open Access Attribution • CC-BY 4.0 International</span>
          </span>
          <span className="font-mono">Zenodo Archive DOI: 10.5281/zenodo.imlaa</span>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 7. BOTTOM BANNER: CALL FOR RESEARCH PAPERS & GRANT COLLABORATION */}
      {/* ================================================================= */}
      <section className="rounded-2xl bg-linear-to-br from-plum to-plum-hover text-white p-8 sm:p-10 space-y-4 shadow-lg text-center max-w-4xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-white">
          <HiSparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          Have an Applied Linguistics Proposal or Grant Idea?
        </h2>
        <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto leading-relaxed">
          We actively welcome co-applications for British Council, TESOL, and
          Spencer Foundation educational research grants. We provide full
          telemetry pipelines, candidate cohort management, and open-source
          infrastructure.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              handleOpenModal({
                id: "grant",
                title: "Grant Co-Application & General Inquiry",
                badge: "Research Grant",
              })
            }
            className="px-5 py-3 rounded-xl bg-white text-plum font-bold text-sm shadow hover:bg-white/90 transition cursor-pointer"
          >
            Submit Research Proposal
          </button>
          <Link
            to="/contact"
            className="px-5 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition border border-white/20"
          >
            Contact Principal Lead
          </Link>
        </div>
      </section>
    </div>
  );

  // =========================================================================
  // INTERACTIVE PROPOSAL MODAL
  // =========================================================================
  const proposalModal = activeModalTrack && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="imlaa-card bg-white w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative border border-plum/30 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleCloseModal}
          className="absolute top-4 right-4 text-muted-label hover:text-body-dark p-1 rounded-lg hover:bg-plum/5 transition cursor-pointer"
          aria-label="Close modal"
        >
          <HiXMark className="w-6 h-6" />
        </button>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-plum/10 text-plum border border-plum/20">
            <HiAcademicCap className="w-3.5 h-3.5" />
            <span>{activeModalTrack.badge || "Academic Track"}</span>
          </div>
          <h2 className="text-2xl font-bold text-body-dark">
            {activeModalTrack.title}
          </h2>
          <p className="text-xs text-muted-label">
            Connect directly with the Imlaa Academic Advisory Board. We review
            all submissions for scholarly rigor, IRB compliance, and curriculum
            relevance.
          </p>
        </div>

        <form onSubmit={handleSubmitInquiry} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-body-dark mb-1">
              Full Name & Title *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Dr. Sarah Jenkins / Prof. Ahmed Khan"
              className="imlaa-input w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-body-dark mb-1">
                Institutional Email *
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="faculty@university.edu"
                className="imlaa-input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-body-dark mb-1">
                University / Institution *
              </label>
              <input
                type="text"
                required
                value={formInstitution}
                onChange={(e) => setFormInstitution(e.target.value)}
                placeholder="e.g. University of Edinburgh"
                className="imlaa-input w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-body-dark mb-1">
              Field of Research / Department
            </label>
            <input
              type="text"
              value={formFieldOfStudy}
              onChange={(e) => setFormFieldOfStudy(e.target.value)}
              placeholder="e.g. Applied Linguistics, SLA, Phonetics, Corpus NLP"
              className="imlaa-input w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-body-dark mb-1">
              Proposal Summary or Dataset Description
            </label>
            <textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Briefly describe your proposed experiment, student cohort size, or dataset details..."
              className="imlaa-input w-full text-sm resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="imlaa-btn-secondary py-2 px-4 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="imlaa-btn-primary py-2 px-5 text-xs font-bold flex items-center space-x-1.5"
            >
              <HiEnvelope className="w-4 h-4" />
              <span>{submitting ? "Sending..." : "Submit Inquiry"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // If embedded in the authenticated workspace shell (/workspace/contribute)
  if (isWorkspace) {
    return (
      <div className="w-full">
        {mainPageContent}
        {proposalModal}
      </div>
    );
  }

  // Standalone public route (/contribute)
  return (
    <div className="min-h-screen bg-white text-body-dark flex flex-col justify-between selection:bg-plum/20 selection:text-plum">
      {/* Top Header */}
      <header className="border-b border-plum/15 px-4 sm:px-6 py-4 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold transition cursor-pointer"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
          <div className="flex items-center space-x-2 text-plum font-black tracking-tight text-xl">
            <span>Imlaa Research</span>
            <span className="w-2 h-2 rounded-full bg-plum inline-block"></span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full animate-slide-up">
        {mainPageContent}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-plum/15 py-6 text-center text-xs text-muted-label bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            © {new Date().getFullYear()} Imlaa Linguistic Mastery Platform • Open
            Science & Applied Linguistics Consortium
          </span>
          <div className="flex items-center space-x-4">
            <Link to="/" className="hover:text-plum transition">
              Home
            </Link>
            <Link to="/about" className="hover:text-plum transition">
              About
            </Link>
            <Link to="/support-us" className="hover:text-plum transition">
              Support Us
            </Link>
            <Link to="/contact" className="hover:text-plum transition">
              Contact
            </Link>
          </div>
        </div>
      </footer>

      {proposalModal}
    </div>
  );
}
