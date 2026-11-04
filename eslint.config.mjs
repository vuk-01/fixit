import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // AGENTS.md rule 2: lib/email/send.ts is the only place that sends email (ticket #12)
  {
    ignores: ["lib/email/send.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "resend", message: "Only lib/email/send.ts may import resend (AGENTS.md rule 2)." }] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
