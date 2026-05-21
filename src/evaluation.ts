import type {
  eval_case_result,
  eval_model_result,
  eval_summary,
} from "./types.js";

const average_score = (scores: number[]) => {
  if (scores.length === 0) {
    return 0;
  }

  return scores.reduce((total, score) => total + score, 0) / scores.length;
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

export const summarize_model_results = (
  models: eval_model_result[],
): eval_summary => {
  if (models.every((result) => result.evaluation.type === "pass_fail")) {
    //count total passed cases and total cases across all benchmarks for this model
    const passed_cases = models.reduce(
      (total, result) =>
        total +
        (result.evaluation.type === "pass_fail"
          ? result.evaluation.passed_cases
          : 0),
      0,
    );
    const total_cases = models.reduce(
      (total, result) =>
        total +
        (result.evaluation.type === "pass_fail"
          ? result.evaluation.total_cases
          : 0),
      0,
    );

    return {
      type: "pass_fail",
      passed: models.every(
        (result) =>
          result.evaluation.type === "pass_fail" && result.evaluation.passed,
      ),
      passed_cases,
      total_cases,
    };
  }

  return {
    type: "score",
    score: average_score(
      models.map((result) =>
        result.evaluation.type === "score"
          ? result.evaluation.score
          : (result.evaluation.passed_cases / result.evaluation.total_cases) *
          100,
      ),
    ),
  };
};
