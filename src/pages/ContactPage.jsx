import { useState } from "react";
import { Link } from "react-router";
import emailjs from "@emailjs/browser";
import { HiArrowLeft, HiPaperAirplane, HiCheckCircle } from "react-icons/hi2";
import { showErrorAlert, showSuccessToast } from "../utils/sweetalert";

const TARGET_GMAIL = "akhasannaeem@gmail.com";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accessId, setAccessId] = useState("");
  const [category, setCategory] = useState("id-request");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Anti-spam bot honeypot
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categoryLabels = {
    "id-request": "Request a New 10-Digit Access ID",
    "device-reset": "Reset Bound Browser / Device",
    "access-pending": "Inquiry about Pending Access Request",
    "vocab-grammar": "Feedback on Vocabulary or Grammar Question",
    "technical": "Technical Support or Bug Report",
    "other": "Other General Inquiry",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Anti-Bot Honeypot Trap: Real users never fill this invisible field
    if (honeypot.trim()) {
      console.warn("Spam bot submission caught by honeypot");
      setSubmitted(true);
      return;
    }

    // 2. Anti-Raid Rate Limiter: Minimum 60s cooldown between submissions
    const lastSubmitTime = localStorage.getItem("imlaa_contact_last_ts");
    if (lastSubmitTime && Date.now() - Number(lastSubmitTime) < 60000) {
      const waitSeconds = Math.ceil((60000 - (Date.now() - Number(lastSubmitTime))) / 1000);
      showErrorAlert(
        "Anti-Spam Cooldown",
        `Please wait ${waitSeconds} seconds before submitting another inquiry to prevent spamming.`
      );
      return;
    }

    if (!name.trim()) {
      showErrorAlert("Missing Name", "Please provide your full name so we can address your inquiry.");
      return;
    }

    if (!message.trim()) {
      showErrorAlert("Missing Message", "Please write a brief description of your request.");
      return;
    }

    setSending(true);

    const serviceId = import.meta.env?.VITE_EMAILJS_SERVICE_ID || "service_ilmaa";
    const templateId = import.meta.env?.VITE_EMAILJS_TEMPLATE_ID || "template_ilmaa";
    const publicKey = import.meta.env?.VITE_EMAILJS_PUBLIC_KEY;

    // Structured template parameters sent to EmailJS
    const templateParams = {
      to_email: TARGET_GMAIL,
      recipient_name: "Atik Hasan Naeem",
      from_name: name.trim(),
      from_email: email.trim() || "Not provided (Anonymous)",
      access_id: accessId.trim() || "Not provided",
      category_key: category,
      category_label: categoryLabels[category] || category,
      message: message.trim(),
      submission_time: new Date().toLocaleString(),
      client_platform: navigator.userAgent,
    };

    try {
      if (publicKey) {
        // Direct EmailJS send via API
        await emailjs.send(serviceId, templateId, templateParams, publicKey);
        localStorage.setItem("imlaa_contact_last_ts", Date.now().toString());
        showSuccessToast("Message Delivered", `Your inquiry was delivered directly to ${TARGET_GMAIL}.`);
        setSubmitted(true);
      } else {
        // Fallback: If EmailJS API keys aren't set yet, open structured pre-formatted mail client
        const subject = encodeURIComponent(`[Imlaa Support: ${categoryLabels[category]}] from ${name.trim()}`);
        const formattedBody = encodeURIComponent(
          `Recipient: ${TARGET_GMAIL}\n` +
          `----------------------------------------\n` +
          `Candidate Name : ${name.trim()}\n` +
          `Candidate Email: ${email.trim() || "Not provided"}\n` +
          `Access ID      : ${accessId.trim() || "Not provided"}\n` +
          `Reason/Category: ${categoryLabels[category]}\n` +
          `Timestamp      : ${new Date().toLocaleString()}\n` +
          `----------------------------------------\n\n` +
          `Message Details:\n${message.trim()}\n`
        );
        localStorage.setItem("imlaa_contact_last_ts", Date.now().toString());
        window.location.href = `mailto:${TARGET_GMAIL}?subject=${subject}&body=${formattedBody}`;
        showSuccessToast("Email Formatted", "Your email client was opened with your structured message.");
        setSubmitted(true);
      }
    } catch (err) {
      console.error("EmailJS dispatch failed:", err);
      // Seamless failover to direct mailto so message is never lost
      const subject = encodeURIComponent(`[Imlaa Support: ${categoryLabels[category]}] from ${name.trim()}`);
      const fallbackBody = encodeURIComponent(
        `Candidate Name : ${name.trim()}\n` +
        `Candidate Email: ${email.trim() || "Not provided"}\n` +
        `Access ID      : ${accessId.trim() || "Not provided"}\n` +
        `Inquiry Type   : ${categoryLabels[category]}\n\n` +
        `Message:\n${message.trim()}`
      );
      window.location.href = `mailto:${TARGET_GMAIL}?subject=${subject}&body=${fallbackBody}`;
      showSuccessToast("Dispatched via Email Client", `Connecting you directly to ${TARGET_GMAIL}.`);
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-body-dark tracking-tight">
            Contact Support & Access
          </h1>
          <p className="text-base sm:text-lg text-muted-label">
            Direct dispatch to administrator (<span className="text-plum font-semibold">{TARGET_GMAIL}</span>)
          </p>
        </div>

        <div className="imlaa-card p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-8 space-y-4 animate-slide-up">
              <HiCheckCircle className="w-14 h-14 text-emerald-600 mx-auto" />
              <h2 className="text-2xl font-bold text-body-dark">Inquiry Dispatched</h2>
              <p className="text-base text-muted-label max-w-md mx-auto">
                Your message has been sent to <span className="font-semibold text-body-dark">{TARGET_GMAIL}</span>. You will receive a response shortly.
              </p>
              <div className="pt-4 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage("");
                  }}
                  className="imlaa-btn-secondary py-2.5 px-5 text-base"
                >
                  Send Another Inquiry
                </button>
                <Link to="/" className="imlaa-btn-primary py-2.5 px-5 text-base">
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Anti-Bot Invisible Honeypot (Item 9) */}
              <input
                type="text"
                name="website_shield"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
                style={{ display: "none", position: "absolute", left: "-9999px" }}
              />

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-body-dark uppercase tracking-wider mb-2">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Atik Hasan"
                  className="imlaa-input w-full py-3 px-4 text-base"
                />
              </div>

              {/* Email (Optional for reply) */}
              <div>
                <label className="block text-sm font-bold text-body-dark uppercase tracking-wider mb-2">
                  Your Email Address <span className="text-xs text-muted-label font-normal">(for admin reply)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@example.com"
                  className="imlaa-input w-full py-3 px-4 text-base"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-bold text-body-dark uppercase tracking-wider mb-2">
                  Reason for Inquiry <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="imlaa-input w-full py-3 px-4 text-base bg-white"
                >
                  <option value="id-request">Request a New 10-Digit Access ID</option>
                  <option value="device-reset">Reset Bound Browser / Device</option>
                  <option value="access-pending">Inquiry about Pending Access Request</option>
                  <option value="vocab-grammar">Feedback on Vocabulary or Grammar Question</option>
                  <option value="technical">Technical Support or Bug Report</option>
                  <option value="other">Other General Inquiry</option>
                </select>
              </div>

              {/* Access ID (Optional) */}
              <div>
                <label className="block text-sm font-bold text-body-dark uppercase tracking-wider mb-2">
                  Access ID <span className="text-xs text-muted-label font-normal">(Optional, if already assigned)</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={accessId}
                  onChange={(e) => setAccessId(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit numeric ID"
                  className="imlaa-input w-full py-3 px-4 font-mono text-base"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-bold text-body-dark uppercase tracking-wider mb-2">
                  Message Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your request or problem with as much context as possible..."
                  className="imlaa-input w-full py-3 px-4 text-base resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="imlaa-btn-primary w-full py-3.5 text-base sm:text-lg flex items-center justify-center space-x-2"
              >
                <span>{sending ? "Dispatching..." : "Send Message to Administrator"}</span>
                <HiPaperAirplane className={`w-5 h-5 rotate-45 ${sending ? "animate-pulse" : ""}`} />
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-plum/15 py-8 text-center text-sm text-muted-label">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Imlaa IELTS Workspace. All rights reserved.</div>
          <div className="flex items-center space-x-6">
            <Link to="/" className="hover:text-plum transition">Home</Link>
            <Link to="/about" className="hover:text-plum transition">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
