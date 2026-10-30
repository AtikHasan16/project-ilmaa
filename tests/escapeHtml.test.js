import assert from "node:assert/strict";
import test from "node:test";
import { escapeHtml } from "../src/utils/escapeHtml.js";
import { exportAuditReportPDF } from "../src/utils/exportReportPdf.js";

test("escapes HTML special characters", () => {
  assert.equal(
    escapeHtml(`<script>alert("x")</script> & 'text'`),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;text&#39;",
  );
});

test("converts nullish values to empty text", () => {
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
});

test("escapes untrusted audit fields before writing print HTML", () => {
  let writtenHtml = "";
  globalThis.window = {
    open: () => ({
      document: {
        open() {},
        write(html) {
          writtenHtml = html;
        },
        close() {},
      },
    }),
  };

  try {
    exportAuditReportPDF({
      users: [{
        name: '<img src=x onerror="alert(1)">',
        id: "1b671a64-40d5-491e-99b0-da01ff1f3341",
        role: "general",
        status: "approved",
        createdAt: "2026-01-01",
      }],
      logs: [{
        action: "<svg onload=alert(3)>",
        userName: "Candidate",
        userId: "1b671a64-40d5-491e-99b0-da01ff1f3341",
        details: "<script>alert(2)</script> <iframe src=javascript:alert(4)>",
        timestamp: "2026-01-01",
      }],
      stats: {},
    });
  } finally {
    delete globalThis.window;
  }

  assert.ok(writtenHtml.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.ok(writtenHtml.includes("&lt;script&gt;alert(2)&lt;/script&gt;"));
  assert.ok(writtenHtml.includes("&lt;svg onload=alert(3)&gt;"));
  assert.ok(writtenHtml.includes("&lt;iframe src=javascript:alert(4)&gt;"));
  assert.equal(writtenHtml.includes("<img src=x onerror="), false);
  assert.equal(writtenHtml.includes("<script>alert(2)</script>"), false);
});
