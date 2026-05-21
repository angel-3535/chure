# AGENTS.md

## Project Context

This project is intended to become a TypeScript SDK for building and running LLM benchmarks. The first supported benchmark target is text-based models only.

The main product goal is ease of setup: a developer should be able to define an evaluation, connect one or more model providers, run the benchmark, and inspect results with as little ceremony as possible.

The maintainer is new to SDK and npm package development. Future work should include clear explanations of package structure, TypeScript choices, public API design, build tooling, testing, versioning, and publishing tradeoffs as changes are made.

## Working Principles

- Prefer simple, well-documented public APIs over clever abstractions.
- Treat SDK ergonomics as a core feature. Example usage should be easy to read before the internals are optimized.
- Start with text-only evaluation support. Avoid adding multimodal assumptions until explicitly requested.
- Keep provider integrations loosely coupled so benchmarks can run against different LLM vendors or local model adapters.
- Design types first where useful, because this package should feel reliable and discoverable in editors.
- Keep dependencies minimal, especially for the core SDK.
- Build incrementally. Not everything added has to be final; expect to grow the SDK slowly and refactor often as the right API becomes clearer.
- Don't create abstractions the user didn't ask for.
- Do not add fields or abstractions before there is a concrete need for them.
- Explain any new npm, TypeScript, build, test, or release concept in plain language when introducing it.

## Development Guidance

- Use TypeScript for source files.
- Prefer ESM-compatible package setup unless project constraints later require dual package output.
- Add tests for public API behavior before expanding internals.
- Include small runnable examples as soon as the first API exists.
- Keep README examples current with the actual API.
- Avoid committing generated build output unless the package/publishing setup requires it.

## Communication Guidance

When making changes for this project:

- Explain what changed and why.
- Explain any SDK or npm-package concept that affects the decision.
- Call out tradeoffs without overcomplicating the first version.
- Prefer incremental setup over a large framework-heavy scaffold.
