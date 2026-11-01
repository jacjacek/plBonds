import { FlatCompat } from "@eslint/eslintrc"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import { dirname } from "node:path"
const require = createRequire(import.meta.url)
const compat = new FlatCompat({
  baseDirectory: fileURLToPath(new URL(".", import.meta.url)),
  resolvePluginsRelativeTo: dirname(require.resolve("eslint-config-next/package.json")),
})
const config = [
  { ignores: [".next/**", "out/**", "node_modules/**", "test-results/**", "playwright-report/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
]
export default config
