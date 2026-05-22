import {
  format_pretty_results,
  run_benchmarks,
} from "../src/index.js";
import type { benchmark_opts, model_input } from "../src/index.js";

import dotenv from "dotenv";
dotenv.config();

const normalize_label = (output: string) =>
  output.trim().toLowerCase().replace(/[.!]/g, "");

const label_matches = (output: string, expected?: string) =>
  normalize_label(output).startsWith(expected ?? "");

const benchmark: benchmark_opts = {
  name: "mistake-spotting",
  system_prompt:
    "Decide whether the text contains a mistake. Do not run code. Respond with exactly one label: mistake or correct.",
  evals: [
    {
      prompt: "Sentence: The report are due tomorrow.",
      expected: "mistake",
      evaluator: {
        type: "function",
        func: label_matches,
      },
    },
    {
      prompt: "Sentence: The deployment finished after the tests passed.",
      expected: "correct",
      evaluator: {
        type: "function",
        func: label_matches,
      },
    },
    {
      prompt:
        "Code: function isEven(n) { return n % 2 === 1; } // should return true for even numbers",
      expected: "mistake",
      evaluator: {
        type: "function",
        func: label_matches,
      },
    },
    {
      prompt:
        "Code: const total = prices.reduce((sum, price) => sum + price, 0);",
      expected: "correct",
      evaluator: {
        type: "function",
        func: label_matches,
      },
    },
  ],
};

const models: model_input[] = [
  "openai/gpt-4o-mini",
  "openai/gpt-3.5-turbo",
];

const result = await run_benchmarks({
  api_key: process.env["OPENROUTER_API_KEY"] ?? "",
  models,
  benchmarks: [benchmark],
  output_file: "mistake-spotting.json",
});

console.log(format_pretty_results(result));
