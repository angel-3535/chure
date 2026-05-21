import { OpenRouter } from "@openrouter/sdk";
import { writeFile } from "node:fs/promises";

import { summarize_eval_results } from "./evaluation.js";
import {
  run_openrouter_text_completion,
  validate_openrouter_models,
} from "./openrouter.js";
import type {
  benchmark_eval,
  benchmark_model_result,
  model_opts,
  run_benchmarks_options,
  verbose_benchmark_result,
} from "./types.js";

const evaluate_output = (output: string, eval_definition: benchmark_eval) => {
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
  options: run_benchmarks_options,
): Promise<verbose_benchmark_result[]> {
  const model_list: model_opts[] = options.models.map((model) =>
    typeof model === "string" ? { name: model } : model,
  );
  const client = new OpenRouter({
    apiKey: options.api_key,
  });
  await validate_openrouter_models(client, model_list);

  // Run every benchmark against every model and every eval.
  const results = await Promise.all(
    options.benchmarks.map(async (benchmark) => {
      const model_results = await Promise.all(
        model_list.map(async (model): Promise<benchmark_model_result> => {
          const eval_results = await Promise.all(
            benchmark.evals.map(async (eval_definition) => {
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
              const evaluator_result = evaluate_output(
                output,
                eval_with_defaults,
              );
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

              return {
                system_prompt: eval_with_defaults.system_prompt,
                prompt: eval_with_defaults.prompt,
                expected: eval_with_defaults.expected,
                output,
                result,
              };
            }),
          );

          return {
            model: model.name,
            evals: eval_results,
            summary: summarize_eval_results(eval_results),
          };
        }),
      );

      const verbose_benchmark_result: verbose_benchmark_result = {
        name: benchmark.name,
        models: model_results,
      };

      return verbose_benchmark_result;
    }),
  );

  // JSON is the only output format today, so the option is just the file path.
  if (options.output_file) {
    await writeFile(
      options.output_file,
      JSON.stringify(results, null, 2),
      "utf8",
    );
  }

  return results;
}
