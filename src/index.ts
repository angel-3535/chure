import { OpenRouter } from "@openrouter/sdk";
import { writeFile } from "node:fs/promises";

export interface eval_opts {
  name: string;
  cases: {
    prompt: string;
    expected: string;
    evaluator:
    | {
      type: "exact_match";
    }
    | {
      type: "function";
      func: (output: string, expected?: string) => number | boolean; //0-100;
    };
  }[];
  output: {
    format: "json";
    filename?: string;
  };
}

export interface model_opts {
  name: string;
  reasoning: "low" | "medium" | "high";
}

export type eval_case_evaluation =
  | {
      type: "pass_fail";
      passed: boolean;
    }
  | {
      type: "score";
      score: number;
    };

export type eval_summary =
  | {
      type: "pass_fail";
      passed: boolean;
      passed_cases: number;
      total_cases: number;
    }
  | {
      type: "score";
      score: number;
    };

export interface eval_case_result {
  prompt: string;
  expected: string;
  output: string;
  evaluation: eval_case_evaluation;
}

export interface eval_model_result {
  model: string;
  cases: eval_case_result[];
  evaluation: eval_summary;
}

export interface eval_result {
  name: string;
  models: eval_model_result[];
  evaluation: eval_summary;
}

export const create_eval = (opts: eval_opts) => {
  return opts;
};

const evaluate_output = (
  output: string,
  expected: string,
  evaluator: eval_opts["cases"][number]["evaluator"],
): eval_case_evaluation => {
  if (evaluator.type === "exact_match") {
    return {
      type: "pass_fail",
      passed: output.trim() === expected.trim(),
    };
  }

  const result = evaluator.func(output, expected);

  if (typeof result === "boolean") {
    return {
      type: "pass_fail",
      passed: result,
    };
  }

  return {
    type: "score",
    score: result,
  };
};

const average_score = (scores: number[]) => {
  if (scores.length === 0) {
    return 0;
  }

  return scores.reduce((total, score) => total + score, 0) / scores.length;
};

const evaluation_to_score = (evaluation: eval_case_evaluation) => {
  if (evaluation.type === "score") {
    return evaluation.score;
  }

  return evaluation.passed ? 100 : 0;
};

const is_pass_fail_case_result = (
  result: eval_case_result,
): result is eval_case_result & {
  evaluation: Extract<eval_case_evaluation, { type: "pass_fail" }>;
} => result.evaluation.type === "pass_fail";

const is_pass_fail_model_result = (
  result: eval_model_result,
): result is eval_model_result & {
  evaluation: Extract<eval_summary, { type: "pass_fail" }>;
} => result.evaluation.type === "pass_fail";

const summarize_case_results = (cases: eval_case_result[]): eval_summary => {
  const pass_fail_cases = cases.filter(is_pass_fail_case_result);

  if (pass_fail_cases.length === cases.length) {
    return {
      type: "pass_fail",
      passed: pass_fail_cases.every((result) => result.evaluation.passed),
      passed_cases: pass_fail_cases.filter((result) => result.evaluation.passed)
        .length,
      total_cases: cases.length,
    };
  }

  return {
    type: "score",
    score: average_score(
      cases.map((result) => evaluation_to_score(result.evaluation)),
    ),
  };
};

const summarize_model_results = (models: eval_model_result[]): eval_summary => {
  const pass_fail_models = models.filter(is_pass_fail_model_result);

  if (pass_fail_models.length === models.length) {
    const passed_cases = pass_fail_models.reduce(
      (total, result) => total + result.evaluation.passed_cases,
      0,
    );
    const total_cases = pass_fail_models.reduce(
      (total, result) => total + result.evaluation.total_cases,
      0,
    );

    return {
      type: "pass_fail",
      passed: pass_fail_models.every((result) => result.evaluation.passed),
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

export const run_evals = async (
  api_key: string,
  model_list: model_opts[],
  eval_list: eval_opts[],
): Promise<eval_result[]> => {
  const client = new OpenRouter({
    apiKey: api_key,
  });
  const results: eval_result[] = [];

  for (const benchmark_scenario of eval_list) {
    const model_results: eval_model_result[] = [];

    for (const model of model_list) {
      const case_results: eval_case_result[] = [];

      for (const test_case of benchmark_scenario.cases) {
        const response = await client.chat.send({
          chatRequest: {
            model: model.name,
            messages: [
              {
                role: "user",
                content: test_case.prompt,
              },
            ],
            reasoning: {
              effort: model.reasoning,
            },
            stream: false,
          },
        });
        const output = String(response.choices[0]?.message.content ?? "");
        const evaluation = evaluate_output(
          output,
          test_case.expected,
          test_case.evaluator,
        );

        case_results.push({
          prompt: test_case.prompt,
          expected: test_case.expected,
          output,
          evaluation,
        });
      }

      model_results.push({
        model: model.name,
        cases: case_results,
        evaluation: summarize_case_results(case_results),
      });
    }

    const eval_result: eval_result = {
      name: benchmark_scenario.name,
      models: model_results,
      evaluation: summarize_model_results(model_results),
    };
    results.push(eval_result);

    if (benchmark_scenario.output.filename) {
      await writeFile(
        benchmark_scenario.output.filename,
        JSON.stringify(eval_result, null, 2),
        "utf8",
      );
    }
  }

  return results;
};
