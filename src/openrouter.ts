import type { OpenRouter } from "@openrouter/sdk";
import { performance } from "node:perf_hooks";

import type { benchmark_eval, benchmark_eval_timing, model_opts } from "./types.js";

const create_openrouter_messages = (eval_definition: benchmark_eval) => [
  ...(eval_definition.system_prompt
    ? [
        {
          role: "system" as const,
          content: eval_definition.system_prompt,
        },
      ]
    : []),
  {
    role: "user" as const,
    content: eval_definition.prompt,
  },
];

export const run_openrouter_text_completion = async (
  client: OpenRouter,
  model: model_opts,
  eval_definition: benchmark_eval,
): Promise<{
  output: string;
  timing: benchmark_eval_timing;
}> => {
  const started_at = performance.now();
  const response = await client.chat.send({
    chatRequest: {
      model: model.name,
      messages: create_openrouter_messages(eval_definition),
      ...(model.reasoning
        ? {
            reasoning: {
              effort: model.reasoning,
            },
          }
        : {}),
      stream: false,
    },
  });
  const duration_ms = performance.now() - started_at;

  return {
    output: String(response.choices[0]?.message.content ?? ""),
    timing: {
      duration_ms,
    },
  };
};

const format_model_list = (model_names: string[]) =>
  model_names.map((model_name) => `"${model_name}"`).join(", ");

const get_model_suggestions = (
  invalid_model_name: string,
  available_model_names: string[],
) =>
  available_model_names
    .filter((model_name) => model_name.endsWith(`/${invalid_model_name}`))
    .slice(0, 3);

const format_suggestions = (
  invalid_model_names: string[],
  available_model_names: string[],
) => {
  const suggestions = invalid_model_names
    .map((model_name) => {
      const model_suggestions = get_model_suggestions(
        model_name,
        available_model_names,
      );

      if (model_suggestions.length === 0) {
        return undefined;
      }

      return `${model_name}: ${format_model_list(model_suggestions)}`;
    })
    .filter((suggestion) => suggestion !== undefined);

  if (suggestions.length === 0) {
    return "";
  }

  return `\nDid you mean:\n${suggestions
    .map((suggestion) => `- ${suggestion}`)
    .join("\n")}`;
};

const supports_text_completion = (
  model: Awaited<ReturnType<OpenRouter["models"]["list"]>>["data"][number],
) =>
  model.architecture.inputModalities.includes("text") &&
  model.architecture.outputModalities.includes("text");

export const validate_openrouter_models = async (
  client: OpenRouter,
  model_list: model_opts[],
) => {
  const requested_model_names = [
    ...new Set(model_list.map((model) => model.name)),
  ];

  if (requested_model_names.length === 0) {
    return;
  }

  const available_models = await client.models.list();
  const available_model_names = available_models.data.map((model) => model.id);
  const available_model_by_name = new Map(
    available_models.data.map((model) => [model.id, model]),
  );
  const invalid_model_names = requested_model_names.filter(
    (model_name) => !available_model_by_name.has(model_name),
  );
  const unsupported_model_names = requested_model_names.filter((model_name) => {
    const model = available_model_by_name.get(model_name);

    return model !== undefined && !supports_text_completion(model);
  });

  if (invalid_model_names.length === 0 && unsupported_model_names.length === 0) {
    return;
  }

  const message_parts = [
    ...(invalid_model_names.length > 0
      ? [
          `Invalid OpenRouter model name(s): ${format_model_list(invalid_model_names)}.`,
          "Use model ids returned by client.models.list(), such as provider/model.",
        ]
      : []),
    ...(unsupported_model_names.length > 0
      ? [
          `Unsupported OpenRouter model(s) for text benchmarks: ${format_model_list(unsupported_model_names)}.`,
          "Chure currently supports models with text input and text output.",
        ]
      : []),
    "No benchmarks were run.",
  ];

  throw new Error(
    message_parts.join("\n") +
      format_suggestions(invalid_model_names, available_model_names),
  );
};
