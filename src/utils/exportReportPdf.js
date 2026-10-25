/**
 * Utility to generate and print a clean, executive PDF report for the Access & Audit Log
 */
export function exportAuditReportPDF({ users, logs, stats }) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups in your browser to download/print the PDF report.");
    return;
  }

  const generatedDate = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  const usersRowsHtml = (users || [])
    .map(
      (u, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-weight: 600;">${idx + 1}</td>
        <td style="padding: 10px; font-weight: 700; color: #1f2937;">${u.name}</td>
        <td style="padding: 10px; font-family: monospace; font-size: 13px; color: #6D4E56; font-weight: 700;">${u.accessId}</td>
        <td style="padding: 10px; text-transform: capitalize;">${u.role}</td>
        <td style="padding: 10px;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; ${
            u.status === "approved"
              ? "background: #d1fae5; color: #065f46;"
              : u.status === "rejected"
              ? "background: #fee2e2; color: #991b1b;"
              : "background: #fef3c7; color: #92400e;"
          }">
            ${u.status.toUpperCase()}
          </span>
        </td>
        <td style="padding: 10px;">
          <span style="font-weight: 600; color: ${u.isOnline ? "#059669" : "#6b7280"};">
            ${u.isOnline ? "● ACTIVE NOW" : u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : "Never"}
          </span>
        </td>
        <td style="padding: 10px; font-size: 12px; color: #6b7280;">${new Date(u.createdAt).toLocaleDateString()}</td>
      </tr>
    `,
    )
    .join("");

  const logsRowsHtml = (logs || [])
    .slice(0, 50)
    .map(
      (l) => `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 8px; font-size: 12px; font-weight: 700; color: #6D4E56;">${l.action}</td>
        <td style="padding: 8px; font-size: 12px; font-weight: 600;">${l.userName} (${l.accessId || "—"})</td>
        <td style="padding: 8px; font-size: 12px; color: #374151;">${l.details || "—"}</td>
        <td style="padding: 8px; font-size: 11px; color: #9ca3af; font-family: monospace;">${new Date(l.timestamp).toLocaleString()}</td>
      </tr>
    `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Imlaa Access & Activity Audit Report</title>
        <style>
          @page { size: A4 portrait; margin: 18mm 15mm; }
          body {
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #1f2937;
            margin: 0;
            padding: 20px;
            background: #ffffff;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #6D4E56;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .title { font-size: 24px; font-weight: 900; color: #6D4E56; margin: 0; }
          .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 25px;
          }
          .stat-box {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            background: #f9fafb;
          }
          .stat-value { font-size: 20px; font-weight: 800; color: #6D4E56; }
          .stat-label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #f3f4f6; text-align: left; padding: 10px; font-weight: 700; color: #374151; font-size: 11px; text-transform: uppercase; }
          .section-heading {
            font-size: 16px;
            font-weight: 800;
            color: #1f2937;
            margin-top: 25px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: baseline;
          }
          .footer {
            margin-top: 35px;
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #9ca3af;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Imlaa.</h1>
            <div class="subtitle">Access Directory & Hardware Device Audit Report</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #6b7280;">
            <div>Generated: <strong>${generatedDate}</strong></div>
            <div>Classification: <strong>Administrator Confidential</strong></div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value">${stats.totalRegistered || 0}</div>
            <div class="stat-label">Total Registered</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" style="color: #059669;">${stats.activeNowCount || 0}</div>
            <div class="stat-label">Active Right Now</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${stats.approvedCount || 0}</div>
            <div class="stat-label">Approved Access</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${logs ? logs.length : 0}</div>
            <div class="stat-label">Audit Log Events</div>
          </div>
        </div>

        <div class="section-heading">
          <span>Candidate Access Directory (${users ? users.length : 0})</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Candidate Name</th>
              <th>Access ID</th>
              <th>Role</th>
              <th>Status</th>
              <th>Activity</th>
              <th>Issued</th>
            </tr>
          </thead>
          <tbody>
            ${usersRowsHtml}
          </tbody>
        </table>

        <div class="section-heading" style="margin-top: 30px;">
          <span>Recent Activity & Audit Trail (Latest 50 Entries)</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>User & ID</th>
              <th>Event Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${logsRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <span>Imlaa Linguistic Mastery Platform — Device-Locked Orthography Workspace</span>
          <span>Page 1 of 1 • System Report</span>
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
