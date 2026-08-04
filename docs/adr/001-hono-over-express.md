# ADR 001: Selection of Hono Web Framework Over Express

## Context
MediaHub requires a high-performance, lightweight, and type-safe HTTP server engine to handle high-throughput media analysis requests, binary streaming, and Server-Sent Events (SSE).

## Decision
We chose **Hono** over Express.js.

## Rationale
- **Performance**: Benchmark performance up to 5x faster request handling and lower memory overhead compared to legacy Express.
- **First-class TypeScript Support**: End-to-end type safety for request context (`c.req`, `c.json`, route parameters, environment typing).
- **Web Standards Compliance**: Native support for standard Web APIs (`Fetch`, `Response`, `ReadableStream`).
- **SSE Stream Ergonomics**: Clean native streaming support for Server-Sent Events without external middleware hacks.

## Consequences
- Requires developers to use Web Standard stream abstractions (`ReadableStream`).
- Compatible with Edge runtimes (Cloudflare Workers, Bun, Deno, Node.js).
