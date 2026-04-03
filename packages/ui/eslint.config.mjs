// @ts-check

import baseEslintConfig from "@polymeer/config/eslint/eslint.config.react.mjs"

export default [
  {
    ignores: ["**/components/*"],
  },
  ...baseEslintConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]
