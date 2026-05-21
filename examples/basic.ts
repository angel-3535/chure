import { create_eval, run_evals } from "../src";

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

const models = [
  {
    name: "gpt-3.5-turbo",
    reasoning: "low",
  },
];

const result = run_evals([test], [models]);
console.log(result);
