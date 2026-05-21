import type { OpenRouter } from "@openrouter/sdk";

import type { benchmark_eval, model_opts } from "./types.js";

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
): Promise<string> => {
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

  return String(response.choices[0]?.message.content ?? "");
};
