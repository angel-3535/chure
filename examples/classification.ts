import { benchmark_opts, model_opts, run_benchmarks } from "../src/index.js";

import dotenv from "dotenv";
dotenv.config();

const benchmark: benchmark_opts = {
  name: "support-ticket-routing",
  system_prompt:
    "Classify the support ticket into exactly one label: billing, technical, or account. Respond with only the label.",
  evals: [
    {
      prompt: "I was charged twice for my monthly plan. Can someone fix this?",
      expected: "billing",
      evaluator: {
        type: "exact_match",
      },
    },
    {
      prompt: "I forgot my password and no longer have access to my old phone.",
      expected: "account",
      evaluator: {
        type: "exact_match",
      },
    },
  ],
  output: {
    format: "json",
    filename: "support-ticket-routing.json",
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
  { verbose: true },
);

console.log(JSON.stringify(result, null, 2));
