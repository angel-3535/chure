import { benchmark_opts, run_benchmarks } from "../src/index.js";

import dotenv from "dotenv";
dotenv.config();

const benchmark: benchmark_opts = {
  name: "model-validation-demo",
  system_prompt: "Answer with only the final word.",
  evals: [
    {
      prompt: "What color is the sky on a clear day?",
      expected: "blue",
      evaluator: {
        type: "includes",
      },
    },
  ],
};

const models = ["openai/gpt-3.5-turbo", "totally-legit-ai"];

try {
  const result = await run_benchmarks({
    api_key: process.env["OPENROUTER_API_KEY"] ?? "",
    models,
    benchmarks: [benchmark],
    output_file: "model-validation-demo.json",
  });

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(
    "Benchmark failed. Check that every model name exists and supports text.",
  );
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
