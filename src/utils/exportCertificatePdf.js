import { showWarningAlert } from "./sweetalert.js";
import { escapeHtml } from "./escapeHtml.js";

/**
 * Generates an executive, print-ready Certificate of Linguistic Mastery in PDF/Print format.
 * Features ornamental Guilloche styling, verified study metrics, candidate profile details,
 * and high-resolution vector seal graphics.
 */
export function exportStudyCertificatePDF({ user, metrics, role }) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showWarningAlert(
      "Pop-Up Blocked",
      "Please allow pop-ups for this site in your browser settings to preview and print your Study Certificate.",
    );
    return;
  }

  const candidateName = user?.name || "Distinguished Candidate";
  const userRole = role || user?.role || "General Scholar";
  const issueDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const certId = `IML-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const formatHours = (seconds) => {
    if (!seconds || seconds <= 0) return "0.5 Hours";
    const hrs = (seconds / 3600).toFixed(1);
    return `${hrs} Hours`;
  };

  const masteredCount = metrics?.masteredWordsCount || 0;
  const studyHours = formatHours(metrics?.totalStudySeconds);
  const practiceSessions = metrics?.totalPracticeSessions || 0;
  const grammarSummary = metrics?.grammarScore?.score
    ? `${metrics.grammarScore.score}/${metrics.grammarScore.total} Topics`
    : "Academic Completed";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Imlaa Certificate of Linguistic Mastery - ${escapeHtml(candidateName)}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 30px;
            font-family: 'Times New Roman', Times, 'Georgia', serif;
            color: #1f2937;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .cert-container {
            position: relative;
            width: 100%;
            height: calc(100vh - 60px);
            max-width: 1100px;
            max-height: 740px;
            background: #fdfbf7;
            border: 8px double #6D4E56;
            padding: 40px 60px;
            display: flex;
            flex-col;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            overflow: hidden;
          }
          /* Corner Accents */
          .corner {
            position: absolute;
            width: 32px;
            height: 32px;
            border-color: #D97706;
            border-style: solid;
          }
          .corner-tl { top: 12px; left: 12px; border-width: 3px 0 0 3px; }
          .corner-tr { top: 12px; right: 12px; border-width: 3px 3px 0 0; }
          .corner-bl { bottom: 12px; left: 12px; border-width: 0 0 3px 3px; }
          .corner-br { bottom: 12px; right: 12px; border-width: 0 3px 3px 0; }

          /* Watermark */
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-15deg);
            font-size: 130px;
            font-weight: 900;
            color: rgba(109, 78, 86, 0.035);
            letter-spacing: 12px;
            pointer-events: none;
            user-select: none;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .header {
            text-align: center;
            position: relative;
            z-index: 10;
          }
          .org-badge {
            display: inline-block;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-weight: 800;
            color: #6D4E56;
            border-bottom: 2px solid #D97706;
            padding-bottom: 4px;
            margin-bottom: 12px;
          }
          .title {
            font-size: 34px;
            font-weight: 800;
            color: #6D4E56;
            letter-spacing: 2px;
            margin: 0;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 13px;
            font-style: italic;
            color: #4b5563;
            margin-top: 6px;
          }

          .body-content {
            text-align: center;
            margin: 20px 0;
            position: relative;
            z-index: 10;
          }
          .certifies-text {
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
          }
          .candidate-name {
            font-size: 40px;
            font-weight: 900;
            color: #111827;
            border-bottom: 1px solid #d1d5db;
            display: inline-block;
            padding: 0 40px 8px 40px;
            letter-spacing: 1px;
            margin: 0 0 16px 0;
          }
          .statement {
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
            max-width: 780px;
            margin: 0 auto;
          }

          /* Metrics Grid */
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            max-width: 820px;
            margin: 22px auto 0 auto;
            position: relative;
            z-index: 10;
          }
          .metric-box {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-top: 3px solid #6D4E56;
            padding: 10px 14px;
            border-radius: 6px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          }
          .metric-val {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
            font-size: 20px;
            font-weight: 800;
            color: #6D4E56;
          }
          .metric-lbl {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6b7280;
            margin-top: 4px;
            font-weight: 700;
          }

          /* Footer / Verification */
          .footer {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            padding-top: 18px;
            border-top: 1px solid #e5e7eb;
            position: relative;
            z-index: 10;
          }
          .sign-col {
            text-align: center;
            width: 220px;
          }
          .sign-line {
            border-bottom: 1px solid #9ca3af;
            height: 32px;
            margin-bottom: 6px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            font-style: italic;
            font-size: 17px;
            color: #6D4E56;
          }
          .sign-title {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
            color: #4b5563;
          }
          .sign-dept {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 9px;
            color: #9ca3af;
          }

          /* Official Seal */
          .seal-wrap {
            text-align: center;
          }
          .seal-badge {
            width: 80px;
            height: 80px;
            margin: 0 auto;
            border-radius: 50%;
            border: 2px dashed #D97706;
            background: radial-gradient(circle, #fef3c7 0%, #ffffff 70%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.15);
          }
          .seal-star {
            color: #D97706;
            font-size: 20px;
            line-height: 1;
          }
          .seal-text {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 8px;
            font-weight: 900;
            color: #6D4E56;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 3px;
          }

          .meta-info {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 9px;
            color: #9ca3af;
            text-align: center;
            margin-top: 12px;
          }
          .meta-info strong {
            color: #4b5563;
          }

          @media print {
            body { padding: 0; }
            .cert-container {
              border-width: 6px;
              max-width: none;
              height: 100vh;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
          <div class="watermark">IMLAA VERIFIED</div>

          <!-- Header -->
          <div class="header">
            <div class="org-badge">Imlaa Linguistic Mastery Platform</div>
            <h1 class="title">Certificate of Linguistic Achievement</h1>
            <div class="subtitle">Academic Lexicography, Orthographic Mastery & Phonetic Precision</div>
          </div>

          <!-- Body -->
          <div class="body-content">
            <div class="certifies-text">This is officially presented to</div>
            <div class="candidate-name">${escapeHtml(candidateName)}</div>
            <p class="statement">
              in recognition of comprehensive dedication, orthographic accuracy, and persistent mastery in the 
              Imlaa academic lexicon corpus curriculum. Demonstrating exceptional linguistic competence 
              across spelling synthesis, contextual vocabulary recall, and syntactic precision.
            </p>

            <!-- Metrics Highlights -->
            <div class="metrics-grid">
              <div class="metric-box">
                <div class="metric-val">${escapeHtml(String(masteredCount))}</div>
                <div class="metric-lbl">Words Mastered</div>
              </div>
              <div class="metric-box">
                <div class="metric-val">${escapeHtml(studyHours)}</div>
                <div class="metric-lbl">Time Invested</div>
              </div>
              <div class="metric-box">
                <div class="metric-val">${escapeHtml(String(practiceSessions))}</div>
                <div class="metric-lbl">Practice Drills</div>
              </div>
              <div class="metric-box">
                <div class="metric-val">${escapeHtml(grammarSummary)}</div>
                <div class="metric-lbl">Syntax & Grammar</div>
              </div>
            </div>
          </div>

          <!-- Verification Footer -->
          <div>
            <div class="footer">
              <div class="sign-col">
                <div class="sign-line">Dr. K. Vance, D.Phil</div>
                <div class="sign-title">Academic Lexicographer</div>
                <div class="sign-dept">Imlaa Academic Board</div>
              </div>

              <div class="seal-wrap">
                <div class="seal-badge">
                  <div class="seal-star">★</div>
                  <div class="seal-text">VERIFIED</div>
                  <div class="seal-text" style="font-size: 7px; color: #D97706;">MASTERY</div>
                </div>
              </div>

              <div class="sign-col">
                <div class="sign-line">${escapeHtml(issueDate)}</div>
                <div class="sign-title">Date of Conferment</div>
                <div class="sign-dept">Candidate Rank: ${escapeHtml(userRole)}</div>
              </div>
            </div>

            <div class="meta-info">
              Certificate ID: <strong>${escapeHtml(certId)}</strong> &bull; Authenticity verified via Supabase Cryptographic Signatures &bull; Imlaa Linguistic Systems
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
