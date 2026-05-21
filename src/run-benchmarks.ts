import { OpenRouter } from "@openrouter/sdk";
import { writeFile } from "node:fs/promises";

import { summarize_eval_results } from "./evaluation.js";
import { run_openrouter_text_completion } from "./openrouter.js";
import type {
  benchmark_eval,
  benchmark_eval_result,
  benchmark_model_result,
  benchmark_opts,
  benchmark_result,
  model_opts,
  run_benchmarks_options,
  verbose_benchmark_result,
} from "./types.js";

const summarize_benchmark_result = (
  result: verbose_benchmark_result,
): benchmark_result => ({
  name: result.name,
  models: result.models.map((model_result) => ({
    model: model_result.model,
    summary: model_result.summary,
  })),
});

const evaluate_output = (
  output: string,
  eval_definition: benchmark_eval,
) => {
  switch (eval_definition.evaluator.type) {
    case "exact_match":
      return output.trim() === eval_definition.expected.trim();
    case "includes":
      return output.includes(eval_definition.expected.trim());
    case "function":
      return eval_definition.evaluator.func(output, eval_definition.expected);
  }
};

export async function run_benchmarks(
  api_key: string,
  model_list: model_opts[],
  benchmark_list: benchmark_opts[],
): Promise<benchmark_result[]>;
export async function run_benchmarks(
  api_key: string,
  model_list: model_opts[],
  benchmark_list: benchmark_opts[],
  options: { verbose?: false },
): Promise<benchmark_result[]>;
export async function run_benchmarks(
  api_key: string,
  model_list: model_opts[],
  benchmark_list: benchmark_opts[],
  options: { verbose: true },
): Promise<verbose_benchmark_result[]>;
export async function run_benchmarks(
  api_key: string,
  model_list: model_opts[],
  benchmark_list: benchmark_opts[],
  options?: run_benchmarks_options,
): Promise<benchmark_result[] | verbose_benchmark_result[]> {
  const client = new OpenRouter({
    apiKey: api_key,
  });
  const results: Array<benchmark_result | verbose_benchmark_result> = [];

  for (const benchmark of benchmark_list) {
    const model_results: benchmark_model_result[] = [];

    for (const model of model_list) {
      const eval_results: benchmark_eval_result[] = [];

      for (const eval_definition of benchmark.evals) {
        const eval_with_defaults: benchmark_eval = {
          ...eval_definition,
          system_prompt:
            eval_definition.system_prompt ?? benchmark.system_prompt,
        };
        const output = await run_openrouter_text_completion(
          client,
          model,
          eval_with_defaults,
        );
        const evaluator_result = evaluate_output(output, eval_with_defaults);
        const result =
          typeof evaluator_result === "boolean"
            ? {
              type: "pass_fail" as const,
              passed: evaluator_result,
            }
            : {
              type: "score" as const,
              score: evaluator_result,
            };

        eval_results.push({
          system_prompt: eval_with_defaults.system_prompt,
          prompt: eval_with_defaults.prompt,
          expected: eval_with_defaults.expected,
          output,
          result,
        });
      }

      model_results.push({
        model: model.name,
        evals: eval_results,
        summary: summarize_eval_results(eval_results),
      });
    }

    const verbose_benchmark_result: verbose_benchmark_result = {
      name: benchmark.name,
      models: model_results,
    };
    const output_result = options?.verbose
      ? verbose_benchmark_result
      : summarize_benchmark_result(verbose_benchmark_result);
    results.push(output_result);

    if (benchmark.output.filename) {
      await writeFile(
        benchmark.output.filename,
        JSON.stringify(output_result, null, 2),
        "utf8",
      );
    }
  }

  return results;
}
