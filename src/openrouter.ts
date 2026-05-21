import type { OpenRouter } from "@openrouter/sdk";

import type { eval_opts, model_opts } from "./types.js";

type eval_case_opts = eval_opts["cases"][number];

const create_openrouter_messages = (test_case: eval_case_opts) => [
  ...(test_case.system_prompt
    ? [
        {
          role: "system" as const,
          content: test_case.system_prompt,
        },
      ]
    : []),
  {
    role: "user" as const,
    content: test_case.prompt,
  },
];

export const run_openrouter_text_completion = async (
  client: OpenRouter,
  model: model_opts,
  test_case: eval_case_opts,
): Promise<string> => {
  const response = await client.chat.send({
    chatRequest: {
      model: model.name,
      messages: create_openrouter_messages(test_case),
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
