import type {
  benchmark_eval,
  benchmark_eval_result,
  eval_result,
  eval_summary,
} from "./types.js";

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

export const evaluate_output = (
  output: string,
  eval_definition: benchmark_eval,
): eval_result => {
  const evaluator_result = (() => {
    switch (eval_definition.evaluator.type) {
      case "exact_match":
        return output.trim() === eval_definition.expected.trim();
      case "includes":
        return output.includes(eval_definition.expected.trim());
      case "function":
        return eval_definition.evaluator.func(output, eval_definition.expected);
    }
  })();

  return typeof evaluator_result === "boolean"
    ? {
        type: "pass_fail",
        passed: evaluator_result,
      }
    : {
        type: "score",
        score: evaluator_result,
      };
};
