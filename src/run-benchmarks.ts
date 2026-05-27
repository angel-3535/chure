import { OpenRouter } from "@openrouter/sdk";
import { writeFile } from "node:fs/promises";

import { summarize_eval_results } from "./evaluation.js";
import { validate_openrouter_models } from "./openrouter.js";
import { normalize_model_input, run_eval_with_client } from "./run-eval.js";
import type {
  benchmark_model_result,
  model_opts,
  run_benchmarks_options,
  verbose_benchmark_result,
} from "./types.js";

export async function run_benchmarks(
  options: run_benchmarks_options,
): Promise<verbose_benchmark_result[]> {
  const model_list: model_opts[] = options.models.map(normalize_model_input);
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
            benchmark.evals.map((eval_definition) =>
              run_eval_with_client(
                client,
                model,
                eval_definition,
                benchmark.system_prompt,
              ),
            ),
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
