export type evaluator_result = number | boolean;

export type evaluator_function = (
  output: string,
  expected?: string,
) => evaluator_result;

export interface eval_opts {
  name: string;
  cases: {
    prompt: string;
    expected: string;
    evaluator:
      | {
          type: "exact_match";
        }
      | {
          type: "function";
          func: evaluator_function;
        };
  }[];
  output: {
    format: "json";
    filename?: string;
  };
}

export interface model_opts {
  name: string;
  reasoning: "low" | "medium" | "high";
}

export type eval_case_evaluation =
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
      passed_cases: number;
      total_cases: number;
    }
  | {
      type: "score";
      score: number;
    };

export interface eval_case_result {
  prompt: string;
  expected: string;
  output: string;
  evaluation: eval_case_evaluation;
}

export interface eval_model_result {
  model: string;
  cases: eval_case_result[];
  evaluation: eval_summary;
}

export interface eval_result {
  name: string;
  models: eval_model_result[];
  evaluation: eval_summary;
}
