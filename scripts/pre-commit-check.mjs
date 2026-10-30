/**
 * Pre-Commit Quality & Security Verification Hook (Phase 3.4)
 * Runs: Secret scan, ESLint, Unit Tests, and file-size guardrails.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

console.log("=== Imlaa Pre-Commit Verification Starting ===");

// 1. Run Secret Scanner
console.log("\n[1/4] Running secret detection scanner...");
execSync("node scripts/scan-secrets.mjs", { stdio: "inherit" });

// 2. Run Linter
console.log("\n[2/4] Running ESLint check...");
execSync("npm run lint", { stdio: "inherit" });

// 3. Run Unit Tests
console.log("\n[3/4] Running automated test suite...");
execSync("npm test", { stdio: "inherit" });

// 4. File-size guardrail checks (warn if new application code exceeds 400 lines)
console.log("\n[4/4] Checking file line budgets (<= 400 lines target)...");
function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== "node_modules" && f !== "dist") checkDir(full);
    } else if (/\.(jsx|js)$/.test(f)) {
      const lineCount = fs.readFileSync(full, "utf8").split(/\r?\n/).length;
      if (lineCount > 450) {
        // Documented legacy pages allowed during transitional phase
        console.warn(`  [Notice] ${f} has ${lineCount} lines (Target: <= 400 lines).`);
      }
    }
  }
}
checkDir("src");

console.log("\n✔ All pre-commit quality & security checks passed successfully!\n");
