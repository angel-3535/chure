import { OpenRouter } from "@openrouter/sdk";
import type { OpenRouter as OpenRouterClient } from "@openrouter/sdk";

import { evaluate_output } from "./evaluation.js";
import {
  run_openrouter_text_completion,
  validate_openrouter_models,
} from "./openrouter.js";
import type {
  benchmark_eval,
  benchmark_eval_result,
  model_input,
  model_opts,
} from "./types.js";

export const normalize_model_input = (model: model_input): model_opts =>
  typeof model === "string" ? { name: model } : model;

const get_openrouter_api_key_from_env = () => {
  const api_key = process.env["OPENROUTER_API_KEY"];

  if (!api_key) {
    throw new Error(
      "OPENROUTER_API_KEY is required to use run_eval. Set the environment variable or call run_eval_with_key.",
    );
  }

  return api_key;
};

export async function run_eval_with_client(
  client: OpenRouterClient,
  model: model_input,
  eval_definition: benchmark_eval,
  system_prompt?: string,
): Promise<benchmark_eval_result> {
  const model_opts = normalize_model_input(model);
  const eval_with_defaults: benchmark_eval = {
    ...eval_definition,
    system_prompt: eval_definition.system_prompt ?? system_prompt,
  };
  const output = await run_openrouter_text_completion(
    client,
    model_opts,
    eval_with_defaults,
  );

  return {
    system_prompt: eval_with_defaults.system_prompt,
    prompt: eval_with_defaults.prompt,
    expected: eval_with_defaults.expected,
    output,
    result: evaluate_output(output, eval_with_defaults),
  };
}

export async function run_eval_with_key(
  api_key: string,
  model: model_input,
  eval_definition: benchmark_eval,
  system_prompt?: string,
): Promise<benchmark_eval_result> {
  if (!api_key) {
    throw new Error("api_key is required to use run_eval_with_key.");
  }

  const client = new OpenRouter({
    apiKey: api_key,
  });
  const model_opts = normalize_model_input(model);

  await validate_openrouter_models(client, [model_opts]);

  return run_eval_with_client(
    client,
    model_opts,
    eval_definition,
    system_prompt,
  );
}

export async function run_eval(
  model: model_input,
  eval_definition: benchmark_eval,
  system_prompt?: string,
): Promise<benchmark_eval_result> {
  return run_eval_with_key(
    get_openrouter_api_key_from_env(),
    model,
    eval_definition,
    system_prompt,
  );
}
