import type { benchmark_result } from "./types.js";

const BAR_WIDTH = 20;

const format_bar = (pass_rate: number) => {
  const filled_count = Math.round(pass_rate * BAR_WIDTH);
  const empty_count = BAR_WIDTH - filled_count;

  return `${"█".repeat(filled_count)}${"░".repeat(empty_count)}`;
};

const pass_rate_for_summary = (
  benchmark_name: string,
  model_name: string,
  summary: benchmark_result["models"][number]["summary"],
) => {
  if (summary.type !== "pass_fail") {
    throw new Error(
      `Cannot format pretty pass-rate results for "${model_name}" in "${benchmark_name}" because it uses score-based results.`,
    );
  }

  return summary.total_evals === 0
    ? 0
    : summary.passed_evals / summary.total_evals;
};

export const format_pretty_results = (results: benchmark_result[]) => {
  return results
    .map((benchmark) => {
      const rows = benchmark.models
        .map((model_result) => {
          const summary = model_result.summary;
          const pass_rate = pass_rate_for_summary(
            benchmark.name,
            model_result.model,
            summary,
          );

          return {
            model: model_result.model,
            pass_rate,
            summary: summary.type === "pass_fail" ? summary : undefined,
            duration_ms: model_result.timing.average_duration_ms,
          };
        })
        .sort(
          (left, right) =>
            right.pass_rate - left.pass_rate ||
            left.duration_ms - right.duration_ms,
        );

      const longest_model_name = rows.reduce(
        (longest, row) => Math.max(longest, row.model.length),
        0,
      );

      const lines = rows.map((row) => {
        const summary = row.summary;
        if (!summary) {
          throw new Error("Expected pass/fail summary while formatting results.");
        }

        const percentage = Math.round(row.pass_rate * 100);
        const fail_count = summary.total_evals - summary.passed_evals;

        return [
          row.model.padEnd(longest_model_name),
          format_bar(row.pass_rate),
          `${percentage}%`,
          `| total: ${summary.total_evals}`,
          `| fail-count: ${fail_count}`,
          `| avg-duration: ${Math.round(row.duration_ms)}ms`,
        ].join(" ");
      });

      return [`Benchmark Results: ${benchmark.name}`, "", ...lines].join("\n");
    })
    .join("\n\n");
};
