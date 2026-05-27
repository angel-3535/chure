import type { model_result } from "./types.js";

const BAR_WIDTH = 20;

const format_bar = (pass_rate: number) => {
  const filled_count = Math.round(pass_rate * BAR_WIDTH);
  const empty_count = BAR_WIDTH - filled_count;

  return `${"█".repeat(filled_count)}${"░".repeat(empty_count)}`;
};

const pass_rate_for_summary = (
  model_name: string,
  benchmark_name: string,
  summary: model_result["benchmarks"][number]["summary"],
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

export const format_pretty_results = (results: model_result[]) => {
  return results
    .map((model_result) => {
      const rows = model_result.benchmarks
        .map((benchmark_result) => {
          const summary = benchmark_result.summary;
          const pass_rate = pass_rate_for_summary(
            model_result.model,
            benchmark_result.name,
            summary,
          );

          return {
            benchmark: benchmark_result.name,
            pass_rate,
            summary: summary.type === "pass_fail" ? summary : undefined,
          };
        })
        .sort((left, right) => right.pass_rate - left.pass_rate);

      const longest_benchmark_name = rows.reduce(
        (longest, row) => Math.max(longest, row.benchmark.length),
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
          row.benchmark.padEnd(longest_benchmark_name),
          format_bar(row.pass_rate),
          `${percentage}%`,
          `| total: ${summary.total_evals}`,
          `| fail-count: ${fail_count}`,
        ].join(" ");
      });

      return [`Model Results: ${model_result.model}`, "", ...lines].join("\n");
    })
    .join("\n\n");
};
