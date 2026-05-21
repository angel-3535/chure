import {
  benchmark_opts,
  format_pretty_results,
  run_benchmarks,
} from "../src/index.js";
import type { model_input } from "../src/index.js";

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
};

const models: model_input[] = [
  "openai/gpt-3.5-turbo",
  {
    name: "deepseek/deepseek-chat",
    reasoning: "medium",
  },
];

const result = await run_benchmarks({
  api_key: process.env["OPENROUTER_API_KEY"] ?? "",
  models,
  benchmarks: [benchmark],
  output_file: "output.json",
});
console.log(format_pretty_results(result));
