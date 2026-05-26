# Contributing

Retrograde uses pnpm workspaces and strict TypeScript.

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## Standards

- Use TypeScript strict mode.
- Use zod for external data.
- Use pino for structured logs.
- Use viem for EVM code.
- Use Bull, not BullMQ.
- Use Fastify, not Express.
- Keep commits conventional and scoped.
