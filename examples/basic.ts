import { create_eval, model_opts, run_evals } from "../src";

import dotenv from "dotenv";
dotenv.config();

//ideal example of how chure will work

const test = create_eval({
  name: "eval",
  cases: [
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
});

const models: model_opts[] = [
  {
    name: "gpt-3.5-turbo",
    reasoning: "low",
  },
];

const result = await run_evals(process.env["OPENROUTER_API_KEY"] ?? "", models, [
  test,
]);
console.log(JSON.stringify(result, null, 2));
