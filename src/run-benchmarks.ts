import { OpenRouter } from "@openrouter/sdk";
import { writeFile } from "node:fs/promises";

import { summarize_eval_results } from "./evaluation.js";
import { validate_openrouter_models } from "./openrouter.js";
import { normalize_model_input, run_eval_with_client } from "./run-eval.js";
import type {
  benchmark_opts,
  model_opts,
  model_benchmark_result,
  run_benchmarks_options,
  verbose_model_result,
} from "./types.js";

async function run_benchmark_for_model(
  client: OpenRouter,
  model: model_opts,
  benchmark: benchmark_opts,
): Promise<model_benchmark_result> {
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
    name: benchmark.name,
    evals: eval_results,
    summary: summarize_eval_results(eval_results),
  };
}

async function run_model_benchmarks(
  client: OpenRouter,
  model: model_opts,
  benchmarks: benchmark_opts[],
): Promise<verbose_model_result> {
  const benchmark_results = await Promise.all(
    benchmarks.map((benchmark) =>
      run_benchmark_for_model(client, model, benchmark),
    ),
  );

  return {
    model: model.name,
    benchmarks: benchmark_results,
  };
}

export async function run_benchmarks(
  options: run_benchmarks_options,
): Promise<verbose_model_result[]> {
  const model_list: model_opts[] = options.models.map(normalize_model_input);
  const client = new OpenRouter({
    apiKey: options.api_key,
  });
  await validate_openrouter_models(client, model_list);

  // Run every model against every benchmark and every eval.
  const results = await Promise.all(
    model_list.map((model) =>
      run_model_benchmarks(client, model, options.benchmarks),
    ),
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
