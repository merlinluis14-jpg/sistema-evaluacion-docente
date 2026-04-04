import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "create-alumno.js",
    "getdiff.js",
    "getlog.js",
    "getstat.js",
    "jest.config.js",
    "query.js",
    "scripts/benchmark-ca1.cjs",
  ]),
]);

export default eslintConfig;
