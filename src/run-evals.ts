import { OpenRouter } from "@openrouter/sdk";
import { writeFile } from "node:fs/promises";

import { summarize_case_results } from "./evaluation.js";
import { run_openrouter_text_completion } from "./openrouter.js";
import type {
  eval_case_result,
  eval_model_result,
  eval_opts,
  eval_result,
  model_opts,
  run_evals_options,
  verbose_eval_result,
} from "./types.js";

const summarize_eval_result = (result: verbose_eval_result): eval_result => ({
  name: result.name,
  models: result.models.map((model_result) => ({
    model: model_result.model,
    evaluation: model_result.evaluation,
  })),
});

export async function run_evals(
  api_key: string,
  model_list: model_opts[],
  eval_list: eval_opts[],
): Promise<eval_result[]>;
export async function run_evals(
  api_key: string,
  model_list: model_opts[],
  eval_list: eval_opts[],
  options: { verbose?: false },
): Promise<eval_result[]>;
export async function run_evals(
  api_key: string,
  model_list: model_opts[],
  eval_list: eval_opts[],
  options: { verbose: true },
): Promise<verbose_eval_result[]>;
export async function run_evals(
  api_key: string,
  model_list: model_opts[],
  eval_list: eval_opts[],
  options?: run_evals_options,
): Promise<eval_result[] | verbose_eval_result[]> {
  const client = new OpenRouter({
    apiKey: api_key,
  });
  const results: Array<eval_result | verbose_eval_result> = [];

  for (const benchmark_scenario of eval_list) {
    const model_results: eval_model_result[] = [];

    for (const model of model_list) {
      const case_results: eval_case_result[] = [];

      for (const test_case of benchmark_scenario.cases) {
        const output = await run_openrouter_text_completion(
          client,
          model,
          test_case,
        );
        const evaluation_result =
          test_case.evaluator.type === "exact_match"
            ? output.trim() === test_case.expected.trim()
            : test_case.evaluator.func(output, test_case.expected);
        const evaluation =
          typeof evaluation_result === "boolean"
            ? {
              type: "pass_fail" as const,
              passed: evaluation_result,
            }
            : {
              type: "score" as const,
              score: evaluation_result,
            };

        case_results.push({
          system_prompt: test_case.system_prompt,
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

    const verbose_eval_result: verbose_eval_result = {
      name: benchmark_scenario.name,
      models: model_results,
    };
    const output_result = options?.verbose
      ? verbose_eval_result
      : summarize_eval_result(verbose_eval_result);
    results.push(output_result);

    if (benchmark_scenario.output.filename) {
      await writeFile(
        benchmark_scenario.output.filename,
        JSON.stringify(output_result, null, 2),
        "utf8",
      );
    }
  }

  return results;
}
