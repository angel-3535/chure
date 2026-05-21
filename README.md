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

Set your OpenRouter API key and pass it to the function `run_benchmarks`.

## Basic Example

```ts
import { format_pretty_results, run_benchmarks } from "chure";
import type { benchmark_opts } from "chure";

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
};

const models = ["openai/gpt-3.5-turbo"];

const result = await run_benchmarks({
  api_key: process.env["OPENROUTER_API_KEY"] ?? "",
  models,
  benchmarks: [benchmark],
  output_file: "output.json",
});

console.log(format_pretty_results(result));
```
