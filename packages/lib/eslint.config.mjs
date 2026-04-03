// @ts-check

import baseEslintConfig from "@polymeer/config/eslint/eslint.config.base.mjs"

export default [
  ...baseEslintConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]
