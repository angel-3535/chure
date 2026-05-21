import type { eval_case_result, eval_summary } from "./types.js";

const average_score = (scores: number[]) => {
  return scores.length == 0
    ? 0
    : scores.reduce((total, score) => total + score, 0) / scores.length;
};

export const summarize_case_results = (
  cases: eval_case_result[],
): eval_summary => {
  if (cases.every((result) => result.evaluation.type === "pass_fail")) {
    return {
      type: "pass_fail",
      passed: cases.every(
        (result) =>
          result.evaluation.type === "pass_fail" && result.evaluation.passed,
      ),
      passed_cases: cases.filter(
        (result) =>
          result.evaluation.type === "pass_fail" && result.evaluation.passed,
      ).length,
      total_cases: cases.length,
    };
  }

  return {
    type: "score",
    score: average_score(
      cases.map((result) =>
        result.evaluation.type === "score"
          ? result.evaluation.score
          : result.evaluation.passed
            ? 100
            : 0,
      ),
    ),
  };
};
