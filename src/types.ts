export type evaluator_result = number | boolean;

export type evaluator_function = (
  output: string,
  expected?: string,
) => evaluator_result;

export interface benchmark_eval {
  system_prompt?: string;
  prompt: string;
  expected: string;
  evaluator:
    | {
        type: "exact_match";
      }
    | {
        type: "includes";
      }
    | {
        type: "function";
        func: evaluator_function;
      };
}

export interface benchmark_opts {
  name: string;
  system_prompt?: string;
  evals: benchmark_eval[];
}

export interface model_opts {
  name: string;
  reasoning?: "low" | "medium" | "high";
}

export type model_input = string | model_opts;

export type eval_result =
  | {
      type: "pass_fail";
      passed: boolean;
    }
  | {
      type: "score";
      score: number;
    };

export type eval_summary =
  | {
      type: "pass_fail";
      passed: boolean;
      passed_evals: number;
      total_evals: number;
    }
  | {
      type: "score";
      score: number;
    };

export interface benchmark_eval_timing {
  duration_ms: number;
}

export interface benchmark_timing_summary {
  average_duration_ms: number;
}

export interface benchmark_eval_result {
  system_prompt?: string;
  prompt: string;
  expected: string;
  output: string;
  result: eval_result;
  timing: benchmark_eval_timing;
}

export interface benchmark_model_result {
  model: string;
  evals: benchmark_eval_result[];
  summary: eval_summary;
  timing: benchmark_timing_summary;
}

export interface benchmark_model_summary_result {
  model: string;
  summary: eval_summary;
  timing: benchmark_timing_summary;
}

export interface benchmark_result {
  name: string;
  models: benchmark_model_summary_result[];
}

export interface verbose_benchmark_result {
  name: string;
  models: benchmark_model_result[];
}

export interface run_benchmarks_options {
  api_key: string;
  models: model_input[];
  benchmarks: benchmark_opts[];
  output_file?: string;
}
