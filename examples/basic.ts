import { benchmark_opts, model_opts, run_benchmarks } from "../src/index.js";

import dotenv from "dotenv";
dotenv.config();

//ideal example of how chure will work

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
    {
      prompt: "What is the capital of Germany?",
      expected: "Berlin",
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
    name: "gpt-3.5-turbo",
  },
  {
    name: "deepseek/deepseek-v4-flash",
    reasoning: "medium",
  },
];

const result = await run_benchmarks(
  process.env["OPENROUTER_API_KEY"] ?? "",
  models,
  [benchmark],
  { verbose: true },
);
console.log(JSON.stringify(result, null, 2));
