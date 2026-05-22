import type { OpenRouter } from "@openrouter/sdk";
import assert from "node:assert/strict";
import test from "node:test";

import {
  run_openrouter_text_completion,
  validate_openrouter_models,
} from "../src/openrouter.js";
import type { benchmark_eval, model_opts } from "../src/types.js";

const create_client_with_models = (model_ids: string[]) =>
  ({
    models: {
      list: async () => ({
        data: model_ids.map((id) => ({
          id,
          architecture: {
            inputModalities: ["text"],
            outputModalities: ["text"],
          },
        })),
      }),
    },
  }) as unknown as OpenRouter;

const create_client_with_model_data = (
  models: Array<{
    id: string;
    input_modalities: string[];
    output_modalities: string[];
  }>,
) =>
  ({
    models: {
      list: async () => ({
        data: models.map((model) => ({
          id: model.id,
          architecture: {
            inputModalities: model.input_modalities,
            outputModalities: model.output_modalities,
          },
        })),
      }),
    },
  }) as unknown as OpenRouter;

const create_client_with_completion = () =>
  ({
    chat: {
      send: async () => ({
        id: "gen-test-123",
        choices: [
          {
            message: {
              content: "mistake",
            },
          },
        ],
      }),
    },
  }) as unknown as OpenRouter;

const mistake_spotting_eval: benchmark_eval = {
  prompt: "Sentence: The report are due tomorrow.",
  expected: "mistake",
  evaluator: {
    type: "exact_match",
  },
};

test("validate_openrouter_models accepts model ids returned by OpenRouter", async () => {
  const client = create_client_with_models([
    "openai/gpt-3.5-turbo",
    "deepseek/deepseek-chat",
  ]);
  const models: model_opts[] = [
    {
      name: "openai/gpt-3.5-turbo",
    },
  ];

  await assert.doesNotReject(validate_openrouter_models(client, models));
});

test("validate_openrouter_models rejects unknown model ids with a useful message", async () => {
  const client = create_client_with_models([
    "openai/gpt-3.5-turbo",
    "deepseek/deepseek-chat",
  ]);
  const models: model_opts[] = [
    {
      name: "gpt-3.5-turbo",
    },
    {
      name: "made-up/model",
    },
  ];

  await assert.rejects(
    validate_openrouter_models(client, models),
    (error) => {
      assert(error instanceof Error);
      assert.match(
        error.message,
        /Invalid OpenRouter model name\(s\): "gpt-3\.5-turbo", "made-up\/model"\./,
      );
      assert.match(
        error.message,
        /Use model ids returned by client\.models\.list\(\)/,
      );
      assert.match(error.message, /gpt-3\.5-turbo: "openai\/gpt-3\.5-turbo"/);
      assert.match(error.message, /No benchmarks were run\./);
      return true;
    },
  );
});

test("validate_openrouter_models rejects models without text input and output", async () => {
  const client = create_client_with_model_data([
    {
      id: "openai/gpt-image",
      input_modalities: ["text"],
      output_modalities: ["image"],
    },
  ]);
  const models: model_opts[] = [
    {
      name: "openai/gpt-image",
    },
  ];

  await assert.rejects(
    validate_openrouter_models(client, models),
    (error) => {
      assert(error instanceof Error);
      assert.match(
        error.message,
        /Unsupported OpenRouter model\(s\) for text benchmarks: "openai\/gpt-image"\./,
      );
      assert.match(error.message, /text input and text output/);
      assert.match(error.message, /No benchmarks were run\./);
      return true;
    },
  );
});

test("run_openrouter_text_completion returns output and local timing metadata", async () => {
  const client = create_client_with_completion();

  const result = await run_openrouter_text_completion(
    client,
    { name: "openai/gpt-4o-mini" },
    mistake_spotting_eval,
  );

  assert.equal(result.output, "mistake");
  assert.equal(typeof result.timing.duration_ms, "number");
  assert(result.timing.duration_ms >= 0);
});
