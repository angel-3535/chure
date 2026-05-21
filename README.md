# chure

`chure` is an early TypeScript SDK for defining and running text-based LLM benchmarks through OpenRouter.

The package is still in development, so the API may change while the core workflow is being shaped.

## What it does today

- Runs prompt-based benchmark evals against one or more OpenRouter models
- Supports text-only models
- Supports simple `exact_match`, `includes`, and custom function evaluators
- Can write JSON results to a file
- Includes a small pretty-printer for benchmark output

## Setup

Install dependencies:

```sh
pnpm install
```

Set your OpenRouter API key:

```sh
export OPENROUTER_API_KEY=your_api_key_here
```

If you use a `.env` file, the examples already load it with `dotenv`.

## Basic Example

```ts
import {
  format_pretty_results,
  run_benchmarks,
} from "chure";
import type { benchmark_opts, model_opts } from "chure";

const benchmark: benchmark_opts = {
  name: "capitals",
  system_prompt: "Respond as shortly as possible",
  evals: [
    {
      prompt: "What is the capital of France?",
      expected: "Paris",
      evaluator: {
        type: "exact_match",
      },
    },
  ],
  output: {
    format: "json",
    filename: "output.json",
  },
};

const models: model_opts[] = [
  {
    name: "openai/gpt-3.5-turbo",
  },
];

const result = await run_benchmarks(
  process.env["OPENROUTER_API_KEY"] ?? "",
  models,
  [benchmark],
);

console.log(format_pretty_results(result));
```
