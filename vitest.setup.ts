import { vi } from "vitest"

// `server-only` throws outside a React Server environment, so every test that
// imports a server module (e.g. lib/email/send.ts) needs it mocked (Tech.md §12).
vi.mock("server-only", () => ({}))
