/**
 * Coverage ratchet: compares this run's coverage/coverage-summary.json
 * against the last successful `ci.yml` run on `main` and fails if lines,
 * statements, functions or branches drop by more than TOLERANCE_PP
 * percentage points. Without a baseline (first run ever, or the artifact
 * expired) it passes and says so — a fixed threshold on top of 0% coverage
 * would be a made-up number.
 *
 * On a pull_request event it also posts (or edits, via an HTML marker) a
 * sticky comment with the comparison table.
 *
 * Requires the `gh` CLI authenticated via GH_TOKEN, and runs after
 * `npm run test:coverage` in the same job. Run with:
 *   npx tsx scripts/coverage-ratchet.ts
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TOLERANCE_PP = 0.5;
const METRICS = ["lines", "statements", "functions", "branches"] as const;
type Metric = (typeof METRICS)[number];
type CoverageTotals = Record<Metric, { pct: number }>;
type CoverageSummary = { total: CoverageTotals };

const COMMENT_MARKER = "<!-- coverage-ratchet -->";

function gh(args: string[]): string {
  return execFileSync("gh", args, { encoding: "utf8" });
}

function readSummary(path: string): CoverageTotals {
  const parsed: CoverageSummary = JSON.parse(readFileSync(path, "utf8"));
  return parsed.total;
}

function downloadBaseline(): CoverageTotals | null {
  let runId: string | undefined;
  try {
    const runs: { databaseId: number }[] = JSON.parse(
      gh([
        "run",
        "list",
        "--workflow=ci.yml",
        "--branch=main",
        "--status=success",
        "--limit=1",
        "--json=databaseId",
      ])
    );
    runId = runs[0]?.databaseId?.toString();
  } catch (error) {
    console.warn("No se pudo listar corridas de main, se sigue sin baseline:", error);
    return null;
  }
  if (!runId) return null;

  const dir = mkdtempSync(join(tmpdir(), "coverage-baseline-"));
  try {
    gh(["run", "download", runId, "--name=coverage", "--dir", dir]);
  } catch (error) {
    // The baseline run predates this job, or its artifact already expired —
    // not a failure, just means there's nothing to compare against yet.
    console.warn(`No se encontró artifact de coverage en la corrida ${runId}:`, error);
    return null;
  }
  return readSummary(join(dir, "coverage-summary.json"));
}

function buildTable(current: CoverageTotals, baseline: CoverageTotals | null) {
  const rows = METRICS.map((metric) => {
    const currentPct = current[metric].pct;
    if (!baseline) return { metric, currentPct, baselinePct: null, delta: null, regressed: false };
    const baselinePct = baseline[metric].pct;
    const delta = currentPct - baselinePct;
    return { metric, currentPct, baselinePct, delta, regressed: delta < -TOLERANCE_PP };
  });
  const regressed = rows.some((r) => r.regressed);

  const header = baseline
    ? "| Métrica | main | esta rama | Δ |\n|---|---|---|---|"
    : "| Métrica | esta rama |\n|---|---|";
  const body = rows
    .map((r) => {
      const current = `${r.currentPct.toFixed(2)}%`;
      if (!baseline) return `| ${r.metric} | ${current} |`;
      const base = `${r.baselinePct!.toFixed(2)}%`;
      const sign = r.delta! >= 0 ? "+" : "";
      const flag = r.regressed ? " ⚠️" : "";
      return `| ${r.metric} | ${base} | ${current} | ${sign}${r.delta!.toFixed(2)}pp${flag} |`;
    })
    .join("\n");

  const summaryLine = baseline
    ? regressed
      ? `Coverage bajó más de ${TOLERANCE_PP}pp respecto a \`main\` en al menos una métrica.`
      : "Coverage se mantiene o mejora respecto a `main`."
    : "No hay baseline en `main` todavía (primera corrida) — se informa sin bloquear.";

  return { markdown: `${COMMENT_MARKER}\n### Coverage\n\n${summaryLine}\n\n${header}\n${body}\n`, regressed };
}

async function upsertPrComment(markdown: string) {
  if (process.env.GITHUB_EVENT_NAME !== "pull_request") return;
  const prNumber = process.env.PR_NUMBER;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!prNumber || !repo) return;

  const existing: { id: number; body: string }[] = JSON.parse(
    gh(["api", `repos/${repo}/issues/${prNumber}/comments`])
  );
  const match = existing.find((c) => c.body.includes(COMMENT_MARKER));

  const bodyFile = join(mkdtempSync(join(tmpdir(), "coverage-comment-")), "body.md");
  writeFileSync(bodyFile, markdown);

  if (match) {
    gh(["api", "-X", "PATCH", `repos/${repo}/issues/comments/${match.id}`, "-f", `body=@${bodyFile}`]);
  } else {
    gh(["api", "-X", "POST", `repos/${repo}/issues/${prNumber}/comments`, "-f", `body=@${bodyFile}`]);
  }
}

async function main() {
  const current = readSummary("coverage/coverage-summary.json");
  const baseline = downloadBaseline();
  const { markdown, regressed } = buildTable(current, baseline);

  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, markdown, { flag: "a" });
  }
  await upsertPrComment(markdown);

  if (regressed) {
    console.error(`Coverage bajó más de ${TOLERANCE_PP}pp respecto a main.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
