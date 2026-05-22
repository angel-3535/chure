import type {
  benchmark_eval_result,
  benchmark_timing_summary,
  eval_summary,
} from "./types.js";

const average_score = (scores: number[]) => {
  return scores.length == 0
    ? 0
    : scores.reduce((total, score) => total + score, 0) / scores.length;
};

const average_or_null = (values: number[]): number | null => {
  return values.length === 0
    ? null
    : values.reduce((total, value) => total + value, 0) / values.length;
};

export const summarize_eval_results = (
  evals: benchmark_eval_result[],
): eval_summary => {
  if (evals.every((eval_result) => eval_result.result.type === "pass_fail")) {
    return {
      type: "pass_fail",
      passed: evals.every(
        (eval_result) =>
          eval_result.result.type === "pass_fail" && eval_result.result.passed,
      ),
      passed_evals: evals.filter(
        (eval_result) =>
          eval_result.result.type === "pass_fail" && eval_result.result.passed,
      ).length,
      total_evals: evals.length,
    };
  }

  return {
    type: "score",
    score: average_score(
      evals.map((eval_result) =>
        eval_result.result.type === "score"
          ? eval_result.result.score
          : eval_result.result.passed
            ? 100
            : 0,
      ),
    ),
  };
};

export const summarize_timing_results = (
  evals: benchmark_eval_result[],
): benchmark_timing_summary => {
  const openrouter_latencies = evals
    .map((eval_result) => eval_result.timing.openrouter.latency_ms)
    .filter((value): value is number => value !== null);
  const openrouter_generation_times = evals
    .map((eval_result) => eval_result.timing.openrouter.generation_time_ms)
    .filter((value): value is number => value !== null);

  return {
    average_duration_ms: average_score(
      evals.map((eval_result) => eval_result.timing.duration_ms),
    ),
    average_openrouter_latency_ms: average_or_null(openrouter_latencies),
    average_openrouter_generation_time_ms: average_or_null(
      openrouter_generation_times,
    ),
  };
};
