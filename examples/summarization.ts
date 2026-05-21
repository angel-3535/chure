import { benchmark_opts, run_benchmarks } from "../src/index.js";

import dotenv from "dotenv";
dotenv.config();

const score_required_terms = (output: string, expected?: string) => {
  const required_terms = expected
    ?.split(",")
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  if (!required_terms?.length) {
    return 0;
  }

  const normalized_output = output.toLowerCase();
  const matched_terms = required_terms.filter((term) =>
    normalized_output.includes(term),
  );

  return (matched_terms.length / required_terms.length) * 100;
};

const benchmark: benchmark_opts = {
  name: "meeting-summary",
  system_prompt:
    "Summarize the note in one sentence. Preserve the most important owner, task, and deadline or next step.",
  evals: [
    {
      prompt:
        "Meeting note: Priya will send the launch checklist to the design team by Friday. Marcus will review analytics after the campaign goes live.",
      expected: "priya, launch checklist, friday",
      evaluator: {
        type: "function",
        func: score_required_terms,
      },
    },
    {
      system_prompt:
        "Summarize the customer update in one sentence. Preserve the problem, impact, and next step.",
      prompt:
        "Customer update: The export job failed overnight, so finance could not download invoices. Engineering is retrying the job and will share a fix status by 2 PM.",
      expected: "export job, finance, 2 pm",
      evaluator: {
        type: "function",
        func: score_required_terms,
      },
    },
  ],
};

const models = ["openai/gpt-3.5-turbo"];

const result = await run_benchmarks({
  api_key: process.env["OPENROUTER_API_KEY"] ?? "",
  models,
  benchmarks: [benchmark],
  output_file: "meeting-summary.json",
});

console.log(JSON.stringify(result, null, 2));
