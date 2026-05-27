import { run_eval } from "../src/index.js";
import type { benchmark_eval } from "../src/index.js";

import dotenv from "dotenv";
dotenv.config();

const eval_definition: benchmark_eval = {
  prompt: "What is the capital of France?",
  expected: "Paris",
  evaluator: {
    type: "exact_match",
  },
};

const result = await run_eval(
  "openai/gpt-3.5-turbo",
  eval_definition,
  "Respond as shortly as possible",
);

console.log(JSON.stringify(result, null, 2));
