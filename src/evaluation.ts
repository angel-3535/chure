import type { benchmark_eval_result, eval_summary } from "./types.js";

const average_score = (scores: number[]) => {
  return scores.length == 0
    ? 0
    : scores.reduce((total, score) => total + score, 0) / scores.length;
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
