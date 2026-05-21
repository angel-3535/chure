import { OpenRouter } from "@openrouter/sdk";
import { writeFile } from "node:fs/promises";

import {
  summarize_case_results,
  summarize_model_results,
} from "./evaluation.js";
import type {
  eval_case_result,
  eval_model_result,
  eval_opts,
  eval_result,
  model_opts,
} from "./types.js";

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
