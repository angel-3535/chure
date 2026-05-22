import assert from "node:assert/strict";
import test from "node:test";

import { format_pretty_results } from "../src/pretty-results.js";
import type { benchmark_result } from "../src/types.js";

test("format_pretty_results renders pass rates as unicode bars", () => {
  const results: benchmark_result[] = [
    {
      name: "capitals",
      models: [
        {
          model: "meta-llama/llama-3.1",
          summary: {
            type: "pass_fail",
            passed: false,
            passed_evals: 1,
            total_evals: 4,
          },
          timing: {
            average_duration_ms: 1100,
          },
        },
        {
          model: "openai/gpt-4o-mini",
          summary: {
            type: "pass_fail",
            passed: false,
            passed_evals: 3,
            total_evals: 4,
          },
          timing: {
            average_duration_ms: 900,
          },
        },
      ],
    },
  ];

  assert.equal(
    format_pretty_results(results),
    [
      "Benchmark Results: capitals",
      "",
      "openai/gpt-4o-mini   ███████████████░░░░░ 75% | total: 4 | fail-count: 1 | avg-duration: 900ms",
      "meta-llama/llama-3.1 █████░░░░░░░░░░░░░░░ 25% | total: 4 | fail-count: 3 | avg-duration: 1100ms",
    ].join("\n"),
  );
});

test("format_pretty_results shows local duration", () => {
  const results: benchmark_result[] = [
    {
      name: "capitals",
      models: [
        {
          model: "openai/gpt-4o-mini",
          summary: {
            type: "pass_fail",
            passed: true,
            passed_evals: 4,
            total_evals: 4,
          },
          timing: {
            average_duration_ms: 941,
          },
        },
      ],
    },
  ];

  assert.equal(
    format_pretty_results(results),
    [
      "Benchmark Results: capitals",
      "",
      "openai/gpt-4o-mini ████████████████████ 100% | total: 4 | fail-count: 0 | avg-duration: 941ms",
    ].join("\n"),
  );
});

test("format_pretty_results sorts tied pass rates by faster timing", () => {
  const results: benchmark_result[] = [
    {
      name: "capitals",
      models: [
        {
          model: "slower-model",
          summary: {
            type: "pass_fail",
            passed: true,
            passed_evals: 2,
            total_evals: 2,
          },
          timing: {
            average_duration_ms: 1000,
          },
        },
        {
          model: "faster-model",
          summary: {
            type: "pass_fail",
            passed: true,
            passed_evals: 2,
            total_evals: 2,
          },
          timing: {
            average_duration_ms: 500,
          },
        },
      ],
    },
  ];

  assert.match(
    format_pretty_results(results),
    /^Benchmark Results: capitals\n\nfaster-model/m,
  );
});

test("format_pretty_results rejects score summaries because pass rate is unavailable", () => {
  const results: benchmark_result[] = [
    {
      name: "summaries",
      models: [
        {
          model: "openai/gpt-4o-mini",
          summary: {
            type: "score",
            score: 87,
          },
          timing: {
            average_duration_ms: 500,
          },
        },
      ],
    },
  ];

  assert.throws(
    () => format_pretty_results(results),
    /Cannot format pretty pass-rate results/,
  );
});
